import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const errors = [];
const checks = [];
const pass = (message) => checks.push(`PASS  ${message}`);
const fail = (message) => errors.push(`FAIL  ${message}`);
const assert = (condition, message) => condition ? pass(message) : fail(message);

const requiredFiles = [
  "index.html", "styles.css", "app.js", "food-data.js", "food101-labels.js", "README.md", ".nojekyll", "assets/favicon.svg",
  "assets/food101-model/mobilenet_v2_food101.onnx", "assets/vendor/onnxruntime/ort.min.js",
  "assets/vendor/onnxruntime/ort-wasm-simd-threaded.mjs", "assets/vendor/onnxruntime/ort-wasm-simd-threaded.wasm"
];
for (const file of requiredFiles) assert(fs.existsSync(path.join(root, file)), `存在 ${file}`);

const html = read("index.html");
const css = read("styles.css");
const app = read("app.js");
const dataCode = read("food-data.js");
const labelCode = read("food101-labels.js");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
assert(duplicateIds.length === 0, "HTML 中不存在重复 id");

const referencedIds = [...app.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
const missingIds = [...new Set(referencedIds.filter((id) => !ids.includes(id)))];
assert(missingIds.length === 0, `app.js 引用的 ${referencedIds.length} 个页面元素均存在${missingIds.length ? `：${missingIds.join(", ")}` : ""}`);

const localRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => !/^(?:https?:|#|mailto:|data:)/.test(ref));
const missingRefs = localRefs.filter((ref) => !fs.existsSync(path.join(root, ref)));
assert(missingRefs.length === 0, `HTML 本地资源引用完整${missingRefs.length ? `：${missingRefs.join(", ")}` : ""}`);

assert(/<html\s+lang="zh-CN"/.test(html), "页面声明中文语言");
assert(/<meta\s+name="viewport"/.test(html), "页面包含移动端 viewport");
assert(/<title>[^<]+<\/title>/.test(html), "页面包含有效标题");
assert(/class="skip-link"/.test(html), "页面包含键盘跳转链接");
assert(/aria-live="polite"/.test(html), "动态结果区域包含无障碍播报");
assert(!/<button(?![^>]*\btype=)[^>]*>/i.test(html), "所有按钮均显式声明 type");
assert(!/<img(?![^>]*\balt=)[^>]*>/i.test(html), "所有图片均包含 alt 文本");
assert((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, "CSS 花括号数量匹配");
assert(!/(?:sk-[A-Za-z0-9]{20,}|api[_-]?key\s*[:=]\s*["'][^"']+)/i.test(`${html}\n${app}\n${dataCode}\n${labelCode}`), "源码中未发现疑似 API 密钥");

const context = vm.createContext({});
vm.runInContext(`${dataCode}\n${labelCode}\n;globalThis.__FOOD_DATA = FOOD_DATA; globalThis.__FOOD101_CLASSES = FOOD101_CLASSES; globalThis.__FOOD101_ZH = FOOD101_ZH; globalThis.__FOOD101_TO_NUTRITION = FOOD101_TO_NUTRITION;`, context);
const foods = context.__FOOD_DATA;
const food101Classes = context.__FOOD101_CLASSES;
const food101Zh = context.__FOOD101_ZH;
const food101Mapping = context.__FOOD101_TO_NUTRITION;
const foodIds = Object.keys(foods);
assert(foodIds.length >= 20, `内置食品数据不少于 20 项（当前 ${foodIds.length} 项）`);
assert(foodIds.every((id) => ["kcal", "protein", "carbs", "fat", "fiber", "sugar", "sodium"].every((field) => Number.isFinite(foods[id][field]) && foods[id][field] >= 0)), "所有营养数值均为非负有限数");
assert(new Set(foodIds.map((id) => foods[id].name)).size === foodIds.length, "食品中文名称不重复");
assert(food101Classes.length === 101 && new Set(food101Classes).size === 101, "Food-101 类别清单包含 101 个不重复类别");
assert(food101Classes.every((name) => typeof food101Zh[name] === "string" && food101Zh[name].length > 0), "101 个模型类别均有中文名称");
assert(Object.entries(food101Mapping).every(([label, foodId]) => food101Classes.includes(label) && foods[foodId]), "Food-101 营养映射均指向有效类别和食品");
const modelPath = path.join(root, "assets", "food101-model", "mobilenet_v2_food101.onnx");
assert(fs.statSync(modelPath).size > 9_000_000, "Food-101 ONNX 模型文件大小有效");
assert(app.includes('const MODEL_URL = "assets/food101-model/mobilenet_v2_food101.onnx"'), "应用配置为加载 Food-101 本地模型");
assert(app.includes('InferenceSession.create(MODEL_URL') && app.includes('new URL(') && app.includes('document.baseURI'), "应用使用 ONNX Runtime Web 创建推理会话并解析绝对 WASM 路径");
assert(app.includes("transforms.Resize") === false && app.includes("resizeScale = 256"), "应用实现 256 缩放与 224 中心裁剪预处理");

for (const line of checks) console.log(line);
if (errors.length) {
  for (const line of errors) console.error(line);
  console.error(`\n验证失败：${errors.length} 项错误，${checks.length} 项通过。`);
  process.exit(1);
}
console.log(`\n验证完成：${checks.length} 项全部通过。`);
