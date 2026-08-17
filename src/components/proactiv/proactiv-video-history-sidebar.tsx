import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, Film } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { apiGet } from '@/lib/api-client';

interface MotionControlTask {
  id: string;
  status: string;
  resultUrls: string[];
  createdAt: string;
}

export interface ProactivVideoHistorySidebarLabels {
  title: string;
  empty: string;
  open: string;
  download: string;
}

export function ProactivVideoHistorySidebar({
  labels,
}: {
  labels: ProactivVideoHistorySidebarLabels;
}) {
  const { data: session } = useSession();
  const recentTasksQuery = useQuery({
    queryKey: ['evolink-motion-control', 'recent'],
    queryFn: () => apiGet<MotionControlTask[]>('/api/evolink/motion-control'),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
  });
  const videos = (recentTasksQuery.data ?? [])
    .filter((task) => task.status === 'success')
    .flatMap((task) =>
      task.resultUrls.map((resultUrl, index) => ({
        createdAt: task.createdAt,
        downloadUrl: `/api/evolink/motion-control/download?taskId=${encodeURIComponent(task.id)}&index=${index}`,
        id: `${task.id}-${index}`,
        resultUrl,
      }))
    )
    .slice(0, 8);

  return (
    <section aria-label={labels.title}>
      <div className="flex items-center gap-2 px-2.5">
        <Film className="size-3.5 text-[#d1fe17]" aria-hidden="true" />
        <h2 className="text-[10px] font-semibold tracking-[0.14em] text-[#8d98a5] uppercase">
          {labels.title}
        </h2>
      </div>

      {videos.length ? (
        <div className="mt-2.5 space-y-2">
          {videos.map((video) => (
            <article
              key={video.id}
              className="overflow-hidden rounded-xl border border-[#29313b] bg-[#171c23]"
            >
              <a
                href={video.resultUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-video overflow-hidden bg-[#090b0e] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d1fe17]"
                aria-label={labels.open}
              >
                <video
                  src={video.resultUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover opacity-85 transition duration-300 group-hover:scale-[1.035] group-hover:opacity-100"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/15 text-white/0 transition group-hover:bg-black/35 group-hover:text-white">
                  <ExternalLink className="size-4" aria-hidden="true" />
                </span>
              </a>
              <div className="flex items-center justify-between gap-1.5 px-2 py-1.5">
                <time
                  dateTime={video.createdAt}
                  className="min-w-0 truncate text-[10px] font-medium text-[#8893a0]"
                >
                  {formatCreatedAt(video.createdAt)}
                </time>
                <div className="flex shrink-0 items-center gap-0.5">
                  <a
                    href={video.resultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#aeb8c3] transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
                    aria-label={labels.open}
                    title={labels.open}
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={video.downloadUrl}
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#d1fe17] transition hover:bg-[#d1fe17]/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
                    aria-label={labels.download}
                    title={labels.download}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-2.5 rounded-xl border border-dashed border-[#303945] px-3 py-4 text-xs leading-5 text-[#7f8a96]">
          {labels.empty}
        </p>
      )}
    </section>
  );
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
