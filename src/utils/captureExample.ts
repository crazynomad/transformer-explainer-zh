import { get } from 'svelte/store';
import { modelData, tokens, tokenIds, inputText } from '~/store';

/**
 * 开发期助手：用于生成中文版的「示例缓存」(src/constants/examples/ex0.js ~ ex4.js)。
 *
 * 背景：exN.js 里存的是某个 prompt 经模型实时跑出来的完整结果
 *      （logits + 每层每头注意力张量 outputs + 概率 + 采样），
 *      用于「首屏秒开」和「移动端唯一数据源」。换成中文模型后必须重新生成。
 *
 * 用法（中文模型已能在浏览器实时运行后）：
 *   1. npm run dev，打开页面，确保 ACTIVE_MODEL='gpt2-zh' 且模型已加载完成。
 *   2. 在输入框输入要缓存的句子（对应 inputTextExample 里的 5 句之一）。
 *   3. 等推理动画结束后，在浏览器控制台执行：
 *          copy(window.__dumpExample('ex0'))     // ex0..ex4 依次替换
 *   4. 把剪贴板内容粘贴覆盖 src/constants/examples/ex0.js（变量名要与文件名对应）。
 *   5. 五句都做完后，把 modelMetaMap['gpt2-zh'].hasCachedExamples 改为 true。
 */
export function installExampleCapture() {
	if (typeof window === 'undefined') return;

	(window as any).__dumpExample = (name = 'exN') => {
		const data: any = get(modelData);
		const obj = {
			prompt: get(inputText),
			tokens: get(tokens),
			tokenIds: get(tokenIds),
			logits: Array.from(data?.logits ?? []),
			outputs: data?.outputs,
			probabilities: data?.probabilities,
			sampled: data?.sampled
		};
		const code = `export const ${name} = ${JSON.stringify(obj)};\n`;
		console.log(
			`[captureExample] ${name}: ${obj.tokens?.length ?? 0} tokens, ${code.length} 字符（已返回，可用 copy() 复制）`
		);
		return code;
	};

	console.log(
		"[captureExample] 已就绪。先输入句子并等推理结束，再执行： copy(window.__dumpExample('ex0'))"
	);
}
