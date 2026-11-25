# 食鉴 AI 食品识别与营养科普助手

这是《人工智能基础与应用》课程结课网页项目。用户上传或拍摄食品照片后，网页会在浏览器中运行 Food-101 专用模型，给出五个候选菜品及置信度。确认类别后，可按食用量查看营养估算和简单的饮食提示。

## 主要功能

- 上传、拖拽食品照片，手机端可调用相机
- 使用 Food-101 MobileNetV2 识别 101 种菜品
- 显示 Top 5 候选结果及中文名称
- 置信度较低或营养库未覆盖时支持手动校正
- 按食用量换算能量、蛋白质、碳水、脂肪、纤维、糖和钠
- 根据用餐场景和关注目标生成普通营养提示
- 内置 22 类常见食品营养参考数据
- 本地保存最近识别记录并导出 CSV
- 支持手机布局、键盘操作和错误提示

## 模型说明

项目使用 `AlexKoff88/mobilenet_v2_food101`。该模型采用 MobileNetV2 架构，在 Food-101 数据集上训练，模型卡报告的 Top-1 准确率为 76.3%，使用 Apache-2.0 许可证。上游附带的 ONNX 文件在实测中输出异常，因此项目从同一仓库的原始训练权重重新导出 ONNX，文件约 9.84 MB。

- 模型页面：https://huggingface.co/AlexKoff88/mobilenet_v2_food101
- 训练代码：https://github.com/AlexKoff88/mobilenetv2_food101
- 网页推理：ONNX Runtime Web 1.20.1

模型文件和运行库都放在项目中。图片只在当前浏览器参与推理，不会上传到本项目的服务器。模型仍可能混淆外观相近的菜品，Food-101 对中式菜品的覆盖也有限，因此网页保留了 Top 5 候选和人工校正。

重新导出的模型已分别用 Python ONNX Runtime 和 ONNX Runtime Web 检查。披萨测试图的第一候选均为 `pizza`，网页同款运行时的置信度约为 42.7%。这只能说明推理链路和标签顺序正常，不代表所有食品都能准确识别。

## 项目结构

```text
.
├── index.html                    页面结构
├── styles.css                    页面样式和响应式布局
├── food101-labels.js             101 类标签、中文名和营养映射
├── food-data.js                  22 类食品营养参考数据
├── app.js                        模型推理、营养计算和页面交互
├── assets/
│   ├── favicon.svg               网站图标
│   ├── food101-model/            Food-101 ONNX 模型
│   └── vendor/onnxruntime/       本地 ONNX Runtime Web 文件
├── tests/verify-project.mjs      静态完整性检查
├── .nojekyll                     GitHub Pages 静态文件标记
└── README.md                     运行和部署说明
```

## 本地运行

浏览器不能在 `file://` 页面中正常读取 ONNX 模型，因此不要直接双击 `index.html`。进入项目目录后启动本地 HTTP 服务：

```powershell
python -m http.server 8080
```

也可以使用 VS Code 的 Live Server。然后打开：

```text
http://localhost:8080
```

模型与运行库合计约 22 MB，第一次打开需要等待加载，之后浏览器通常会使用缓存。

## GitHub Pages 部署

1. 在 GitHub 新建公开仓库。
2. 上传本目录中的全部文件和文件夹。
3. 打开仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. 选择 `main` 分支和根目录 `/ (root)`，保存并等待发布。
6. 用无痕窗口检查模型加载、图片识别和手机布局。

## 检查项目

使用 Node.js 运行：

```powershell
node tests/verify-project.mjs
```

检查内容包括必需文件、HTML 元素引用、重复 ID、本地资源、Food-101 类别数量、中文标签、营养映射、模型文件、ONNX 推理配置和无障碍属性等。

建议用披萨、汉堡、炒饭、拉面、寿司、煎蛋卷、薯条和蛋糕等 Food-101 覆盖的菜品测试。照片尽量只保留一个主体，并减少包装、餐具和复杂背景的干扰。

## 数据与限制

- 识别结果是模型给出的概率判断，不等于确定答案。
- 营养数据是每 100 克可食部分的近似参考值，品牌、配方和烹调方式会造成差异。
- 101 类识别结果中，只有与内置营养库相近的菜品会自动换算；其他类别需要手动选择营养参考项。
- 本项目用于课程展示和营养科普，不用于疾病诊断、治疗或个体化膳食处方。
- 最近记录保存在浏览器 `localStorage` 中，清除浏览器数据后会丢失。

## 技术栈

- HTML5、CSS3、原生 JavaScript
- ONNX Runtime Web 1.20.1
- Food-101 MobileNetV2 ONNX
- localStorage
