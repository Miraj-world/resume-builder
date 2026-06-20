import { watch, type FSWatcher } from "node:fs";

export interface MonitoredFolder {
  close: () => void;
}

export function monitorFolder(
  rootPath: string,
  onStableChange: () => void | Promise<void>,
  debounceMs = 1_500
): MonitoredFolder {
  let timeout: NodeJS.Timeout | undefined;
  let running = false;
  let rerunRequested = false;

  const run = async (): Promise<void> => {
    if (running) {
      rerunRequested = true;
      return;
    }

    running = true;
    try {
      await onStableChange();
    } finally {
      running = false;
      if (rerunRequested) {
        rerunRequested = false;
        await run();
      }
    }
  };

  const watcher: FSWatcher = watch(rootPath, { recursive: true }, () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => void run(), debounceMs);
  });

  return {
    close: () => {
      if (timeout) clearTimeout(timeout);
      watcher.close();
    }
  };
}
