# ProactivTools specification

## Overview

- Target file: `src/components/proactiv/proactiv-tools.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: scroll-driven.

## DOM and exact styles

- Section is dark and starts with 80px vertical padding, increasing to 160px at 768px. It contains the same 56px cyan icon badge, heading `Perfect set of tools`, and description `Proactiv comes with perfect tools for the perfect jobs out there.`
- Desktop inner container has max-width 1280px, 40px padding. Each tool has 160px vertical margin and a 3-column grid, 32px gap: text in first third, screenshot in the last two thirds. H2 is 36px bold, description 18px bold neutral-500.
- Screenshot shell: 16px padding, zinc-900 surface, zinc-800 border, 8px radius, deep shadow. Image width 100%, 8px radius. Add two 1px bottom glow rules, one cyan full-width and one 160px indigo centered.
- Tool records, in order:
  1. Email Automation / `With our best in class email automation, you can automate your entire emailing process.` / `/proactiv/first.png`.
  2. Cross Platform Marketing / `With our cross platform marketing, you can reach your audience on all the platforms they use.` / `/proactiv/second-backup.png`.
  3. Managed CRM / `With our managed CRM, you can manage your leads and contacts in one place.` / `/proactiv/fourth-backup.png`.
  4. Apps Automation / `We have cloned zapier and built our very own apps automation platform.` / `/proactiv/third.png`.

## Behaviours

- Use Motion scroll progress on the section. Map the backdrop through charcoal, neutral-900, gray-900, charcoal during the four records with a 500ms transition.
- At desktop, card copy fades around its viewport center and its visual shifts up to 200px. The first screenshot fades in during its central scroll range. The visual can remain fully opaque for entries 2-4.
- At <1024px do not retain scroll transformations: use a standard single column static stack with 40px gaps, 24px titles, 14px then 16px at 768px descriptions. This is necessary for readable mobile content.
- Respect reduced motion.

## API

- Receive tool records as props, do not access i18n internally. Use Lucide Mail, Share2 and Terminal icons as simple cyan markers.
