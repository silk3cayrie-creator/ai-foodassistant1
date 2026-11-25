"use strict";

const $ = (selector) => document.querySelector(selector);
const elements = {
  modelStatus: $("#modelStatus"), fileInput: $("#fileInput"), dropZone: $("#dropZone"), uploadPrompt: $("#uploadPrompt"),
  previewWrap: $("#previewWrap"), previewImage: $("#previewImage"), replaceImage: $("#replaceImage"), analyzeButton: $("#analyzeButton"),
  servingSize: $("#servingSize"), mealType: $("#mealType"), healthGoal: $("#healthGoal"), emptyResult: $("#emptyResult"),
  resultContent: $("#resultContent"), resultPanel: $("#resultPanel"), foodName: $("#foodName"), foodDescription: $("#foodDescription"),
  confidenceRing: $("#confidenceRing"), confidenceValue: $("#confidenceValue"), uncertainNotice: $("#uncertainNotice"),
  manualFood: $("#manualFood"), applyCorrection: $("#applyCorrection"), servingBadge: $("#servingBadge"), nutritionGrid: $("#nutritionGrid"),
  nutritionBars: $("#nutritionBars"), adviceText: $("#adviceText"), predictionList: $("#predictionList"), foodSearch: $("#foodSearch"),
  foodLibrary: $("#foodLibrary"), noSearchResult: $("#noSearchResult"), historyList: $("#historyList"), historyEmpty: $("#historyEmpty"),
  exportHistory: $("#exportHistory"), clearHistory: $("#clearHistory"), toast: $("#toast")
};

let classifier = null;
let imageReady = false;
let activeFoodId = null;
let activeDetectedClass = null;
let activeDisplayName = null;
let activeConfidence = null;
let latestPredictions = [];
let toastTimer = null;
const HISTORY_KEY = "foodLensHistoryV1";
const MODEL_URL = "assets/food101-model/mobilenet_v2_food101.onnx";
const MODEL_INPUT_SIZE = 224;

function setModelStatus(type, text) {
  elements.modelStatus.className = `status-pill ${type}`;
  elements.modelStatus.querySelector("span:last-child").textContent = text;
}

async function loadModel() {
  try {
    setModelStatus("is-loading", "Food-101 模型加载中");
    if (!window.ort) throw new Error("ONNX Runtime Web 未加载");
    window.ort.env.wasm.numThreads = 1;
    window.ort.env.wasm.proxy = false;
    window.ort.env.wasm.wasmPaths = new URL(
      "assets/vendor/onnxruntime/",
      document.baseURI
    ).href;
    classifier = await window.ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all"
    });
    setModelStatus("is-ready", "Food-101 模型已就绪");
    updateAnalyzeAvailability();
  } catch (error) {
    console.error("模型加载失败", error);
    setModelStatus("is-error", "AI 模型加载失败");
    showToast("AI 模型未能加载，仍可使用营养百科和手动查询");
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function updateAnalyzeAvailability() {
  elements.analyzeButton.disabled = !(imageReady && classifier);
}

function validateFile(file) {
  const types = ["image/jpeg", "image/png", "image/webp"];
  if (!types.includes(file.type)) return "请选择 JPG、PNG 或 WEBP 格式的图片";
  if (file.size > 10 * 1024 * 1024) return "图片不能超过 10 MB";
  return "";
}

function handleFile(file) {
  const validationError = validateFile(file);
  if (validationError) return showToast(validationError);
  const reader = new FileReader();
  reader.onload = () => {
    imageReady = false;
    elements.previewImage.onload = () => {
      imageReady = true;
      updateAnalyzeAvailability();
      showToast("图片已准备好，可以开始识别");
    };
    elements.previewImage.onerror = () => showToast("图片读取失败，请换一张图片");
    elements.previewImage.src = reader.result;
    elements.uploadPrompt.hidden = true;
    elements.previewWrap.hidden = false;
  };
  reader.onerror = () => showToast("文件读取失败，请重试");
  reader.readAsDataURL(file);
}

function setupUpload() {
  elements.dropZone.addEventListener("click", (event) => {
    if (event.target !== elements.replaceImage) elements.fileInput.click();
  });
  elements.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); elements.fileInput.click(); }
  });
  elements.replaceImage.addEventListener("click", (event) => { event.stopPropagation(); elements.fileInput.click(); });
  elements.fileInput.addEventListener("change", () => {
    const file = elements.fileInput.files?.[0];
    if (file) handleFile(file);
    elements.fileInput.value = "";
  });
  ["dragenter", "dragover"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
    event.preventDefault(); elements.dropZone.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
    event.preventDefault(); elements.dropZone.classList.remove("is-dragging");
  }));
  elements.dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  });
}

