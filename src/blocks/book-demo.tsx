import { Aperture, Clapperboard, Route } from 'lucide-react';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { ProactivBookDemo } from '@/components/proactiv/proactiv-book-demo';

function focusItems() {
  return m['proactiv.demo.focus_records']()
    .split('\n')
    .filter(Boolean)
    .map((row, index) => {
      const [title, description] = row.split('||');
      return {
        title: title ?? '',
        description: description ?? '',
        icon: [Clapperboard, Route, Aperture][index] ?? Clapperboard,
      };
    });
}

export function BookDemo() {
  return (
    <ProactivBookDemo
      brand={envConfigs.app_name}
      backLabel={m['proactiv.demo.back']()}
      title={m['proactiv.demo.title']()}
      description={m['proactiv.demo.description']()}
      focusTitle={m['proactiv.demo.focus_title']()}
      focusItems={focusItems()}
      primaryLabel={m['proactiv.demo.primary_cta']()}
      primaryHref="/sign-up"
      secondaryLabel={m['proactiv.demo.secondary_cta']()}
      previewSrc="/proactiv/dashboard.png"
      previewAlt={m['proactiv.demo.preview_alt']()}
    />
  );
}
