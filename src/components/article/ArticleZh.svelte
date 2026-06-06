<script>
	import tailwindConfig from '../../../tailwind.config';
	import resolveConfig from 'tailwindcss/resolveConfig';
	import Katex from '~/utils/Katex.svelte';
</script>

<div id="description">
	<div class="article-section" data-click="article-intro">
		<h1>什么是 Transformer？</h1>

		<p>
			Transformer 是一种从根本上改变了人工智能研究方式的神经网络架构。它最早在 2017 年的开创性论文
			<a
				href="https://dl.acm.org/doi/10.5555/3295222.3295349"
				title="ACM Digital Library"
				target="_blank">《Attention is All You Need》</a
			>
			中提出，此后成为深度学习模型的首选架构，驱动着 OpenAI 的 <strong>GPT</strong>、Meta 的
			<strong>Llama</strong>、Google 的 <strong>Gemini</strong> 等文本生成模型。除了文本，Transformer 还被应用于
			<a
				href="https://huggingface.co/learn/audio-course/en/chapter3/introduction"
				title="Hugging Face"
				target="_blank">音频生成</a
			>、
			<a
				href="https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-classification"
				title="Hugging Face"
				target="_blank">图像识别</a
			>、
			<a href="https://elifesciences.org/articles/82819" title="eLife">蛋白质结构预测</a
			>，甚至
			<a
				href="https://www.deeplearning.ai/the-batch/reinforcement-learning-plus-transformers-equals-efficiency/"
				title="Deep Learning AI"
				target="_blank">玩游戏</a
			>，展现出它在众多领域的通用性。
		</p>
		<p>
			从本质上说，文本生成类的 Transformer 模型遵循 <strong>下一个 token 预测（next-token prediction）</strong>的原理：给定用户的一段文本提示，
			<em>紧接着这段输入、最有可能出现的下一个 token（一个词或词的一部分）</em>是什么？Transformer 的核心创新与威力，在于它使用的自注意力（self-attention）机制——它让模型能够处理整段序列，并比以往的架构更有效地捕捉长距离依赖关系。
		</p>
		<p>
			GPT-2 系列模型是文本生成类 Transformer 的典型代表。本工具 Transformer Explainer 使用的是
			<a href="https://huggingface.co/openai-community/gpt2" title="Hugging Face" target="_blank"
				>GPT-2</a
			>
			（small）模型，它有 1.24 亿参数。虽然它不是最新或最强的 Transformer，但它与当前最先进模型共享许多相同的架构组件和原理，因此是理解基础知识的理想起点。
		</p>
	</div>

	<div class="article-section" data-click="article-overview">
		<h1>Transformer 架构</h1>

		<p>每个文本生成类 Transformer 都由这 <strong>三个关键部分</strong>组成：</p>
		<ol>
			<li>
				<strong class="bold-purple">Embedding（嵌入）</strong>：输入文本被切分成更小的单元，称为
				token（可以是词或子词）。这些 token 被转换成称为 embedding 的数值向量，用来捕捉词的语义。
			</li>
			<li>
				<strong class="bold-purple">Transformer Block（块）</strong>是模型处理和变换输入数据的基本构件。每个块包含：
				<ul class="">
					<li>
						<strong>注意力机制（Attention）</strong>，是 Transformer block 的核心组件。它让 token 之间互相"交流"，捕捉上下文信息以及词与词之间的关系。
					</li>
					<li>
						<strong>MLP（多层感知机）层</strong>，一个对每个 token 独立运算的前馈网络。注意力层的目标是在 token 之间传递信息，而 MLP 的目标是精炼每个 token 自身的表示。
					</li>
				</ul>
			</li>
			<li>
				<strong class="bold-purple">输出概率（Output Probabilities）</strong>：最后的线性层和 softmax 层把处理过的 embedding 转换成概率，使模型能够预测序列中的下一个 token。
			</li>
		</ol>
	</div>

	<div class="article-section" id="embedding" data-click="article-embedding">
		<h2>Embedding（嵌入）</h2>
		<p>
			假设你想用 Transformer 模型生成文本，你输入这样一段提示：
			<code>“Data visualization empowers users to”</code>。这段输入需要先转换成模型能够理解和处理的格式，这正是 embedding 的作用：把文本变成模型可以运算的数值表示。要把一段提示转成 embedding，我们需要：1）对输入分词，2）获取 token embedding，3）加入位置信息，最后 4）把 token 编码与位置编码相加，得到最终的 embedding。下面来看每一步是怎么做的。
		</p>
		<div class="figure">
			<img src="./article_assets/embedding.png" width="65%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">1</span>。展开 Embedding 层视图，展示输入提示是如何被转换为向量表示的。整个过程包括
			<span class="fig-numbering">(1)</span> 分词（Tokenization）、(2) Token Embedding、(3) 位置编码（Positional Encoding），以及 (4) 最终 Embedding。
		</div>
		<div class="article-subsection">
			<h3>第 1 步：分词（Tokenization）</h3>
			<p>
				分词是把输入文本拆分成更小、更易处理的片段（称为 token）的过程。token 可以是一个词或一个子词。词
				<code>"Data"</code> 和 <code>"visualization"</code> 各对应一个唯一的 token，而词
				<code>"empowers"</code>
				则被拆成两个 token。token 的完整词表在训练模型之前就已确定：GPT-2 的词表有
				<code>50,257</code> 个唯一 token。现在我们已经把输入文本切成了带有不同 ID 的 token，就可以从 embedding 中获取它们的向量表示了。
			</p>
		</div>
		<div class="article-subsection" id="article-token-embedding">
			<h3>第 2 步：Token Embedding</h3>
			<p>
				GPT-2（small）把词表中的每个 token 表示为一个 768 维的向量；向量的维度取决于具体模型。这些 embedding 向量存储在一个形状为
				<code>(50,257, 768)</code> 的矩阵里，约含 3900 万个参数！这个庞大的矩阵让模型能够为每个 token 赋予语义——在这个高维空间里，用法或含义相近的 token 彼此靠近，而不相关的 token 相距较远。
			</p>
		</div>
		<div class="article-subsection" id="article-positional-embedding">
			<h3>第 3 步：位置编码（Positional Encoding）</h3>
			<p>
				Embedding 层还会编码每个 token 在输入提示中所处位置的信息。不同模型采用不同的位置编码方法。GPT-2 从零开始训练自己的位置编码矩阵，并将其直接整合进训练过程。
			</p>
		</div>
		<div class="article-subsection">
			<h3>第 4 步：最终 Embedding</h3>
			<p>
				最后，我们把 token 编码与位置编码相加，得到最终的 embedding 表示。这个合并后的表示既捕捉了 token 的语义，也包含了它们在输入序列中的位置。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-transformer-block">
		<h2>Transformer Block（块）</h2>

		<p>
			Transformer 处理的核心在于 Transformer block，它由多头自注意力（multi-head self-attention）和一个多层感知机（MLP）层组成。大多数模型由多个这样的块依次堆叠而成。token 的表示在逐层（从第一个块到最后一个块）经过时不断演化，让模型对每个 token 建立起精细的理解。这种分层方式带来了对输入更高阶的表示。我们考察的 GPT-2（small）模型由
			<code>12</code> 个这样的块组成。
		</p>
	</div>

	<div class="article-section" id="self-attention" data-click="article-attention">
		<h3>多头自注意力（Multi-Head Self-Attention）</h3>
		<p>
			自注意力机制让模型能够捕捉序列中 token 之间的关系，使每个 token 的表示都受到其他 token 的影响。多个注意力头让模型从不同角度考量这些关系；例如，一个头可能捕捉短距离的句法联系，而另一个头追踪更宽泛的语义上下文。下面我们将一步步走完多头自注意力的计算过程。
		</p>
		<div class="article-subsection-l2">
			<h4>第 1 步：Query、Key、Value 矩阵</h4>

			<div class="figure pt-10">
				<img src="./article_assets/QKV.png" width="80%" />
				<div class="text-xs">
					<Katex
						displayMode
						math={`
		QKV_{ij} = ( \\sum_{d=1}^{768} \\text{Embedding}_{i,d} \\cdot \\text{Weights}_{d,j}) + \\text{Bias}_j
		`}
					/>
				</div>
			</div>
			<div class="figure-caption">
				图 <span class="attention">2</span>。从原始 embedding 计算 Query、Key、Value 矩阵。
			</div>

			<p>
				每个 token 的 embedding 向量会被变换成三个向量：
				<span class="q-color">Query (Q)</span>、
				<span class="k-color">Key (K)</span> 和
				<span class="v-color">Value (V)</span>。这些向量是把输入 embedding 矩阵分别与
				<span class="q-color">Q</span>、
				<span class="k-color">K</span>、
				<span class="v-color">V</span> 的学习权重矩阵相乘得到的。可以用一个网页搜索的类比来建立直觉：
			</p>
			<ul>
				<li>
					<strong class="q-color font-medium">Query (Q)</strong> 是你在搜索引擎里输入的搜索词。这是你想
					<em>"进一步了解"</em>的那个 token。
				</li>
				<li>
					<strong class="k-color font-medium">Key (K)</strong> 是搜索结果里每个网页的标题。它代表 query 可以关注的候选 token。
				</li>
				<li>
					<strong class="v-color font-medium">Value (V)</strong> 是网页实际显示的内容。当我们把合适的搜索词（Query）与相关结果（Key）匹配上之后，就想获取最相关页面的内容（Value）。
				</li>
			</ul>
			<p>
				利用这些 QKV 值，模型可以计算注意力分数（attention scores），从而决定生成预测时每个 token 应当获得多少关注。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>第 2 步：多头拆分（Multi-Head Splitting）</h4>
			<p>
				<span class="q-color">Query</span>、<span class="k-color">Key</span> 和
				<span class="v-color">Value</span>
				向量会被拆分成多个头——在 GPT-2（small）里是
				<code>12</code> 个头。每个头独立处理 embedding 的一部分，捕捉不同的句法和语义关系。这种设计便于并行学习多样的语言特征，增强模型的表达能力。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>第 3 步：带掩码的自注意力（Masked Self-Attention）</h4>
			<p>
				在每个头里，我们进行带掩码的自注意力计算。这一机制让模型能够在关注输入相关部分的同时，避免访问未来的 token，从而逐步生成序列。
			</p>

			<div class="figure">
				<img src="./article_assets/attention.png" width="80%" align="middle" />
			</div>
			<div class="figure-caption">
				图 <span class="attention">3</span>。使用 Query、Key、Value 矩阵计算带掩码的自注意力。
			</div>

			<ul>
				<li>
					<strong>点积（Dot Product）</strong>：<span class="q-color">Query</span> 与
					<span class="k-color">Key</span> 矩阵的点积决定了
					<strong>注意力分数</strong>，得到一个反映所有输入 token 之间关系的方阵。
				</li>
				<li>
					<strong>缩放 · 掩码（Scaling · Mask）</strong>：注意力分数会被缩放，并对注意力矩阵的上三角施加掩码，把这些值设为负无穷，以阻止模型访问未来的 token。模型必须学会在不"偷看"未来的前提下预测下一个 token。
				</li>
				<li>
					<strong>Softmax · Dropout</strong>：掩码和缩放之后，注意力分数通过 softmax 转换成概率，再可选地用 dropout 做正则化。矩阵的每一行加起来为 1，表示其左侧每个 token 的相关程度。
				</li>
			</ul>
		</div>
		<div class="article-subsection-l2">
			<h4>第 4 步：输出与拼接（Output and Concatenation）</h4>
			<p>
				模型用带掩码的自注意力分数与
				<span class="v-color">Value</span> 矩阵相乘，得到自注意力机制的
				<span class="purple-color">最终输出</span>。GPT-2 有
				<code>12</code> 个自注意力头，各自捕捉 token 之间不同的关系。这些头的输出被拼接起来，再经过一个线性投影。
			</p>
		</div>
	</div>

	<div class="article-section" id="article-activation" data-click="article-mlp">
		<h3>MLP：多层感知机</h3>

		<div class="figure">
			<img src="./article_assets/mlp.png" width="70%" align="middle" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">4</span>。用 MLP 层把自注意力的表示投影到更高维度，以增强模型的表达能力。
		</div>

		<p>
			在多个自注意力头捕捉到输入 token 之间的多样关系之后，拼接后的输出会经过多层感知机（MLP）层，以增强模型的表达能力。MLP 块由两次线性变换组成，中间夹着一个
			<a
				href="https://en.wikipedia.org/wiki/Rectified_linear_unit#Gaussian-error_linear_unit_(GELU)"
				>GELU</a
			> 激活函数。
		</p>
		<p>
			第一次线性变换把输入的维度扩大四倍，从 <code>768</code> 升到
			<code>3072</code>。这一扩展步骤让模型把 token 表示投影到更高维的空间，从而捕捉在原始维度下可能看不到的更丰富、更复杂的模式。
		</p>
		<p>
			第二次线性变换再把维度压缩回原来的 <code>768</code>。这一压缩步骤把表示带回可管理的大小，同时保留扩展步骤中引入的有用的非线性变换。
		</p>
		<p>
			与在 token 之间整合信息的自注意力机制不同，MLP 对每个 token 独立处理，只是把每个 token 表示从一个空间映射到另一个空间，从而丰富模型的整体能力。
		</p>
	</div>

	<div class="article-section" id="article-prob" data-click="article-prob">
		<h2>输出概率（Output Probabilities）</h2>
		<p>
			当输入经过所有 Transformer block 处理之后，输出会通过最后的线性层，为 token 预测做准备。这一层把最终表示投影到一个
			<code>50,257</code>
			维的空间，词表中的每个 token 都对应一个称为 <code>logit</code> 的值。任何 token 都可能成为下一个词，因此这一过程让我们可以简单地按"成为下一个词的可能性"对这些 token 排序。随后我们用 softmax 函数把 logits 转换成一个总和为 1 的概率分布。这样我们就能根据可能性对下一个 token 进行采样。
		</p>

		<div class="figure py-5">
			<img src="./article_assets/softmax.png" width="70%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">5</span>。词表中的每个 token 都会根据模型输出的 logits 被赋予一个概率。这些概率决定了每个 token 成为序列中下一个词的可能性。
		</div>

		<p id="article-temperature" data-click="article-temperature">
			最后一步是从这个分布中采样来生成下一个 token。<code>temperature（温度）</code>
			这个超参数在此过程中起着关键作用。数学上它是一个非常简单的操作：把模型输出的 logits 直接除以
			<code>temperature</code>：
		</p>

		<ul>
			<li><code>temperature = 1</code>：logits 除以 1 对 softmax 输出没有影响。</li>
			<li>
				<code>temperature &lt; 1</code>：较低的温度会锐化概率分布，让模型更自信、更确定，从而产生更可预测的输出。
			</li>
			<li>
				<code>temperature &gt; 1</code>：较高的温度会让概率分布更平缓，给生成文本带来更多随机性——也就是有些人所说的模型 <em>"创造力"</em>。
			</li>
		</ul>

		<p id="article-sampling" data-click="article-sampling">
			此外，采样过程还可以用 <code>top-k</code>
			和
			<code>top-p</code> 参数进一步细化：
		</p>
		<ul>
			<li>
				<code>top-k 采样</code>：把候选 token 限制为概率最高的 k 个，过滤掉不太可能的选项。
			</li>
			<li>
				<code>top-p 采样</code>：选取累计概率超过阈值 p 的最小 token 集合，既保证只让最可能的 token 参与，又仍然保留一定的多样性。
			</li>
		</ul>
		<p>
			通过调节 <code>temperature</code>、<code>top-k</code> 和 <code>top-p</code>，你可以在确定性与多样性之间取得平衡，让模型的行为契合你的具体需求。
		</p>
	</div>

	<div class="article-section" data-click="article-advanced-features">
		<h2>辅助性的架构特性</h2>

		<p>
			还有几项辅助性的架构特性可以提升 Transformer 模型的表现。它们对模型整体性能很重要，但对理解架构的核心概念没那么关键。Layer Normalization（层归一化）、Dropout（随机失活）和 Residual Connection（残差连接）是 Transformer 模型中至关重要的组件，尤其在训练阶段。Layer Normalization 稳定训练并帮助模型更快收敛；Dropout 通过随机停用神经元来防止过拟合；Residual Connection 让梯度能够直接在网络中流动，有助于缓解梯度消失问题。
		</p>
		<div class="article-subsection" id="article-ln">
			<h3>层归一化（Layer Normalization）</h3>

			<p>
				Layer Normalization 有助于稳定训练过程、改善收敛。它通过在特征维度上对输入进行归一化，使激活值的均值和方差保持一致来工作。这种归一化有助于缓解内部协变量偏移（internal covariate shift）相关的问题，让模型学习更有效，并降低对初始权重的敏感性。在每个 Transformer block 中，Layer Normalization 被应用两次：一次在自注意力机制之前，一次在 MLP 层之前。
			</p>
		</div>
		<div class="article-subsection" id="article-dropout">
			<h3>Dropout（随机失活）</h3>

			<p>
				Dropout 是一种正则化技术，通过在训练时随机把一部分模型权重置零来防止神经网络过拟合。这促使模型学到更鲁棒的特征、减少对特定神经元的依赖，帮助网络更好地泛化到新的、未见过的数据。在模型推理时，dropout 是关闭的。这实际上相当于使用了所训练的多个子网络的集成，从而带来更好的模型表现。
			</p>
		</div>
		<div class="article-subsection" id="article-residual">
			<h3>残差连接（Residual Connections）</h3>

			<p>
				残差连接最早在 2015 年的 ResNet 模型中提出。这一架构创新通过支持训练非常深的神经网络，彻底改变了深度学习。本质上，残差连接是绕过一层或多层的捷径，把某一层的输入加到它的输出上。这有助于缓解梯度消失问题，使得堆叠多个 Transformer block 的深层网络更容易训练。在 GPT-2 中，残差连接在每个 Transformer block 内被使用两次：一次在 MLP 之前，一次在其之后，从而确保梯度更顺畅地流动，让较早的层在反向传播时也能得到足够的更新。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-interactive-features">
		<h1>交互功能</h1>
		<p>
			Transformer Explainer 被设计成可交互的，让你能够探索 Transformer 的内部运作。下面是一些你可以把玩的交互功能：
		</p>

		<ul>
			<li>
				<strong>输入你自己的文本序列</strong>，看模型如何处理它并预测下一个词。探索注意力权重、中间计算，以及最终输出概率是如何算出来的。
			</li>
			<li>
				<strong>使用温度（temperature）滑块</strong>来控制模型预测的随机性。试试通过改变温度值，让模型输出更确定或更有创意。
			</li>
			<li>
				<strong>选择 top-k 和 top-p 采样方法</strong>来调整推理时的采样行为。尝试不同的取值，看概率分布如何变化、又如何影响模型的预测。
			</li>
			<li>
				<strong>与注意力图交互</strong>，看模型如何关注输入序列中不同的 token。把鼠标悬停在 token 上以高亮它们的注意力权重，探索模型如何捕捉上下文以及词与词之间的关系。
			</li>
		</ul>
	</div>

	<div class="article-section" data-click="article-video">
		<h2>视频教程</h2>
		<div class="video-container">
			<iframe
				src="https://www.youtube.com/embed/ECR4oAwocjs"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			>
			</iframe>
		</div>
	</div>

	<div class="article-section" data-click="article-implementation">
		<h2>Transformer Explainer 是如何实现的？</h2>
		<p>
			Transformer Explainer 在浏览器中直接运行一个实时的 GPT-2（small）模型。该模型源自 Andrej Karpathy 的
			<a href="https://github.com/karpathy/nanoGPT" title="Github" target="_blank">nanoGPT 项目</a
			>（GPT 的 PyTorch 实现），并被转换为
			<a href="https://onnxruntime.ai/" title="ONNX" target="_blank">ONNX Runtime</a>
			以便在浏览器中流畅执行。界面用 JavaScript 构建，前端框架采用
			<a href="https://kit.svelte.dev/" title="Svelte" target="_blank">Svelte</a>，并用
			<a href="https://d3js.org/" title="D3" target="_blank">D3.js</a>
			制作动态可视化。数值会随用户输入实时更新。
		</p>
	</div>

	<div class="article-section" data-click="article-credit">
		<h2>Transformer Explainer 由谁开发？</h2>
		<p>
			Transformer Explainer 由

			<a href="https://aereeeee.github.io/" target="_blank">Aeree Cho</a>、
			<a href="https://www.linkedin.com/in/chaeyeonggracekim/" target="_blank">Grace C. Kim</a>、
			<a href="https://alexkarpekov.com/" target="_blank">Alexander Karpekov</a>、
			<a href="https://alechelbling.com/" target="_blank">Alec Helbling</a>、
			<a href="https://zijie.wang/" target="_blank">Jay Wang</a>、
			<a href="https://seongmin.xyz/" target="_blank">Seongmin Lee</a>、
			<a href="https://bhoov.com/" target="_blank">Benjamin Hoover</a> 和
			<a href="https://poloclub.github.io/polochau/" target="_blank">Polo Chau</a>

			在佐治亚理工学院（Georgia Institute of Technology）共同创建。
		</p>
	</div>
