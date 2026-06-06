import { get } from 'svelte/store';
import {
	expandedBlock,
	weightPopover,
	isBoundingBoxActive,
	textbookCurrentPageId,
	isExpandOrCollapseRunning,
	isFetchingModel,
	userId
} from '~/store';
import {
	highlightElements,
	removeHighlightFromElements,
	applyTransformerBoundingHeight,
	resetElementsHeight,
	highlightAttentionPath,
	removeAttentionPathHighlight,
	removeFingerFromElements
} from '~/utils/textbook';
import { drawResidualLine } from './animation';

export interface TextbookPage {
	id: string;
	title: string;
	content?: string;
	component?: any;
	timeoutId?: number;
	on: () => void;
	out: () => void;
	complete?: () => void;
}

const { drawLine, removeLine } = drawResidualLine();

export const textPages: TextbookPage[] = [
	{
		id: 'what-is-transformer',
		title: '什么是 Transformer？',
		content: `<p><strong>Transformer</strong> 是现代 AI 的核心架构，驱动着 ChatGPT、Gemini 等模型。它于 2017 年提出，彻底改变了 AI 处理信息的方式。同一套架构既用于在海量数据上训练，也用于推理生成输出。这里我们使用 GPT-2（small 版）——它比新模型更简单，但非常适合学习基本原理。</p>
`,
		on: () => {},
		out: () => {}
	},
	{
		id: 'how-transformers-work',
		title: 'Transformer 如何工作？',
		content: `<p>Transformer 并不神秘——它一步一步地构建文本，每一步都在问：</p>
	<blockquote class="question">
		“紧接着这段输入，最有可能出现的下一个词是什么？”
	</blockquote>
	<p>这里我们探索一个训练好的模型是如何生成文本的。输入你自己的文字或选择一个示例，然后点击 <strong>Generate</strong> 看它运行。如果模型还没准备好，可以先换一个 <strong>Example</strong>。</p>`,
		on: () => {
			highlightElements(['.input-form']);
			if (get(isFetchingModel)) {
				highlightElements(['.input-form .select-button']);
			} else {
				highlightElements(['.input-form .generate-button']);
			}
		},
		out: () => {
			removeHighlightFromElements([
				'.input-form',
				'.input-form .select-button',
				'.input-form .generate-button'
			]);
		},
		complete: () => {
			removeFingerFromElements(['.input-form .select-button', '.input-form .generate-button']);
			if (get(textbookCurrentPageId) === 'how-transformers-work') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'how-transformers-work'
				});
			}
		}
	},
	{
		id: 'transformer-architecture',
		title: 'Transformer 架构',
		content:
			'<p>Transformer 有三个主要部分：</p><div class="numbered-list"><div class="numbered-item"><span class="number-circle">1</span><div class="item-content"><strong>Embedding（嵌入）</strong>把文本转成数字。</div></div><div class="numbered-item"><span class="number-circle">2</span><div class="item-content"><strong>Transformer Block（块）</strong>用 Self-Attention（自注意力）混合信息，再用 MLP 精炼。</div></div><div class="numbered-item"><span class="number-circle">3</span><div class="item-content"><strong>Probabilities（概率）</strong>决定每个候选下一个 token 的可能性。</div></div></div>',
		on: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			highlightElements(selectors);
			applyTransformerBoundingHeight(['.softmax-bounding', '.embedding-bounding']);
		},
		out: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			removeHighlightFromElements(selectors);
			resetElementsHeight(['.softmax-bounding', '.embedding-bounding']);
		}
	},
	{
		id: 'embedding',
		title: 'Embedding（嵌入）',
		content: `<p>在 Transformer 使用文本之前，它先把文本拆成小单元，并把每个单元表示成一串数字（向量）。这个过程叫 <strong>embedding（嵌入）</strong>，这个词既可以指这个过程，也可以指得到的向量。</p><p>在本工具里，每个向量显示为一个矩形，把鼠标悬停在上面可以看到它的大小。</p>`,
		on: () => {
			highlightElements(['.step.embedding .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.embedding .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.embedding .title']);
			if (get(textbookCurrentPageId) === 'embedding') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'embedding'
				});
			}
		}
	},
	{
		id: 'token-embedding',
		title: 'Token Embedding（词元嵌入）',
		content: `<p><strong>Tokenization（分词）</strong>把输入文本切成 token——像词或词的一部分这样的小单元。GPT-2（small）有 50,257 个 token 的词表，每个都有唯一 ID。</p><p>在 <strong>token embedding</strong> 这一步，每个 token 会从一张大查找表里匹配到一个 768 维的向量。这些向量是在训练中学到的，用来尽可能好地表示每个 token 的含义。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'positional-encoding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'positional-encoding',
		title: 'Positional Encoding（位置编码）',
		content: `<p>词的顺序在语言中很重要。<strong>Positional encoding（位置编码）</strong>给每个 token 提供它在序列中所处位置的信息。</p><p>GPT-2 的做法是把一个学到的位置嵌入加到 token 的嵌入上；新一些的模型可能用别的方法，比如 RoPE——通过旋转某些向量来编码位置。它们的目标都是帮助模型理解文本中的顺序。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'token-embedding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'blocks',
		title: '重复堆叠的 Transformer Block',
		content: `<p><strong>Transformer block（块）</strong>是模型中主要的处理单元。它有两部分：</p><ul><li><strong>Multi-head self-attention（多头自注意力）</strong>——让 token 之间交换信息</li><li><strong>MLP</strong>——精炼每个 token 自身的细节</li></ul><p>模型堆叠很多个块，token 的表示在逐层经过时变得越来越丰富。GPT-2（small）有 12 个。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements([
						'.transformer-bounding',
						'.step.transformer-blocks .guide',
						'.attention > .title',
						'.mlp > .title'
					]);
					highlightElements(['.transformer-bounding-title'], 'textbook-button-highlight');
					isBoundingBoxActive.set(true);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.transformer-bounding',
				'.step.transformer-blocks .guide',
				'.attention > .title',
				'.mlp > .title'
			]);
			removeHighlightFromElements(['.transformer-bounding-title'], 'textbook-button-highlight');
			isBoundingBoxActive.set(false);
		},
		complete: () => {
			removeFingerFromElements(['.transformer-bounding-title']);
			if (get(textbookCurrentPageId) === 'blocks') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'blocks'
				});
			}
		}
	},
	{
		id: 'self-attention',
		title: 'Multi-Head Self Attention（多头自注意力）',
		content:
			'<p><strong>Self-attention（自注意力）</strong>让模型为每个 token 判断输入中哪些部分最相关。这帮助它捕捉含义和关系，即使是相隔很远的词之间也可以。</p><p>在 <strong>multi-head（多头）</strong>形式下，模型并行运行多个注意力过程，每个关注文本中不同的模式。</p>',
		on: () => {
			highlightElements(['.step.attention']);
		},
		out: () => {
			removeHighlightFromElements(['.step.attention']);
		}
	},
	{
		id: 'qkv',
		title: 'Query、Key、Value',
		content: `
	<p>为了进行自注意力，每个 token 的嵌入会被变换成
  <span class="highlight">三个新的嵌入</span>——
  <span class="blue">Query</span>、
  <span class="red">Key</span> 和
  <span class="green">Value</span>。
  这个变换是通过对每个 token 嵌入施加不同的权重和偏置来完成的。这些参数（权重和偏置）是通过训练优化得到的。</p>

<p>生成之后，<span class="blue">Query</span> 与 <span class="red">Key</span> 比较以衡量相关性，再用这个相关性去加权 <span class="green">Value</span>。</p>
`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.step.qkv .qkv-column']);
			if (get(textbookCurrentPageId) === 'qkv') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'qkv'
				});
			}
		}
	},

	{
		id: 'multi-head',
		title: 'Multi-head（多头）',
		content:
			'<p>在生成 <span class="blue">Q</span>、<span class="red">K</span>、<span class="green">V</span> 嵌入之后，模型把它们拆分成多个 <strong>head（头）</strong>（GPT-2 small 里是 12 个）。每个头使用自己那一小份 <span class="blue">Q</span>/<span class="red">K</span>/<span class="green">V</span>，关注文本中不同的模式——比如语法、语义或长距离关联。</p><p>多个头让模型并行学习多种关系，使理解更丰富。</p>',
		on: () => {
			highlightAttentionPath();
			highlightElements(['.multi-head .head-title']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.multi-head .head-title']);
		},
		complete: () => {
			removeFingerFromElements(['.multi-head .head-title']);
			if (get(textbookCurrentPageId) === 'multi-head') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'multi-head'
				});
			}
		}
	},
	{
		id: 'masked-self-attention',
		title: 'Masked Self Attention（带掩码的自注意力）',
		content: `<p>在每个头里，模型决定每个 token 对其他 token 关注多少：</p><ul><li><strong>Dot Product（点积）</strong>——把 <span class="blue">Query</span>/<span class="red">Key</span> 向量中对应的数字相乘并求和，得到 <span class="purple">attention scores（注意力分数）</span>。</li><li><strong>Mask（掩码）</strong>——遮住未来的 token，使它无法偷看后文。</li><li><strong>Softmax</strong>——把分数转成概率，每一行加起来为 1，体现对前面 token 的关注程度。</li></ul>`,
		on: () => {
			highlightAttentionPath();
			highlightElements(['.attention-matrix.attention-result']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.attention-matrix.attention-result']);
			expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.attention-matrix.attention-result']);
			if (get(textbookCurrentPageId) === 'masked-self-attention') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'masked-self-attention'
				});
			}
		}
	},
	{
		id: 'output-concatenation',
		title: '注意力输出与拼接',
		content:
			'<p>每个头 <span class="highlight">把它的 <span class="purple">attention scores（注意力分数）</span>与 <span class="green">Value</span> 嵌入相乘，得到它的注意力输出</span>——这是每个 token 在考虑上下文之后的精炼表示。</p><p>GPT-2（small）有 12 个这样的输出，它们被拼接成一个原始大小（768 个数字）的向量。</p>',
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.attention .column.out']);
			if (get(textbookCurrentPageId) === 'output-concatenation') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-concatenation'
				});
			}
		}
	},
	{
		id: 'mlp',
		title: 'MLP（多层感知机）',
		content:
			'<p>注意力输出会经过一个 <strong>MLP</strong> 来进一步精炼 token 表示。一个线性层用学到的权重和偏置改变嵌入的数值和大小，然后一个非线性激活函数决定每个值通过多少。</p><p>激活函数有很多种；GPT-2 使用 <strong>GELU</strong>，它让小的值部分通过、大的值完全通过，有助于同时捕捉细微和强烈的模式。</p>',
		on: () => {
			highlightElements(['.step.mlp', '.operation-col.activation']);
		},
		out: () => {
			removeHighlightFromElements(['.step.mlp', '.operation-col.activation']);
		}
	},

	{
		id: 'output-logit',
		title: '输出 Logit',
		content: `<p>经过所有 Transformer block 之后，最后一个 token 的输出嵌入（已经融合了之前所有 token 的上下文）会在最后一层与学到的权重相乘。</p><p>这会产生 <strong>logits</strong>——50,257 个数字，对应 GPT-2 词表中的每个 token，表示每个 token 作为下一个词出现的可能性高低。</p>`,
		on: () => {
			highlightElements(['g.path-group.softmax', '.column.final']);
		},
		out: () => {
			removeHighlightFromElements(['g.path-group.softmax', '.column.final']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.column.final']);
			if (get(textbookCurrentPageId) === 'output-logit') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-logit'
				});
			}
		}
	},
	{
		id: 'output-probabilities',
		title: 'Probabilities（概率）',
		content:
			'<p>Logits 只是原始分数。为了更易解读，我们把它们转成 0 到 1 之间、且总和为 1 的 <strong>probabilities（概率）</strong>。这告诉我们每个 token 成为下一个词的可能性。</p><p>我们不一定总是选概率最高的 token，可以采用不同的选择策略，在生成文本的「稳妥」与「创意」之间取得平衡。</p>',
		on: () => {
			highlightElements(['.step.softmax .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.softmax .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.softmax .title']);
			if (get(textbookCurrentPageId) === 'output-probabilities') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-probabilities'
				});
			}
		}
	},
	{
		id: 'temperature',
		title: 'Temperature（温度）',
		content:
			'<p><strong>Temperature（温度）</strong>的作用是在把 logits 转成概率之前对其进行缩放。<strong>低温度</strong>（如 0.2）会让大的 logits 更大、小的更小，偏向得分最高的 token，使结果更<strong>可预测</strong>。<strong>高温度</strong>（如 1.0 或更高）会拉平差距，让不太可能的 token 也更有竞争力，使输出更<strong>有创意</strong>。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.scaled',
						'.title-box.scaled',
						'.content-box.scaled',
						'.temperature-input'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.scaled',
					'.title-box.scaled',
					'.content-box.scaled',
					'.temperature-input'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.scaled',
				'.title-box.scaled',
				'.temperature-input',
				'.content-box.scaled'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.temperature-input']);
			if (get(textbookCurrentPageId) === 'temperature') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'temperature'
				});
			}
		}
	},
	{
		id: 'sampling',
		title: '采样策略（Sampling）',
		content:
			'<p>最后，我们需要一个策略来挑选下一个 token。方法有很多，这里是几种常见的：Greedy search（贪心）直接选最高的那个。<strong>Top-k</strong> 只保留最可能的 k 个 token；<strong>Top-p</strong> 保留累计概率至少为 p 的最小集合——尽早裁掉不太可能的 token。</p><p>然后 softmax 把剩下的 logits 转成概率，再从允许的集合里随机选出一个 token。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.sampling',
						'.title-box.sampling',
						'.sampling-input',
						'.content-box.sampling'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.sampling',
					'.title-box.sampling',
					'.sampling-input',
					'.content-box.sampling'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.sampling',
				'.title-box.sampling',
				'.sampling-input',
				'.content-box.sampling'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.sampling-input']);
			if (get(textbookCurrentPageId) === 'sampling') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'sampling'
				});
			}
		}
	},
	{
		id: 'residual',
		title: '残差连接（Residual Connection）',
		content: `<p>Transformer 还有一些辅助特性来提升模型表现。例如，<strong>residual connection（残差连接）</strong>把一层的输入加到它的输出上，避免信息在经过许多层之后逐渐消失。在 GPT-2 中，每个块用到它两次，以便有效训练更深的堆叠。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['.operation-col.residual', '.residual-start']);
					drawLine();
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['.operation-col.residual', '.residual-start']);
			removeLine();
		}
	},
	{
		id: 'layer-normalization',
		title: '层归一化（Layer Normalization）',
		content: `<p><strong>Layer Normalization（层归一化）</strong>通过调整输入数值、使其均值和方差保持一致，来稳定训练和推理。这让模型对初始权重不那么敏感，也更容易有效学习。在 GPT-2 中，它被用在自注意力之前、MLP 之前，以及最终输出之前各一次。</p>`,
		on: () => {
			highlightElements(['.operation-col.ln']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.ln']);
		}
	},
	{
		id: 'dropout',
		title: 'Dropout（随机失活）',
		content: `<p>在训练时，<strong>dropout（随机失活）</strong>会随机关闭一些数值之间的连接，使模型不会过度拟合到特定模式，从而学到泛化更好的特征。GPT-2 用了它，但新的 LLM 常常不用——因为它们在超大数据集上训练，过拟合不太成问题。在推理时，dropout 是关闭的。</p>`,
		on: () => {
			highlightElements(['.operation-col.dropout']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.dropout']);
		}
	}
	// {
	// 	id: 'final',
	// 	title: `Let's explore!`,
	// 	content: '',
	// 	on: () => {},
	// 	out: () => {}
	// }
];
