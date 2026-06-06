<script lang="ts">
	import { language } from '~/store';
	import ArticleEn from './ArticleEn.svelte';
	import ArticleZh from './ArticleZh.svelte';
</script>

{#if $language === 'en'}
	<ArticleEn />
{:else}
	<ArticleZh />
{/if}
