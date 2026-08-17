# ProactivCta specification

## Overview

- Target file: `src/components/proactiv/proactiv-cta.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: hover + tap.

## Structure and styles

- Dark section with subtle left-anchored charcoal/gray radial shafts, max-width 1280px, 32px horizontal padding. Copy and action are flex column then `md:flex-row justify-between items-center`.
- Title is `Get started today with Proactiv to kickstart your marketing efforts`, 20px centered mobile and 30px left-aligned desktop. Description is `Proactiv houses the best in class software tools to kickstart your marketing journey. Join 127,000+ other users to get started.`, 14px then 16px, neutral-400. CTA button is cyan Book a demo with right arrow nudge on hover.
- Include the 6-image overlapping trust group, 5 yellow stars, caption `Trusted by 27,000+ creators.`
- Below is a CSS MacBook: max width 512px, perspective 800, scale .45 mobile/.7 small/1 medium. Lid frame uses `/proactiv/dashboard.png`; keyboard/base uses subtle CSS rows. Hover/tap changes lid transform rotateX(-65deg) to -35deg and dashboard opacity .2 to 1 over 600ms. Charcoal 160px fade at bottom.
- All decorative motion stops with reduced motion. Component receives content and avatar records as props without i18n.
