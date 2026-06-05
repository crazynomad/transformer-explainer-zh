type Flow = {
	type?: 'path' | 'node';
	id: string;
	from?: string;
	to?: string;
	match?: boolean;
	arrow?: boolean;
	anchor?: { from?: 'l' | 'r' | 't' | 'b'; to?: 'l' | 'r' | 't' | 'b' };
	stroke?: { width?: number };
	transition?: gsap.TweenVars & { position?: gsap.Position };
	curve?: 'vh' | 'hv';
};

type MatrixData = number[][];

type ModelMetaData = {
	layer_num: number;
	attention_head_num: number;
	dimension: number;
	chunkTotal?: number;
	tokenizer?: string; // 分词器名称：远程 HF id（如 'Xenova/gpt2'）或本地模型名（如 'gpt2-chinese'）
	localTokenizer?: boolean; // true=从 static/models 本地加载（中文版用）
	addSpecialTokens?: boolean; // 分词时是否加特殊 token（中文 BertTokenizer 需为 false）
	hasCachedExamples?: boolean; // 是否有预生成的 exN 示例缓存（无则桌面端等模型加载后实时跑）
};

type HighlightedToken = {
	index: number | string | null;
	value?: string | null;
	fix?: boolean;
};

type HighlightedHead = {
	index: number | string | null;
	value?: string | null;
	fix?: boolean;
};

type ExpandedBlock = { id: number | string | null };

type Probability = {
	rank: number;
	tokenId: number;
	token: string;
	logit: number;
	scaledLogit: number;
	expLogit: number;
	probability: number;
	topKLogit?: number;
	topPProbability?: number;
	cumulativeProbability?: number;
	cutoffIndex?: number;
};
type Probabilities = Probability[];
type ModelData = {
	logits: number[];
	outputs: Record<string, { data: number[][]; dims: number[]; size: number }>;
	probabilities: Probabilities;
	sampled: Probability;
};

type Sampling = { type: 'top-k' | 'top-p'; value: number };
