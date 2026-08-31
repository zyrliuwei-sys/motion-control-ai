import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import {
  ProactivPhotoEditor,
  type ProactivPhotoEditorCopy,
} from '@/components/proactiv/proactiv-photo-editor';
import {
  SenziaAppShell,
  type SenziaNavGroup,
} from '@/components/senzia-app-shell';

const hiddenNavigationIds = new Set([
  'image-to-video',
  'image-generator',
  'video-extender',
]);

function navHref(id: string) {
  switch (id) {
    case 'photo-editor':
      return '/photo-editor';
    case 'explore':
    case 'image-to-video':
    case 'video-extender':
    case 'image-generator':
      return '/text-to-image#studio-feed';
    case 'text-to-video':
      return '/text-to-image';
    case 'home':
      return '/';
    case 'blog':
      return '/blog';
    case 'upgrade':
      return '/pricing';
    default:
      return '/photo-editor';
  }
}

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
            const [id, itemLabel] = item.split('|');
            return {
              id: id ?? '',
              label: itemLabel ?? '',
              active: id === 'photo-editor',
              href: navHref(id ?? ''),
            };
          })
          .filter((item) => !hiddenNavigationIds.has(item.id)),
      };
    });
}

function editorCopy(): ProactivPhotoEditorCopy {
  return {
    addImagesLabel: m['proactiv.photo_editor.add_images'](),
    completedLabel: m['proactiv.photo_editor.completed'](),
    description: m['proactiv.photo_editor.description'](),
    downloadLabel: m['proactiv.photo_editor.download'](),
    dropImagesLabel: m['proactiv.photo_editor.drop_images'](),
    editModeLabel: m['proactiv.photo_editor.edit_mode'](),
    editingLabel: m['proactiv.photo_editor.editing'](),
    failedLabel: m['proactiv.photo_editor.failed'](),
    generatedFailedLabel: m['proactiv.photo_editor.generated_failed'](),
    generateImageLabel: m['proactiv.photo_editor.generate_image'](),
    generateLabel: m['proactiv.photo_editor.generate'](),
    generatedReadyLabel: m['proactiv.photo_editor.generated_ready'](),
    generatingImageLabel: m['proactiv.photo_editor.generating_image'](),
    generatingLabel: m['proactiv.photo_editor.generating'](),
    imageCountLabel: (values) => m['proactiv.photo_editor.image_count'](values),
    imagesRequiredMessage: m['proactiv.photo_editor.images_required'](),
    openLabel: m['proactiv.photo_editor.open'](),
    outputFormatLabel: m['proactiv.photo_editor.output_format'](),
    generatedOutputLabel: m['proactiv.photo_editor.generated_output'](),
    generatedOutputPendingLabel:
      m['proactiv.photo_editor.generated_output_pending'](),
    outputLabel: m['proactiv.photo_editor.output'](),
    outputPendingLabel: m['proactiv.photo_editor.output_pending'](),
    promptLabel: m['proactiv.photo_editor.prompt'](),
    promptPlaceholder: m['proactiv.photo_editor.prompt_placeholder'](),
    promptRequiredMessage: m['proactiv.photo_editor.prompt_required'](),
    queuedLabel: m['proactiv.photo_editor.queued'](),
    removeImageLabel: m['proactiv.photo_editor.remove_image'](),
    signInLabel: m['proactiv.photo_editor.sign_in'](),
    signInRequiredMessage: m['proactiv.photo_editor.sign_in_required'](),
    sourceLabel: m['proactiv.photo_editor.source'](),
    textDescription: m['proactiv.photo_editor.text_description'](),
    textModeLabel: m['proactiv.photo_editor.text_mode'](),
    textOutputFormatLabel: m['proactiv.photo_editor.text_output_format'](),
    textPromptLabel: m['proactiv.photo_editor.text_prompt'](),
    textPromptPlaceholder: m['proactiv.photo_editor.text_prompt_placeholder'](),
    title: m['proactiv.photo_editor.title'](),
  };
}

/** Localized page composition for FLUX.2 image editing. */
export function PhotoEditor({
  initialMode,
  initialPrompt,
}: {
  initialMode?: 'edit' | 'text';
  initialPrompt?: string;
}) {
  return (
    <SenziaAppShell
      brand={envConfigs.app_name}
      brandHref="/"
      languageLabel={m['proactiv.video.language']()}
      demoLabel={m['proactiv.book_demo']()}
      demoHref="/book-demo"
      collapseSidebarLabel={m['proactiv.sidebar.collapse']()}
      expandSidebarLabel={m['proactiv.sidebar.expand']()}
      navGroups={navGroups()}
    >
      <ProactivPhotoEditor
        copy={editorCopy()}
        initialMode={initialMode}
        initialPrompt={initialPrompt}
      />
    </SenziaAppShell>
  );
}
