import { isVueMarkdownPage } from '@vitebook/plugin-markdown-vue/shared';
import { isStoryPage } from '@vitebook/plugin-story/shared';
import { Component, markRaw, Ref, ref, shallowReadonly, watch } from 'vue';

import type { LoadedPage, Page } from '../types/page';
import type { VueStoryConfig } from '../types/story';
import { usePages } from './usePages';

export type PageRef = Ref<Readonly<LoadedPage> | undefined>;

// Singleton.
const pageRef: PageRef = ref(undefined);

const loadedPageCache = new WeakMap<Page, LoadedPage>();

export function usePage(): Readonly<PageRef> {
  return shallowReadonly(pageRef);
}

export function getCachedLoadedPage(page: Page): LoadedPage | undefined {
  return loadedPageCache.get(page);
}

export function deleteCachedLoadedPage(page: Page): void {
  loadedPageCache.delete(page);
}

export function setPageRef(loadedPage?: LoadedPage): void {
  pageRef.value = loadedPage ? shallowReadonly(loadedPage) : undefined;
}

export async function loadPage(page: Page): Promise<Component> {
  let component: Component;
  let loadedPage: LoadedPage | undefined;

  if (isStoryPage(page)) {
    // Story
    const data = await page.loader();

    if ('component' in data.default) {
      component = data.default.component;
      data.default.component = markRaw(data.default.component);
      loadedPage = { ...page, story: data.default as VueStoryConfig };
    } else {
      component = data.default;

      if (data.story?.component) {
        data.story.component = markRaw(data.story.component ?? {});
      }

      loadedPage = { ...page, story: data.story };
    }
  } else if (isVueMarkdownPage(page)) {
    // Markdown
    const data = await page.loader();
    component = data.default;
    loadedPage = { ...page, data: data.data };
  } else {
    component = await page.loader();
    loadedPage = undefined;
  }

  if (loadedPage) loadedPageCache.set(page, loadedPage);
  setPageRef(loadedPage);

  return component;
}

if (import.meta.hot) {
  const pages = usePages();

  watch(
    () => pages.value,
    async (pages) => {
      for (const page of pages) {
        if (page.route === pageRef.value?.route) {
          await loadPage(page);
        }
      }
    }
  );
}