import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { House, Sparkles } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { apiGet, apiPost, apiUpload } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { BrandWordmark } from '@/components/brand-wordmark';
import {
  ImageGeneratorWorkspace,
  type GeneratedImage,
  type ImageGenerationInput,
  type ImageGenerationStatus,
  type ImageGenerationTask,
} from '@/components/image-generator-kit';

const GROK_IMAGINE_IMAGE_API = '/api/evolink/grok-imagine-image';
const GROK_IMAGINE_ASPECT_RATIOS = [
  '',
  '1:1',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '16:9',
  '9:16',
  '2:1',
  '1:2',
  '19.5:9',
  '9:19.5',
  '20:9',
  '9:20',
] as const;

type GrokImagineImageTask = {
  createdAt: string;
  errorMessage?: string;
  id: string;
  model: string;
  resultUrls: string[];
  status: string;
};

type WorkspaceTask = ImageGenerationTask;

function imageSizeForRatio(aspectRatio: string) {
  return GROK_IMAGINE_ASPECT_RATIOS.includes(
    aspectRatio as (typeof GROK_IMAGINE_ASPECT_RATIOS)[number]
  )
    ? aspectRatio || 'auto'
    : 'auto';
}

function workspaceStatus(status: string): ImageGenerationStatus {
  if (status === 'success') return 'success';
  if (status === 'processing') return 'processing';
  if (status === 'failed' || status === 'canceled') return 'failed';
  return 'queued';
}

function displayModel(_task: GrokImagineImageTask) {
  return 'Uncensored AI Image';
}

function toWorkspaceTask(
  task: GrokImagineImageTask,
  prompt: string
): WorkspaceTask {
  return {
    createdAt: task.createdAt,
    error: task.errorMessage,
    id: task.id,
    images: task.resultUrls.map((src, index) => ({
      alt: prompt,
      id: `${task.id}-${index}`,
      src,
    })),
    model: displayModel(task),
    prompt,
    status: workspaceStatus(task.status),
  };
}

function isTerminal(status: ImageGenerationStatus) {
  return status === 'success' || status === 'failed';
}

function isPublicHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

async function uploadReferences(input: ImageGenerationInput) {
  const existingUrls = input.references.flatMap((reference) =>
    reference.url && isPublicHttpsUrl(reference.url) ? [reference.url] : []
  );
  const files = input.references.flatMap((reference) =>
    reference.file ? [reference.file] : []
  );

  if (!files.length) return existingUrls;

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file, file.name));
  const upload = await apiUpload<{ urls: string[] }>(
    '/api/storage/upload-image',
    formData
  );

  if (upload.urls.length !== files.length) {
    throw new Error(m['image_generator.upload_failed']());
  }
  if (!upload.urls.every(isPublicHttpsUrl)) {
    throw new Error(m['image_generator.public_storage_required']());
  }

  return [...existingUrls, ...upload.urls];
}

function promptForGeneration(input: ImageGenerationInput) {
  const prompt = input.prompt.trim() || m['image_generator.reference_prompt']();
  const notes = input.references
    .flatMap((reference) =>
      reference.note?.trim()
        ? [`${reference.name}: ${reference.note.trim()}`]
        : []
    )
    .join('\n');

  return notes ? `${prompt}\n\nReference guidance:\n${notes}` : prompt;
}

/**
 * Localized composition and API adapter for the copy-ready image workspace.
 * The workspace remains package-owned; this file translates its input into the
 * project's EvoLink Grok Imagine Image 2.0 and storage endpoints.
 */
