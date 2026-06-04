# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Transformer Explainer — an interactive SvelteKit visualization that runs a **live GPT-2 model entirely in the browser** (via `onnxruntime-web`) so users can type text and watch every internal Transformer operation (embeddings → attention → MLP → logits → sampling) update in real time. Companion to the IEEE VIS 2024 paper (arXiv:2408.04619).

This repo is a **fork** that auto-syncs from `poloclub/transformer-explainer` daily (`.github/workflows/sync.yml`). Prefer keeping local changes minimal/rebase-friendly to avoid sync conflicts.

## Commands

```bash
npm install          # Node >=20, npm >=10 required
npm run dev          # dev server at http://localhost:5173
npm run build        # static build into ./build (adapter-static)
npm run preview      # serve the production build
npm run check        # svelte-kit sync + svelte-check (type checking)
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run deploy       # gh-pages -d build --nojekyll  (publishes to GitHub Pages)
```

There is **no test suite**. `npm run check` is the closest thing to verification — run it after type-affecting changes.

## Deployment constraints (important)

- Built with **`adapter-static`** and `prerender = true` (`src/routes/+page.ts`). The whole app is one prerendered static page — no server runtime exists. Anything requiring SSR or server endpoints will not work.
- `svelte.config.js` sets `paths.base = '/transformer-explainer'` in production. **Always build asset/model URLs with the `base` import** (`import { base } from '$app/paths'`), never hardcode `/`. Getting this wrong breaks all assets on GitHub Pages.

## Architecture

### Browser inference pipeline
1. **Tokenization** — `@xenova/transformers` `AutoTokenizer.from_pretrained('Xenova/gpt2')` (downloads tokenizer from HF on mount).
2. **Model loading** — `src/utils/fetchChunks.js` fetches the 63 chunks of `static/model-v2/gpt2.onnx.part*`, caches each in the browser **Cache API** (`onnx-model-cache-v2`), merges them into one `ArrayBuffer`, and creates an `ort.InferenceSession` from a Blob URL. WASM binaries are loaded from a jsDelivr CDN (`ort.env.wasm.wasmPaths` in `+page.svelte`).
3. **Inference + sampling** — `src/utils/data.ts` `runModel()` runs the session, extracts `linear_output` (logits) plus per-head attention tensors, then applies temperature scaling and top-k/top-p sampling (`getProbabilities` / `randomChoice` mimics `np.random.choice`).

### Why the model is chunked
The full ONNX model exceeds GitHub Pages' per-file size limit, so `chunk.py` splits it into 10MB `.part*` files committed under `static/model-v2/`. They are re-merged client-side at runtime.

### The model exports intermediate tensors
The exported ONNX graph deliberately emits **internal** attention activations as named outputs so they can be visualized. `data.ts` builds `targetTensors` programmatically as, for every block `i` and head `j`:
`block_{i}_attn_head_{j}_attn`, `_attn_scaled`, `_attn_masked`, `_attn_softmax`, `_attn_dropout`.
GPT-2 config (12 layers, 12 heads, dim 768, 63 chunks) lives in `modelMetaMap` in `src/store/index.ts`.

### Cached examples — first paint AND mobile
`src/constants/examples/ex0.js`–`ex4.js` are large precomputed outputs (logits + tokens) for the 5 default prompts. `fakeRunWithCachedData()` in `data.ts` displays these:
- **before** the ONNX model finishes downloading (instant first render), and
- as the **only** data path on **mobile** — `+page.svelte` skips `fetchModel()` entirely when `$isMobile` is true (the model is too large for phones).
If you change example prompts you must regenerate the matching `exN.js` cache, or live inference and the cached fallback will disagree.

### State management
`src/store/index.ts` is the single source of truth — a large set of Svelte `writable`/`derived` stores (current block/head index, animation flags, `modelData`, `modelSession`, temperature, sampling, hover/popover interactivity, textbook navigation, etc.). Components subscribe directly; there is no other state layer. `+page.svelte` is the orchestrator that wires inputs → `runModel`/`fakeRunWithCachedData`.

### UI layers
- `src/components/` — visualization components mirroring the Transformer's structure (`Embedding`, `QKV`, `Attention`, `AttentionMatrix`, `Mlp`, `LinearSoftmax`, `Sampling`, `Temperature`, `Sankey`, etc.). `Popovers/` and `WeightPopovers.svelte` render the hover detail cards.
- `src/components/textbook/` + `src/utils/textbookPages.ts` — the guided "textbook" walkthrough overlay.
- Animations use **GSAP** (`src/utils/gsap.ts`, `animation.ts`); diagrams use **d3** / `d3-sankey`; math rendering uses **KaTeX** (`src/utils/Katex.svelte`).

### Path alias
`~` → `./src` (configured in both `svelte.config.js` and `tsconfig.json`). Use `import { x } from '~/store'` etc.

## Python model pipeline (`src/utils/model/`)

Not part of the web build — only needed to regenerate the ONNX model. Run with `python3`.
1. `model.py` — GPT-2 implementation whose `forward` returns a nested dict of every intermediate activation.
2. `export_to_onnx.py` — wraps the model to flatten those intermediates into named ONNX outputs, exports to `params_output/`.
3. `quantize.py` — optional quantization.
4. `chunk.py` — splits the `.onnx` into 10MB parts under `static/model-v2/`.

## Conventions

- Tabs for indentation, single quotes, no Tailwind-class sorting surprises (Prettier with `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`). Run `npm run format` before committing.
- Styling: Tailwind + SCSS. `src/styles/variables.scss` is auto-injected into every SCSS block (`vite.config.ts`), so SCSS variables/mixins are globally available without `@import`.
- Type checking is via `svelte-check` with `checkJs: true` and `strict: true`; `.js` files in `src/` are type-checked too.
