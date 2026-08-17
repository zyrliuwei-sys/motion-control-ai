# SenziaTextToVideoContent Specification

## Overview

- **Target file:** `src/components/senzia-text-to-video-content.tsx`
- **Reference:** `https://www.senzia.cc/text-to-video`
- **Interaction model:** mostly static; click-driven CTA and FAQ disclosures

## Verified Page Sections

The reference continues below the application workspace in this order:

1. `Text to Video AI Generator Free Online` intro and `Try Text to Video Free` CTA.
2. `What is Senzia’s Text to Video?`
3. `How Does Senzia's Text to Video Work?` with three steps.
4. `What You Can Do with Senzia's Text to Video` with four media cards.
5. `Who is Senzia's Text to Video for?` with three cards.
6. `Why Choose Senzia's Text to Video?` with three reasons.
7. reviews, FAQ, and a Senzia footer.

## Layout Targets

Live computed styles could not be retrieved because the source endpoint returned 403/timeouts. The values below are consciously marked implementation targets:

- dark document continuation: `#0d1014`
- content width: `1120px`
- section vertical padding: `88px` desktop / `56px` mobile
- neutral rules: `#252b34`
- cards: `#141a21`, one-pixel `#2d3743` border, 10px radius
- desktop grids: 3 columns for steps/reasons/audience, 4 columns for abilities
- mobile: each grid becomes one column

## Behaviors

- Primary CTA routes to the user-provided sign-up destination.
- FAQ rows are native `details` disclosures with only one visual state change: caret rotation and a visible answer.
- Cards gain a subtle border change and `translateY(-2px)` on pointer hover over `150ms ease`.

## Assets

The source crawl identified media at `source-senzia-cdn.senzia.cc/pages/0422/texttovideo/1.webp` through `6.webp` plus `who/1.webp` through `3.webp`, but their host returned 403 during the clone run. The implementation uses existing local Motion Control AI preview assets rather than embedding unreachable remote images.

## Responsive Behavior

- **Desktop (1440px):** centered editorial columns below the full-width app workspace.
- **Tablet (768px):** ability cards become two columns.
- **Mobile (390px):** all content cards stack; no horizontal overflow.
