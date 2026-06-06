import { writable, derived, readable } from 'svelte/store';
import * as ort from 'onnxruntime-web';
import tailwindConfig from '../../tailwind.config';
import resolveConfig from 'tailwindcss/resolveConfig';
import { ex0 } from '~/constants/examples';
import { textPages } from '~/utils/textbookPages';

const { theme } = resolveConfig(tailwindConfig);

export const attentionHeadIdxTemp = writable(0);
export const attentionHeadIdx = writable(0);
export const blockIdxTemp = writable(0);
export const blockIdx = writable(0);
export const isOnBlockTransition = writable(false);

export const isOnAnimation = writable(false);

// Textbook state management
export const textbookCurrentPage = writable<number>(0);
export const textbookPreviousPage = writable<number>(-1);
export const textbookCurrentPageId = writable<string>(textPages[0].id);
export const textbookPreviousPageId = writable<string>('');
export const isTextbookOpen = writable<boolean>(true);

// is transformer running?
export const isModelRunning = writable(false);
export const isFetchingModel = writable(true);
export const isLoaded = writable(false);

// ============================================================================
// 模型开关：默认 'gpt2'（英文，开箱即用）。
// 用 src/utils/model/export_chinese.py 生成中文资产后，改为 'gpt2-zh' 即切换中文版。
// ============================================================================
export const ACTIVE_MODEL = 'gpt2-zh';

const inputTextExampleMap: Record<string, string[]> = {
	gpt2: [
		'Data visualization empowers users to',
		'Artificial Intelligence is transforming the',
		'As the spaceship was approaching the',
		'On the deserted planet they discovered a',
		'IEEE VIS conference highlights the'
	],
	'gpt2-zh': [
		'人工智能正在改变',
		'数据可视化让用户能够',
		'在那个荒凉的星球上，他们发现了',
		'机器学习的核心思想是',
		'今天天气非常'
	]
};

export const inputTextExample = inputTextExampleMap[ACTIVE_MODEL] ?? inputTextExampleMap.gpt2;

const initialExIdx = 0;
export const selectedExampleIdx = writable<number>(initialExIdx);

export const modelSession = writable<ort.InferenceSession>();

// transformer model output
export const modelData = writable<ModelData>(ex0);
export const predictedToken = writable<Probability>();
export const tokens = writable<string[]>(ex0?.tokens);
export const tokenIds = writable<number[]>(ex0?.tokenIds);

export const modelMetaMap: Record<string, ModelMetaData> = {
	gpt2: {
		layer_num: 12,
		attention_head_num: 12,
		dimension: 768,
		chunkTotal: 63,
		tokenizer: 'Xenova/gpt2',
		localTokenizer: false,
		addSpecialTokens: false,
		hasCachedExamples: true
	},
	// 中文版（uer/gpt2-chinese-cluecorpussmall）。结构与英文 GPT-2 相同（12/12/768），
	// 词表 21128（字符级，无乱码）。chunkTotal 需在跑完 export_chinese.py 后改成实际 N。
	'gpt2-zh': {
		layer_num: 12,
		attention_head_num: 12,
		dimension: 768,
		chunkTotal: 46, // export_chinese.py 实测：中文模型切出 46 个 chunk
		tokenizer: 'gpt2-chinese', // 本地：static/models/gpt2-chinese/
		localTokenizer: true,
		addSpecialTokens: false, // BertTokenizer 默认会加 [CLS]/[SEP]，必须关掉
		// 中文示例缓存(ex0..ex4)曾尝试用 onnxruntime 离线生成，但文件过大(单个 prompt 含
		// 720 个注意力张量，最大 ~3MB)，会拖垮 Vite/Rollup 的 SSR/打包(解析超大对象字面量)。
		// 故保持 false：英文 ex 仅作占位，桌面端模型加载完即实时跑中文；
		// embedding 文字另由 onMount 即时分词填充(见 +page.svelte)，避免英文回退。
		hasCachedExamples: false
	},
	'gpt2-medium': { layer_num: 24, attention_head_num: 16, dimension: 1024 },
	'gpt2-large': { layer_num: 36, attention_head_num: 20, dimension: 1280 }
};

// 当前激活模型的元数据（供 +page.svelte / data.ts 读取分词器、chunk 数等）
export const activeModelMeta: ModelMetaData = modelMetaMap[ACTIVE_MODEL];

// selected token vector
export const highlightedToken = writable<HighlightedToken>({
	index: null,
	value: null,
	fix: false
});

export const highlightedHead = writable<HighlightedToken>({
	index: null,
	value: null,
	fix: false
});

// expanded block
export const expandedBlock = writable<ExpandedBlock>({ id: null });
export const isExpandOrCollapseRunning = writable(false);

// user input text
export const inputText = writable(inputTextExample[initialExIdx]);
// export const tokens = derived(inputText, ($inputText) => $inputText.trim().split(' '));

// selected model and meta data
const initialSelectedModel = ACTIVE_MODEL;
export const selectedModel = writable(initialSelectedModel);
export const modelMeta = derived(selectedModel, ($selectedModel) => modelMetaMap[$selectedModel]);

// Temperature setting
export const initialTemperature = 0.8;
export const temperature = writable(initialTemperature);

// Sampling
export const sampling = writable<Sampling>({ type: 'top-k', value: 5 });

// Prediction visual
export const highlightedIndex = writable(null);
export const finalTokenIndex = writable(null);

// Visual element style
export const rootRem = 16;
export const minVectorHeight = 12;
export const maxVectorHeight = 30;
export const maxVectorScale = 3.4;

export const vectorHeight = writable(0);
export const headContentHeight = writable(0);
export const headGap = { x: 5, y: 8, scale: 0 };

export const isBoundingBoxActive = writable(false);

export const predictedColor = theme.colors.purple[600];

// Interactivity
export const hoveredPath = writable();
export const hoveredMatrixCell = writable({ row: null, col: null });
export const weightPopover = writable();
export const tooltip = writable();

export const isMobile = readable(false, (set) => {
	if (typeof window !== 'undefined') {
		// Only run in browser environment
		const userAgent = navigator.userAgent.toLowerCase();
		set(/android|iphone|ipad|ipod/i.test(userAgent));
	}
	return () => {}; // Cleanup function
});

// User identification
export const userId = writable<string | null>(null);

// 语言切换（中文 zh / 英文 en），持久化到 localStorage，默认中文
export type Lang = 'zh' | 'en';
const getInitialLang = (): Lang => {
	if (typeof localStorage !== 'undefined') {
		const v = localStorage.getItem('te-lang');
		if (v === 'en' || v === 'zh') return v;
	}
	return 'zh';
};
export const language = writable<Lang>(getInitialLang());
if (typeof window !== 'undefined') {
	language.subscribe((v) => {
		try {
			localStorage.setItem('te-lang', v);
		} catch {
			/* ignore */
		}
	});
}