function normalizeLabel(label) { return String(label || "").toLowerCase().trim().replaceAll(" ", "_"); }

function labelToChinese(label) {
  const normalized = normalizeLabel(label);
  return FOOD101_ZH[normalized] || normalized.replaceAll("_", " ");
}

function translatePrediction(label) {
  const normalized = normalizeLabel(label);
  const chinese = labelToChinese(normalized);
  return `${chinese}（${normalized.replaceAll("_", " ")}）`;
}

function matchFood(predictions) {
  const top = predictions[0];
  if (!top) return { foodId: null, confidence: 0, className: null };
  const className = normalizeLabel(top.className);
  return { foodId: FOOD101_TO_NUTRITION[className] || null, confidence: top.probability, className };
}

function imageToTensor(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) throw new Error("图片尺寸无效");

  const resizeScale = 256 / Math.min(width, height);
  const resizedWidth = Math.round(width * resizeScale);
  const resizedHeight = Math.round(height * resizeScale);
  const resizedCanvas = document.createElement("canvas");
  resizedCanvas.width = resizedWidth;
  resizedCanvas.height = resizedHeight;
  const resizedContext = resizedCanvas.getContext("2d", { willReadFrequently: true });
  resizedContext.fillStyle = "#ffffff";
  resizedContext.fillRect(0, 0, resizedWidth, resizedHeight);
  resizedContext.drawImage(image, 0, 0, resizedWidth, resizedHeight);

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = MODEL_INPUT_SIZE;
  cropCanvas.height = MODEL_INPUT_SIZE;
  const cropContext = cropCanvas.getContext("2d", { willReadFrequently: true });
  const cropX = Math.max(0, Math.floor((resizedWidth - MODEL_INPUT_SIZE) / 2));
  const cropY = Math.max(0, Math.floor((resizedHeight - MODEL_INPUT_SIZE) / 2));
  cropContext.drawImage(resizedCanvas, cropX, cropY, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  const pixels = cropContext.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE).data;
  const planeSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const tensorData = new Float32Array(planeSize * 3);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  for (let index = 0; index < planeSize; index += 1) {
    const pixel = index * 4;
    tensorData[index] = (pixels[pixel] / 255 - mean[0]) / std[0];
    tensorData[planeSize + index] = (pixels[pixel + 1] / 255 - mean[1]) / std[1];
    tensorData[planeSize * 2 + index] = (pixels[pixel + 2] / 255 - mean[2]) / std[2];
  }
  return new window.ort.Tensor("float32", tensorData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
}

