# 中文版改造说明（Transformer Explainer 中文化）

本仓库在英文原版基础上，加入了「切换到中文 GPT-2」所需的全部代码改动。
核心设计：**一个 `ACTIVE_MODEL` 开关**。

- 默认 `ACTIVE_MODEL = 'gpt2'` —— 英文版，开箱即用（`npm run dev` 直接能跑）。
- 跑完下面的生成步骤、把开关改为 `'gpt2-zh'` —— 切换为中文版。

中文模型用的是 **`uer/gpt2-chinese-cluecorpussmall`**：结构与英文 GPT-2 完全一致
（12 层 / 12 头 / 768 维），词表 21128，**字符级中文（不再有乱码字节碎片）**。
所以可视化界面无需改动，1 个汉字 ≈ 1 个 token。

---

## 前置依赖

- 一台**有网络**的机器（要从 HuggingFace 下载模型），装好 Python 3 + PyTorch：
  ```bash
  pip install torch transformers onnx
  ```
- Node ≥ 20、npm ≥ 10（跑前端）。

---

## 步骤 1：生成中文模型资产

在**仓库根目录**执行：

```bash
python3 src/utils/model/export_chinese.py
```

它会一次性完成 4 件事：

1. 下载 `uer/gpt2-chinese-cluecorpussmall`，把权重映射进「会输出中间注意力张量」的 GPT 结构；
2. 导出 ONNX 到 `src/utils/model/params_output/gpt2.onnx`；
3. 保存浏览器端分词器到 `static/models/gpt2-chinese/`（含 `tokenizer.json`，transformers.js 本地加载，无需联网）；
4. 把 ONNX 切成 10MB 一块，覆盖写入 `static/model-v2/gpt2.onnx.part*`。

脚本结束会打印一行 **`N = <chunk 数>`**，记下这个数字。

> ⚠️ 留意脚本输出里 `tokenizer.json 是否生成: True`。
> 如果是 False，说明没生成 fast tokenizer，transformers.js 可能加载不了——
> 届时把输出贴给 Claude，我帮你换成手动转换分词器的方案。

---

## 步骤 2：填入 chunk 数 N

打开 `src/store/index.ts`，找到 `modelMetaMap['gpt2-zh']`，把 `chunkTotal` 改成步骤 1 打印的 N：

```ts
'gpt2-zh': {
    ...
    chunkTotal: 63, // ← 改成实际的 N（中文模型更小，通常 < 63）
    ...
}
```

---

## 步骤 3：翻开关到中文

同样在 `src/store/index.ts`，把：

```ts
export const ACTIVE_MODEL = 'gpt2';
```

改为：

```ts
export const ACTIVE_MODEL = 'gpt2-zh';
```

---

## 步骤 4：本地验证

```bash
npm run dev
```

打开 http://localhost:5173/ ，在输入框输入中文（如「人工智能正在改变」），
应能看到：分词为单个汉字、注意力矩阵正常、下一个 token 预测为中文。

> 桌面端：模型加载完会**自动跑一次实时推理**（中文版没有预生成缓存，属正常）。
> 加载需要下载 ~数百 MB 的 chunk，第一次会慢，之后浏览器 Cache API 会缓存。

---

## ⚠️ 关于示例缓存（已知问题，当前禁用）

实测：用 onnxruntime 离线生成的中文 `ex0..ex4` 体积过大（每个 prompt 含 720 个
注意力张量，最长的 ~2.9MB）。Vite/Rollup 在 **SSR / 打包**时解析这种超大单行对象
字面量会卡死（dev 与 `npm run build` 都会 100% CPU 长时间不返回）。这与「渲染中文」
无关，纯粹是静态文件太大拖垮工具链。

因此当前：`hasCachedExamples=false`，`ex0..ex4` 仍是英文占位。
- embedding 文字由 `+page.svelte` 的 `onMount` **即时分词**填充 → 立刻显示中文；
- 其余区块在 456MB 模型加载完成后由**实时推理**填充为中文；
- 代价：放弃了「首屏秒开」和「移动端」（移动端只用缓存、不下载模型）。

