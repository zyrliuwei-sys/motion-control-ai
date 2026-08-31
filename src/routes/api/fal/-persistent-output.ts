import type { SaveFilesFunction } from '@/core/ai';
import { getAllConfigs } from '@/modules/config/service';
import { getStorage } from '@/modules/storage/service';

function hasPublicHttpsDomain(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Saves completed provider outputs to the configured public R2 bucket before
 * their upstream URLs expire. Without a public R2 domain we retain Fal's URL,
 * rather than storing a link that the browser cannot render.
 */
export async function getPersistentOutputSaver(): Promise<
  SaveFilesFunction | undefined
> {
  const configs = await getAllConfigs();
  if (!hasPublicHttpsDomain(configs.r2_domain)) return undefined;

  const storage = await getStorage();
  if (!storage) return undefined;

  return async (files) =>
    Promise.all(
      files.map(async (file) => {
        const saved = await storage.downloadAndUpload({
          contentType: file.contentType,
          disposition: 'inline',
          key: file.key,
          url: file.url,
        });
        if (!saved.success || !saved.url) {
          throw new Error(saved.error || 'Unable to permanently save output');
        }

        return { ...file, url: saved.url };
      })
    );
}