function topFood101Predictions(logits, limit = 5) {
  const maxLogit = Math.max(...logits);
  const probabilities = Array.from(logits, (value) => Math.exp(value - maxLogit));
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  return probabilities
    .map((value, index) => ({ className: FOOD101_CLASSES[index], probability: value / total }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, limit);
}

async function classifyFoodImage(image) {
  const tensor = imageToTensor(image);
  const feeds = { [classifier.inputNames[0]]: tensor };
  const output = await classifier.run(feeds);
  return topFood101Predictions(output[classifier.outputNames[0]].data, 5);
}

async function analyzeImage() {
  if (!classifier || !imageReady) return;
  setBusy(true);
  try {
    latestPredictions = await classifyFoodImage(elements.previewImage);
    const match = matchFood(latestPredictions);
    if (match.foodId) {
      renderResult(match.foodId, match.confidence, latestPredictions, match.confidence < 0.35, match.className);
      saveHistory(match.foodId, match.confidence, false);
    } else {
      renderUnmatchedResult(latestPredictions);
    }
    elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    console.error("识别失败", error);
    showToast("识别失败，请换一张主体更清楚的图片重试");
  } finally {
    setBusy(false);
  }
}

function setBusy(busy) {
  elements.analyzeButton.classList.toggle("is-busy", busy);
  elements.analyzeButton.disabled = busy || !(imageReady && classifier);
  elements.analyzeButton.querySelector(".button-label").textContent = busy ? "AI 正在分析" : "开始 AI 识别";
}

function renderUnmatchedResult(predictions) {
  activeFoodId = null;
  activeDetectedClass = predictions[0]?.className || null;
  activeDisplayName = activeDetectedClass ? labelToChinese(activeDetectedClass) : null;
  activeConfidence = predictions[0]?.probability ?? null;
  elements.emptyResult.hidden = true;
  elements.resultContent.hidden = false;
  elements.resultPanel.classList.remove("empty-state");
  elements.foodName.textContent = activeDisplayName ? `🍽️ ${activeDisplayName}` : "食品类别待确认";
  elements.foodDescription.textContent = activeDisplayName
    ? `Food-101 模型识别为“${activeDisplayName}”，但该菜品暂未对应到内置营养参考值。请保留识别结果，并在下方选择最接近的营养类别。`
    : "模型已完成分析，但没有得到可用的食品候选。请根据图片手动选择类别。";
  elements.confidenceRing.style.setProperty("--score", Math.round((predictions[0]?.probability || 0) * 100));
  elements.confidenceValue.textContent = `${Math.round((predictions[0]?.probability || 0) * 100)}%`;
  elements.uncertainNotice.hidden = false;
  elements.nutritionGrid.innerHTML = `<div class="nutrient"><span>等待校正</span><strong>—</strong><small>请选择食品</small></div>`;
  elements.nutritionBars.innerHTML = "";
  elements.adviceText.textContent = "完成食品类别校正后，系统会按照食用量生成营养估算和科普建议。";
  renderPredictions(predictions);
}

function renderResult(foodId, confidence, predictions = [], uncertain = false, detectedClass = null) {
  const food = FOOD_DATA[foodId];
  if (!food) return;
  activeFoodId = foodId;
  activeDetectedClass = detectedClass;
  activeDisplayName = detectedClass ? labelToChinese(detectedClass) : food.name;
  activeConfidence = confidence;
  const serving = clamp(Number(elements.servingSize.value) || 100, 10, 1000);
  elements.servingSize.value = serving;
  const factor = serving / 100;
  elements.emptyResult.hidden = true;
  elements.resultContent.hidden = false;
  elements.resultPanel.classList.remove("empty-state");
  elements.foodName.textContent = `${food.emoji} ${activeDisplayName}`;
  elements.foodDescription.textContent = detectedClass && activeDisplayName !== food.name
    ? `模型识别为“${activeDisplayName}”。当前营养估算按“${food.name}”类的每 100 克参考值换算；具体配方和烹调方式会带来差异。`
    : food.description;
  const score = confidence == null ? null : Math.round(confidence * 100);
  elements.confidenceRing.style.setProperty("--score", score ?? 100);
  elements.confidenceValue.textContent = score == null ? "已校正" : `${score}%`;
  elements.uncertainNotice.hidden = !uncertain;
  elements.manualFood.value = foodId;
  elements.servingBadge.textContent = `按 ${serving} 克估算`;
  const nutrients = [
    ["能量", food.kcal * factor, "千卡", 0], ["蛋白质", food.protein * factor, "克", 1],
    ["碳水", food.carbs * factor, "克", 1], ["脂肪", food.fat * factor, "克", 1],
    ["膳食纤维", food.fiber * factor, "克", 1], ["糖", food.sugar * factor, "克", 1],
    ["钠", food.sodium * factor, "毫克", 0], ["食用量", serving, "克", 0]
  ];
  elements.nutritionGrid.innerHTML = nutrients.map(([name, value, unit, digits]) =>
    `<div class="nutrient"><span>${name}</span><strong>${Number(value).toFixed(digits)}</strong><small>${unit}</small></div>`).join("");
  const barData = [
    ["蛋白质", food.protein * factor, Math.min(food.protein * factor / 30 * 100, 100), "g"],
    ["碳水", food.carbs * factor, Math.min(food.carbs * factor / 80 * 100, 100), "g"],
    ["脂肪", food.fat * factor, Math.min(food.fat * factor / 30 * 100, 100), "g"],
    ["纤维", food.fiber * factor, Math.min(food.fiber * factor / 10 * 100, 100), "g"]
  ];
  elements.nutritionBars.innerHTML = barData.map(([name, value, width, unit]) =>
    `<div class="bar-row"><span>${name}</span><div class="bar-track"><div class="bar-fill" style="--width:${width}%"></div></div><strong>${value.toFixed(1)}${unit}</strong></div>`).join("");
  elements.adviceText.textContent = buildAdvice(food, serving, elements.mealType.value, elements.healthGoal.value);
  renderPredictions(predictions);
}

function renderPredictions(predictions) {
  elements.predictionList.innerHTML = predictions.length
    ? predictions.map((item) => `<li><span>${escapeHtml(translatePrediction(item.className))}</span><strong>${Math.round(item.probability * 100)}%</strong></li>`).join("")
    : `<li><span>本结果由用户手动校正</span><strong>—</strong></li>`;
}

function buildAdvice(food, serving, meal, goal) {
  const mealNames = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" };
  const messages = [];
  if (food.fiber >= 2.5) messages.push("这份食品能提供一定膳食纤维");
  if (food.protein >= 10) messages.push("蛋白质含量相对突出");
  if (food.sodium >= 400) messages.push("钠含量可能较高，搭配时可减少其他高盐食物");
  if (food.sugar >= 15) messages.push("糖含量相对较高，建议留意份量和食用频率");
  if (food.fat >= 12) messages.push("脂肪含量相对较高，可搭配清淡蔬菜");
  if (!messages.length) messages.push("这类食品可作为多样化饮食的一部分");
  const goalAdvice = {
    balanced: "均衡饮食可同时安排蔬菜、主食和优质蛋白质来源。",
    energy: food.carbs >= 15 ? "它能提供一定碳水化合物，可结合活动量安排。" : "若用于补充能量，可搭配适量谷薯类主食。",
    protein: food.protein >= 10 ? "它可作为本餐蛋白质来源之一。" : "若关注蛋白质，可搭配蛋、奶、豆类或瘦肉。",
    light: food.sodium > 300 || food.fat > 10 ? "若关注清淡饮食，建议减少酱料、油炸和额外用盐。" : "当前食品本身相对适合清淡搭配，烹调时仍需控制油盐。"
  };
  return `按约 ${serving} 克、用于${mealNames[meal]}估算：${messages.join("；")}。${goalAdvice[goal]}以上为一般营养科普，不代替个体化医学建议。`;
}

function populateManualFood() {
  const options = Object.entries(FOOD_DATA).sort((a, b) => a[1].category.localeCompare(b[1].category, "zh-CN"));
  elements.manualFood.insertAdjacentHTML("beforeend", options.map(([id, food]) => `<option value="${id}">${food.emoji} ${food.name} · ${food.category}</option>`).join(""));
}

function applyManualCorrection() {
  const foodId = elements.manualFood.value;
  if (!foodId) return showToast("请先选择食品类别");
  renderResult(foodId, null, latestPredictions, false, null);
  saveHistory(foodId, null, true);
  showToast("已应用人工校正，并重新生成营养建议");
}

function renderLibrary(query = "") {
  const needle = query.trim().toLowerCase();
  const entries = Object.entries(FOOD_DATA).filter(([, food]) => !needle || `${food.name} ${food.category} ${food.tags}`.toLowerCase().includes(needle));
  elements.foodLibrary.innerHTML = entries.map(([id, food]) => `
    <article class="food-card">
      <span class="emoji" aria-hidden="true">${food.emoji}</span><div class="category">${food.category}</div><h3>${food.name}</h3>
      <div class="quick-data"><span><strong>${food.kcal}</strong> 千卡/100g</span><span>蛋白质 <strong>${food.protein}g</strong></span></div>
      <button type="button" data-food-id="${id}" aria-label="查看${food.name}营养信息">查看${food.name}</button>
    </article>`).join("");
  elements.noSearchResult.hidden = entries.length > 0;
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function saveHistory(foodId, confidence, corrected) {
  const food = FOOD_DATA[foodId];
  if (!food) return;
  const item = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, foodId, name: activeDisplayName || food.name, serving: Number(elements.servingSize.value) || 100, confidence: confidence == null ? null : Math.round(confidence * 100), corrected, timestamp: new Date().toISOString() };
  const history = [item, ...getHistory()].slice(0, 12);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  elements.historyEmpty.hidden = history.length > 0;
  elements.historyList.hidden = history.length === 0;
  elements.exportHistory.disabled = history.length === 0;
  elements.clearHistory.disabled = history.length === 0;
  elements.historyList.innerHTML = history.map((item) => {
    const food = FOOD_DATA[item.foodId] || { emoji: "🍽️" };
    const time = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(item.timestamp));
    const score = item.corrected ? "人工校正" : `${item.confidence ?? "—"}%`;
    return `<article class="history-item"><span class="history-emoji">${food.emoji}</span><div><strong>${escapeHtml(item.name)}</strong><small>${item.serving} 克 · ${score}</small></div><span>${time}</span></article>`;
  }).join("");
}

