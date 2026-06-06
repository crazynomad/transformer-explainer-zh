// 英文版的 textbook(walkthrough)讲解文案，按页面 id 索引。
// textbookPages.ts 里的 title/content 已是中文；当语言切到 'en' 时，
// TextbookCard 用这里的英文覆盖显示。两边 id 必须一致。
export const textbookContentEn: Record<string, { title: string; content?: string }> = {
	'what-is-transformer': {
		title: 'What is Transformer?',
		content: `<p><strong>Transformer</strong> is the core architecture behind modern AI, powering models like ChatGPT and Gemini. Introduced in 2017, it revolutionized how AI processes information. The same architecture is used for training on massive datasets and for inference to generate outputs. Here we use GPT-2 (small), simpler than newer ones but perfect for learning the fundamentals.</p>\n`
	},
	'how-transformers-work': {
		title: 'How Transformers Work?',
		content: `<p>Transformers aren't magic—they build text step by step by asking:</p>
	<blockquote class="question">
		"What is the most probable next word that will follow this input?"
	</blockquote>
	<p>Here we explore how a trained model generates text. Write your own text or use an example, then click <strong>Generate</strong> to see it in action. If the model isn’t ready yet, try another <strong>Example</strong>.</p>`
	},
	'transformer-architecture': {
		title: 'Transformer Architecture',
		content:
			'<p>Transformer has three main parts:</p><div class="numbered-list"><div class="numbered-item"><span class="number-circle">1</span><div class="item-content"><strong>Embeddings</strong> turn text into numbers.</div></div><div class="numbered-item"><span class="number-circle">2</span><div class="item-content"><strong>Transformer blocks</strong> mix information with Self-Attention and refine it with an MLP.</div></div><div class="numbered-item"><span class="number-circle">3</span><div class="item-content"><strong>Probabilities</strong> determine the likelihood of each next token.</div></div></div>'
	},
	embedding: {
		title: 'Embedding',
		content: `<p>Before a Transformer can use text, it first breaks it into small units and represents each as a list of numbers (vector). This process is called <strong>embedding</strong>, and the term can refer to both the process and the resulting vector.</p><p>In this tool, each vector appears as a rectangle, and hovering over it shows its size.</p>`
	},
	'token-embedding': {
		title: 'Token Embedding',
		content: `<p><strong>Tokenization</strong> splits input text into tokens—small units like words or parts of words. GPT-2 (small) has 50,257 token vocabulary, each with a unique ID.</p><p>In the <strong>token embedding</strong> step, every token is matched to a 768-number vector from a large lookup table. These vectors are learned during training to best represent each token’s meaning.</p>`
	},
	'positional-encoding': {
		title: 'Positional Encoding',
		content: `<p>Word order matters in language. <strong>Positional encoding</strong> gives each token information about its place in the sequence.</p><p>GPT-2 does this by adding a learned positional embedding to the token's embedding, but newer models may use other methods, like RoPE, which encodes position by rotating certain vectors. All aim to help the model understand order in text.</p>`
	},
	blocks: {
		title: 'Repetitive Transformer Blocks',
		content: `<p>A <strong>Transformer block</strong> is the main unit of processing in the model. It has two parts:</p><ul><li><strong>Multi-head self-attention</strong> – lets tokens share information</li><li><strong>MLP</strong> – refines each token's details</li></ul><p>Models stack many blocks so token representations become richer as they pass through. GPT-2 (small) has 12 of them.</p>`
	},
	'self-attention': {
		title: 'Multi-Head Self Attention',
		content:
			'<p><strong>Self-attention</strong> lets the model decide which parts of the input are most relevant to each token. This helps it capture meaning and relationships, even between far-apart words.</p><p>In <strong>multi-head</strong> form, the model runs several attention processes in parallel, each focusing on different patterns in the text.</p>'
	},
	qkv: {
		title: 'Query, Key, Value',
		content: `
	<p>To perform self-attention, each token's embedding is transformed into
  <span class="highlight">three new embeddings</span>—
  <span class="blue">Query</span>,
  <span class="red">Key</span>, and
  <span class="green">Value</span>.
  This transformation is done by applying different weights and biases to each token embedding. These parameters (weights and biases), are optimized through training.</p>

<p>Once created, <span class="blue">Queries</span> compare with <span class="red">Keys</span> to measure relevance, and this relevance is used to weight the <span class="green">Values</span>.</p>
`
	},
	'multi-head': {
		title: 'Multi-head',
		content:
			'<p>After creating <span class="blue">Q</span>, <span class="red">K</span>, and <span class="green">V</span> embeddings, the model splits them into several <strong>heads</strong> (12 in GPT-2 small). Each head works with its own smaller set of <span class="blue">Q</span>/<span class="red">K</span>/<span class="green">V</span>, focusing on different patterns in the text—like grammar, meaning, or long-range links.</p><p>Multiple heads let the model learn many kinds of relationships in parallel, making its understanding richer.</p>'
	},
	'masked-self-attention': {
		title: 'Masked Self Attention',
		content: `<p>In each head, the model decides how much each token focuses on others:</p><ul><li><strong>Dot Product</strong> – Multiply matching numbers in <span class="blue">Query</span>/<span class="red">Key</span> vectors, sum to get <span class="purple">attention scores</span>.</li><li><strong>Mask</strong> – Hide future tokens so it can't peek ahead.</li><li><strong>Softmax</strong> – Convert scores to probabilities, each row summing to 1, showing focus on earlier tokens.</li></ul>`
	},
	'output-concatenation': {
		title: 'Attention Output & Concatenation',
		content:
			'<p>Each head <span class="highlight">multiplies its <span class="purple">attention scores</span> with the <span class="green">Value</span> embeddings to produce its attention output</span>—a refined representation of each token after considering context.</p><p>GPT-2 (small) has 12 such outputs, which are concatenated to form a single vector of the original size (768 numbers).</p>'
	},
	mlp: {
		title: 'MLP (Multi-Layer Perceptron)',
		content:
			'<p>The attention output goes through an <strong>MLP</strong> to refine token representations. A Linear layer changes embedding values and size using learned weights and bias, then a non-linear activation decides how much each value passes.</p><p>Many activation types exist; GPT-2 uses <strong>GELU</strong>, which lets small values pass partially and large values pass fully, helping capture both subtle and strong patterns.</p>'
	},
	'output-logit': {
		title: 'Output Logit',
		content: `<p>After all Transformer blocks, the last token's output embedding, enriched with context from all previous tokens, is multiplied by learned weights in a final layer.</p><p>This produces <strong>logits</strong>, 50,257 numbers—one for each token in GPT-2’s vocabulary—that indicate how likely each token is to come next.</p>`
	},
	'output-probabilities': {
		title: 'Probabilities',
		content:
			'<p>Logits are just raw scores. To make them easier to interpret, we convert them into <strong>probabilities</strong> between 0 and 1, where all add up to 1. This tells us the likelihood of each token being the next word.</p><p>Instead of always picking the highest-probability token, we can use different selection strategies to balance safety and creativity in the generated text.</p>'
	},
	temperature: {
		title: 'Temperature',
		content:
			'<p><strong>Temperature</strong> works by scaling the logits before turning them into probabilities. A <strong>low temperature</strong> (e.g., 0.2) makes large logits even larger and small ones smaller, favoring the highest-scoring tokens and leading to more <strong>predictable choices</strong>. A <strong>high temperature</strong> (e.g., 1.0 or above) flattens the differences, making less likely tokens more competitive and leading to more <strong>creative outputs</strong>.</p>'
	},
	sampling: {
		title: 'Sampling Strategy',
		content:
			'<p>Finally, we need a strategy to pick the next token. Many exist, but here are common ones: Greedy search picks the top one. <strong>Top-k</strong> keeps only the k most likely tokens, and <strong>top-p</strong> keeps the smallest set whose total probability is at least p—trimming unlikely ones early.</p><p>Then softmax turns the remaining logits into probabilities, and one token is picked at random from the allowed set.</p>'
	},
	residual: {
		title: 'Residual Connection',
		content: `<p>Transformers have auxiliary features that enhance the model performance. For example, a <strong>residual connection</strong> adds a layer's input to its output, keeping information from fading through many blocks. In GPT-2, it's used twice per block to train deeper stacks effectively.</p>`
	},
	'layer-normalization': {
		title: 'Layer Normalization',
		content: `<p><strong>Layer Normalization</strong> helps stabilize both training and inference by adjusting input numbers so their mean and variance stay consistent. This makes the model less sensitive to its starting weights and helps it learn more effectively. In GPT-2, it's applied before self-attention, before the MLP, and once more before the final output.</p>`
	},
	dropout: {
		title: 'Dropout',
		content: `<p>During training, <strong>dropout</strong> randomly turns off some connections between numbers so the model doesn't overfit to specific patterns. This helps it learn features that generalize better. GPT-2 uses it, but newer LLMs often skip it because they train on huge datasets and overfitting is less of a problem. In inference, dropout is turned off.</p>`
	}
};
