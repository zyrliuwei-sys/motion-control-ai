/**
 * Process upstream media-generation submissions one at a time.
 *
 * This queue is intentionally generic so image and video routes can share the
 * same concurrency guard. It is process-local: deploy a durable shared queue
 * when generation traffic is served by multiple application instances.
 */
type QueuedGeneration = {
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

const pendingGenerations: QueuedGeneration[] = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;

  isProcessing = true;
  try {
    while (pendingGenerations.length) {
      const job = pendingGenerations.shift();
      if (!job) continue;

      try {
        job.resolve(await job.run());
      } catch (error) {
        job.reject(error);
      }
    }
  } finally {
    isProcessing = false;
    if (pendingGenerations.length) void processQueue();
  }
}

/** Queue a single upstream image or video generation submission. */
export function enqueueGeneration<T>(run: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    pendingGenerations.push({
      run,
      resolve: (value) => resolve(value as T),
      reject,
    });
    void processQueue();
  });
}

export function getGenerationQueueSize(): number {
  return pendingGenerations.length + (isProcessing ? 1 : 0);
}