若将来要恢复缓存：需先解决大文件问题（例如把 outputs 量化/抽稀、或改成运行时
`fetch` 二进制而非 JS 模块导入），不要再用下面这种「整包 JSON 进 JS 模块」的方式。

<details><summary>（已废弃）原始的浏览器捕获步骤</summary>

## 步骤 5（已废弃）：生成示例缓存

英文版的 `src/constants/examples/ex0.js ~ ex4.js` 是预跑好的结果，用于首屏秒开和移动端。
中文版需要重新生成。开发期已内置一个浏览器助手：

1. 确认步骤 3、4 已完成，中文模型能实时跑。
2. 在输入框输入 `src/store/index.ts` 里 `inputTextExampleMap['gpt2-zh']` 的第 1 句，等推理动画结束。
3. 浏览器控制台执行（把结果复制到剪贴板）：
   ```js
   copy(window.__dumpExample('ex0'))
   ```
4. 粘贴覆盖 `src/constants/examples/ex0.js`。
5. 对第 2~5 句重复，分别生成 `ex1`…`ex4`（注意变量名要对应）。
6. 全部完成后，把 `modelMetaMap['gpt2-zh'].hasCachedExamples` 改为 `true`。

> 不做这步也能用，只是没有首屏秒开、移动端不可用。

</details>

---

## 步骤 6：提交中文模型权重（注意大文件）

中文权重也有数百 MB，且 `static/model-v2/` 默认被 `.gitignore` 排除（防止误提交导致推送中断）。
当你确认要把模型纳入仓库（GitHub Pages 部署需要）时，有两个稳妥办法：

**办法 A：分批提交（已验证可行）**
临时放开 gitignore 后，把 63 个 chunk 分几批 `git add` + `commit` + `push`，每批约 10 个：
```bash
# 先在 .gitignore 注释掉 static/model-v2/ 这一行
git add static/model-v2/gpt2.onnx.part{0..9}   && git commit -m "model 1/7" && git push
git add static/model-v2/gpt2.onnx.part{10..19} && git commit -m "model 2/7" && git push
# ……以此类推
```

**办法 B：Git LFS**
```bash
git lfs install
git lfs track "static/model-v2/*"
git add .gitattributes static/model-v2/ && git commit -m "model via LFS" && git push
```

> 单次推送 ~600MB 容易被网络中断——这正是当初建仓库时遇到的问题，所以务必分批或用 LFS。

---

## 部署到 GitHub Pages

```bash
npm run build
npm run deploy   # gh-pages 发布
```

注意 `svelte.config.js` 里 `paths.base` 目前仍是 `/transformer-explainer`。
若你希望线上路径是 `/transformer-explainer-zh`，把它改掉再 build/deploy。

---

## 同步上游英文版改动

本仓库是「代码-only 干净历史」，与上游没有共同祖先，不能直接 `git rebase upstream/main`。
需要同步上游时：
```bash
git fetch upstream
# 手动 review 上游改动，挑选需要的代码 cherry-pick 或手动合并
```
（需要的话让 Claude 帮你比对 upstream/main 与当前代码的差异。）

---

## 一句话回滚

任何时候想退回英文版：把 `src/store/index.ts` 的 `ACTIVE_MODEL` 改回 `'gpt2'` 即可，
英文 chunk 仍在本地 `static/model-v2/`（若未被中文覆盖）。

---

## 涉及的文件改动一览

| 文件 | 改动 |
|------|------|
| `src/utils/model/export_chinese.py` | **新增**：中文模型导出 + 分词器导出 + 切块（本机跑） |
| `src/store/index.ts` | `ACTIVE_MODEL` 开关、`modelMetaMap['gpt2-zh']`、中文示例提示、`activeModelMeta` |
| `src/types/global.d.ts` | `ModelMetaData` 增加 tokenizer / localTokenizer / addSpecialTokens / hasCachedExamples |
| `src/routes/+page.svelte` | 按配置加载（本地）分词器、chunk 数读配置、无缓存时实时跑、dev 捕获助手 |
| `src/utils/data.ts` | 分词 `add_special_tokens:false`（中文 Bert 必需） |
| `src/utils/captureExample.ts` | **新增**：开发期生成示例缓存的浏览器助手 |
| `.gitignore` | 排除 `static/model-v2/`（大文件，防误提交） |
