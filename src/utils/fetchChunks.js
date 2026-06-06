const CACHE_PREFIX = 'onnx-model-cache';
// 缓存名按模型区分：不同模型(如英文 gpt2 / 中文 gpt2-zh)chunk 数和内容都不同，
// 若共用同一缓存名+相同 URL，会把旧模型的 chunk 当作新模型的，导致合并出的
// 模型损坏（protobuf 解析失败）。带 -v2 版本号，改了 chunk 切法时手动 +1。
const cacheNameFor = (cacheKey = 'v2') => `${CACHE_PREFIX}-${cacheKey}`;

async function fetchModelChunks(chunkUrls, cacheKey) {
	const CACHE_NAME = cacheNameFor(cacheKey);
	await clearOldCaches(CACHE_NAME);

	let hasCache = false;
	const cache = await caches.open(CACHE_NAME);
	const cachedResponses = await Promise.all(chunkUrls.map((url) => cache.match(url)));

	// add cache
	const fetchPromises = chunkUrls.map((url, index) => {
		if (!cachedResponses[index]) {
			// console.log(`Fetching and caching: ${url}`);
			return fetch(url).then((response) => {
				if (response.ok) {
					cache.put(url, response.clone());
					return response.arrayBuffer();
				} else {
					throw new Error(`Failed to fetch ${url}`);
				}
			});
		} else {
			hasCache = true;
			// console.log(`Using cached version: ${url}`);
			return cachedResponses[index].arrayBuffer();
		}
	});

	const modelBuffers = await Promise.all(fetchPromises);
	return { hasCache, modelBuffers };
}

export async function fetchAndMergeChunks(urls, cacheKey) {
	const { hasCache, modelBuffers: chunks } = await fetchModelChunks(urls, cacheKey);
	const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
	const mergedArray = new Uint8Array(totalSize);
	let offset = 0;
	for (const chunk of chunks) {
		mergedArray.set(new Uint8Array(chunk), offset);
		offset += chunk.byteLength;
	}
	return { hasCache, mergedArray: mergedArray.buffer };
}

async function clearOldCaches(CACHE_NAME) {
	const cacheNames = await caches.keys();
	await Promise.all(
		cacheNames.map((name) => {
			if (name !== CACHE_NAME && name.includes(CACHE_PREFIX)) {
				console.log(`Deleting old cache: ${name}`);
				return caches.delete(name);
			}
		})
	);
}