function clearHistory() {
  if (!getHistory().length) return;
  if (!window.confirm("确定清空本地识别记录吗？此操作无法撤销。")) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("识别记录已清空");
}

function exportHistory() {
  const history = getHistory();
  if (!history.length) return showToast("暂无可导出的记录");
  const rows = [["时间", "食品", "食用量(克)", "置信度", "是否人工校正"], ...history.map((item) => [new Date(item.timestamp).toLocaleString("zh-CN"), item.name, item.serving, item.confidence ?? "", item.corrected ? "是" : "否"])];
  const csv = "\ufeff" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `食鉴AI识别记录-${new Date().toISOString().slice(0, 10)}.csv` });
  link.click(); URL.revokeObjectURL(url); showToast("CSV 已导出");
}

function escapeHtml(value) {
  const div = document.createElement("div"); div.textContent = String(value); return div.innerHTML;
}
function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

function setupEvents() {
  setupUpload();
  elements.analyzeButton.addEventListener("click", analyzeImage);
  elements.applyCorrection.addEventListener("click", applyManualCorrection);
  elements.foodSearch.addEventListener("input", () => renderLibrary(elements.foodSearch.value));
  elements.foodLibrary.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-food-id]");
    if (!button) return;
    renderResult(button.dataset.foodId, null, [], false);
    elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("已打开该食品的营养信息");
  });
  [elements.servingSize, elements.mealType, elements.healthGoal].forEach((element) => element.addEventListener("change", () => {
    if (activeFoodId) renderResult(activeFoodId, activeConfidence, latestPredictions, false, activeDetectedClass);
  }));
  elements.exportHistory.addEventListener("click", exportHistory);
  elements.clearHistory.addEventListener("click", clearHistory);
}

function init() {
  populateManualFood();
  renderLibrary();
  renderHistory();
  setupEvents();
  loadModel();
}

init();
