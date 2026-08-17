import { m } from '@/paraglide/messages.js';
import { ProactivVideoHistorySidebar } from '@/components/proactiv/proactiv-video-history-sidebar';
import type { ProactivVideoShowcaseCase } from '@/components/proactiv/proactiv-video-showcase';
import { ProactivVideoStudio } from '@/components/proactiv/proactiv-video-studio';
import {
  SenziaAppShell,
  type SenziaNavGroup,
} from '@/components/senzia-app-shell';

const hiddenNavigationIds = new Set([
  'image-to-video',
  'image-generator',
  'video-extender',
  'photo-editor',
]);

function navGroups(): SenziaNavGroup[] {
  return m['proactiv.video.navigation.records']()
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [label, itemsValue] = row.split('||');
      return {
        label: label || undefined,
        items: (itemsValue ?? '')
          .split('~~')
          .filter(Boolean)
          .map((item) => {
            const [id, itemLabel, active] = item.split('|');
            return {
              id: id ?? '',
              label: itemLabel ?? '',
              active: active === 'true',
              href: navHref(id ?? ''),
            };
          })
          .filter((item) => !hiddenNavigationIds.has(item.id)),
      };
    });
}

function navHref(id: string) {
  switch (id) {
    case 'explore':
    case 'image-to-video':
    case 'video-extender':
    case 'image-generator':
    case 'photo-editor':
      return '/text-to-video#studio-feed';
    case 'text-to-video':
      return '/text-to-video';
    case 'home':
      return '/';
    case 'blog':
      return '/blog';
    case 'upgrade':
      return '/pricing';
    default:
      return '/text-to-video';
  }
}

function videoRecords(
  key: 'proactiv.showcase.records' | 'proactiv.video.studio.records'
): ProactivVideoShowcaseCase[] {
  return m[key]()
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [title, description, src, posterSrc, category] = row.split('||');
      return {
        category: category ?? '',
        title: title ?? '',
        description: description ?? '',
        src: src ?? '',
        posterSrc: posterSrc ?? '',
      };
    });
}

function studioCases(): ProactivVideoShowcaseCase[] {
  const homeCases = videoRecords('proactiv.showcase.records').slice(0, 20);
  const extraCases = videoRecords('proactiv.video.studio.records');

  const feedCases = homeCases.flatMap((homeCase, index) =>
    extraCases[index] ? [homeCase, extraCases[index]] : [homeCase]
  );

  // The studio feed is a visual reference surface, so repeat the complete
  // sequence to make the background wall twice as deep without introducing
  // unrelated stock footage.
  return [...feedCases, ...feedCases];
}

/** Localized content wiring for the immersive text-to-video workspace. */
export function TextToVideo({ initialPrompt }: { initialPrompt?: string }) {
  const cases = studioCases();

  return (
    <SenziaAppShell
      brand={m['proactiv.video.reference_brand']()}
      brandHref="/"
      languageLabel={m['proactiv.video.language']()}
      loginLabel={m['proactiv.video.login']()}
      loginHref="/sign-in"
      demoLabel={m['proactiv.book_demo']()}
      demoHref="/book-demo"
      navGroups={navGroups()}
      sidebarPanel={
        <ProactivVideoHistorySidebar
          labels={{
            title: m['proactiv.video.history.title'](),
            empty: m['proactiv.video.history.empty'](),
            open: m['proactiv.video.history.open'](),
            download: m['proactiv.video.history.download'](),
          }}
        />
      }
    >
      <ProactivVideoStudio
        cases={cases}
        initialPrompt={initialPrompt}
        composerLabels={{
          addReference: m['proactiv.hero.composer.add_reference'](),
          aspectRatio: m['proactiv.hero.composer.aspect_ratio'](),
          avatar: m['proactiv.hero.composer.avatar'](),
          batch: m['proactiv.hero.composer.batch'](),
          generate: m['proactiv.hero.composer.generate'](),
          generated: m['proactiv.hero.composer.generated'](),
          image: m['proactiv.hero.composer.image'](),
          model: m['proactiv.hero.composer.model'](),
          placeholder: m['proactiv.hero.composer.placeholder'](),
          product: m['proactiv.hero.composer.product'](),
          removeAttachment: m['proactiv.hero.composer.remove_attachment'](),
          style: m['proactiv.hero.composer.style'](),
          video: m['proactiv.hero.composer.video'](),
        }}
        copy={{
          activeTemplateLabel: m['proactiv.video.studio.active_template'](),
          clipCountLabel: m['proactiv.video.studio.clip_count']({
            count: cases.length,
          }),
          collapseComposerLabel: m['proactiv.video.studio.collapse_composer'](),
          composerLabel: m['proactiv.video.studio.composer'](),
          liveLabel: m['proactiv.video.studio.live'](),
          readyLabel: m['proactiv.video.studio.ready'](),
          referenceImageLabel: m['proactiv.video.studio.reference_image'](),
          referenceVideoLabel: m['proactiv.video.studio.reference_video'](),
          generatedVideoLabel: m['proactiv.video.studio.generated_video'](),
          downloadVideoLabel: m['proactiv.video.studio.download_video'](),
          openGeneratedVideoLabel:
            m['proactiv.video.studio.open_generated_video'](),
          resultExpirationLabel: m['proactiv.video.studio.result_expiration'](),
          resultSavedLabel: m['proactiv.video.studio.result_saved'](),
          uploadsRequiredMessage: m['proactiv.video.studio.uploads_required'](),
          uploadInProgressLabel: m['proactiv.video.studio.uploading'](),
          taskPendingLabel: m['proactiv.video.studio.task_pending'](),
          taskProcessingLabel: m['proactiv.video.studio.task_processing'](),
          taskCompletedLabel: m['proactiv.video.studio.task_completed'](),
          taskFailedLabel: m['proactiv.video.studio.task_failed'](),
          retryGenerationLabel: m['proactiv.video.studio.retry_generation'](),
          selectTemplateLabel: m['proactiv.video.studio.select_template'](),
        }}
      />
    </SenziaAppShell>
  );
}
