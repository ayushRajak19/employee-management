import { lazy, type ComponentType } from "react";

const CHUNK_RETRY_PREFIX = "mobius-chunk-retry:";

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | Record<string, any>>,
  namedExport?: string
) {
  return lazy(async () => {
    const pageKey = `${CHUNK_RETRY_PREFIX}${window.location.pathname}`;
    try {
      const module = await factory();
      try {
        sessionStorage.removeItem(pageKey);
      } catch {}

      const modRecord = module as Record<string, any>;
      if (namedExport && modRecord[namedExport]) {
        return { default: modRecord[namedExport] as T };
      }
      return module as { default: T };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkError =
        /dynamically imported module|loading chunk|chunkloaderror|importing a module script|failed to fetch|load failed/i.test(
          message
        );

      if (isChunkError) {
        let alreadyRetried = false;
        try {
          alreadyRetried = sessionStorage.getItem(pageKey) === "true";
          if (!alreadyRetried) {
            sessionStorage.setItem(pageKey, "true");
          }
        } catch {}

        if (!alreadyRetried) {
          console.warn("Chunk load error detected after deployment. Forcing fresh asset reload...", error);
          const url = new URL(window.location.href);
          url.searchParams.set("_reload", String(Date.now()));
          window.location.replace(url.toString());
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw error;
    }
  });
}