export function ImageGenerator({
  initialPrompt = '',
}: {
  initialPrompt?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const activeTasks = tasks.filter((task) => !isTerminal(task.status));
  const taskQueries = useQueries({
    queries: activeTasks.map((task) => ({
      enabled: Boolean(session?.user),
      queryFn: async () =>
        toWorkspaceTask(
          await apiGet<GrokImagineImageTask>(
            `${GROK_IMAGINE_IMAGE_API}?taskId=${encodeURIComponent(task.id)}`
          ),
          task.prompt
        ),
      queryKey: ['image-generator-task', 'grok-imagine-image', task.id],
      refetchInterval: (query) =>
        isTerminal(query.state.data?.status ?? task.status) ? false : 3_000,
    })),
  });

  const myImages = tasks.map((task) => {
    const activeIndex = activeTasks.findIndex((entry) => entry.id === task.id);
    return activeIndex === -1 ? task : (taskQueries[activeIndex]?.data ?? task);
  });

  const onGenerate = async (input: ImageGenerationInput) => {
    const prompt = promptForGeneration(input);
    const request = {
      imageUrls: await uploadReferences(input),
      n: input.imageCount,
      quality: 'medium' as const,
      prompt,
      resolution: '1K' as const,
      size: imageSizeForRatio(input.aspectRatio),
    };
    const task = await apiPost<GrokImagineImageTask>(
      GROK_IMAGINE_IMAGE_API,
      request
    );
    const workspaceTask = toWorkspaceTask(task, prompt);

    setTasks((current) => [
      workspaceTask,
      ...current.filter((entry) => entry.id !== workspaceTask.id),
    ]);
    return workspaceTask;
  };

  const onDownload = (image: GeneratedImage, task: ImageGenerationTask) => {
    const imageIndex = Math.max(
      0,
      task.images?.findIndex((entry) => entry.id === image.id) ?? 0
    );
    const link = document.createElement('a');
    link.href = `${GROK_IMAGINE_IMAGE_API}?taskId=${encodeURIComponent(task.id)}&download=1&index=${imageIndex}`;
    link.click();
  };

  return (
    <section className="min-h-screen bg-white px-3 py-3 text-neutral-950 sm:px-5 sm:py-5 dark:bg-[#06070a] dark:text-white">
      <ImageGeneratorWorkspace
        brand={<BrandWordmark brand={envConfigs.app_name} />}
        className="mx-auto max-w-[1440px]"
        copy={{
          addReference: m['image_generator.add_reference'](),
          aspectRatio: m['image_generator.aspect_ratio'](),
          community: m['image_generator.community'](),
          create: m['image_generator.create'](),
          dropImages: m['image_generator.drop_images'](),
          emptyCommunity: m['image_generator.empty_community'](),
          emptyMine: m['image_generator.empty_mine'](),
          generate: m['image_generator.generate'](),
          generating: m['image_generator.generating'](),
          imageCount: m['image_generator.image_count'](),
          mine: m['image_generator.mine'](),
          model: m['image_generator.model'](),
          noProvider: m['image_generator.no_provider'](),
          promptPlaceholder: m['image_generator.prompt_placeholder'](),
          referenceNote: m['image_generator.reference_note'](),
          removeReference: m['image_generator.remove_reference'](),
          result: m['image_generator.result'](),
          signInToGenerate: m['image_generator.sign_in_to_generate'](),
          uploadLimit: (max) => m['image_generator.upload_limit']({ max }),
        }}
        defaultAspectRatio="16:9"
        initialPrompt={initialPrompt}
        isAuthenticated={Boolean(session?.user)}
        maxReferences={3}
        models={['Uncensored AI Image']}
        myImages={myImages}
        navItems={[
          {
            icon: <Sparkles className="size-4" />,
            label: m['image_generator.nav_studio'](),
            onClick: () => router.push('/image-generator'),
          },
          {
            icon: <House className="size-4" />,
            label: m['image_generator.nav_home'](),
            onClick: () => router.push('/'),
          },
        ]}
        onDownload={onDownload}
        onGenerate={onGenerate}
        onRequireAuth={() =>
          router.push(
            `/sign-in?callbackUrl=${encodeURIComponent('/image-generator')}`
          )
        }
        supportedAspectRatios={GROK_IMAGINE_ASPECT_RATIOS}
      />
    </section>
  );
}