</div>

<style lang="scss">
	a {
		color: theme('colors.blue.500');

		&:hover {
			color: theme('colors.blue.700');
		}
	}

	.bold-purple {
		color: theme('colors.purple.700');
		font-weight: bold;
	}

	code {
		color: theme('colors.gray.500');
		background-color: theme('colors.gray.50');
		font-family: theme('fontFamily.mono');
	}

	.q-color {
		color: theme('colors.blue.400');
	}

	.k-color {
		color: theme('colors.red.400');
	}

	.v-color {
		color: theme('colors.green.400');
	}

	.purple-color {
		color: theme('colors.purple.500');
	}

	.article-section {
		padding-bottom: 2rem;
	}
	.architecture-section {
		padding-top: 1rem;
	}
	.video-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		max-width: 100%;
		background: #000;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	#description {
		padding-bottom: 3rem;
		margin-left: auto;
		margin-right: auto;
		max-width: 78ch;
	}

	#description h1 {
		color: theme('colors.purple.700');
		font-size: 2.2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h2 {
		// color: #444;
		color: theme('colors.purple.700');
		font-size: 2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h3 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description h4 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description p {
		margin: 1rem 0;
	}

	#description p img {
		vertical-align: middle;
	}

	#description .figure-caption {
		font-size: 0.8rem;
		margin-top: 0.5rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	#description ol {
		margin-left: 3rem;
		list-style-type: decimal;
	}

	#description li {
		margin: 0.6rem 0;
	}

	#description p,
	#description div,
	#description li {
		color: theme('colors.gray.600');
		line-height: 1.6;
	}

	#description small {
		font-size: 0.8rem;
	}

	#description ol li img {
		vertical-align: middle;
	}

	#description .video-link {
		color: theme('colors.blue.600');
		cursor: pointer;
		font-weight: normal;
		text-decoration: none;
	}

	#description ul {
		list-style-type: disc;
		margin-left: 2.5rem;
		margin-bottom: 1rem;
	}

	#description a:hover,
	#description .video-link:hover {
		text-decoration: underline;
	}

	.figure,
	.video {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
