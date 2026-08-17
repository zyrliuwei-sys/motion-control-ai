# ProactivHero specification

## Overview

- Target file: `src/components/proactiv/proactiv-hero.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: hover, click and scroll-driven motion.

## DOM and exact styles

- Section is `position: relative; overflow: hidden; display:flex; flex-direction:column; min-height:1120px; padding-top:160px`; mobile min-height 1120px with 80px padding top. Content is centered in a 1280px max-width container with 16px side padding.
- H1 text: `Transform Your Marketing with Proactiv`; 36px on mobile, 96px at 1024px; weight 600, center, 1.1 line height, max width 1152px, 24px vertical padding.
- Subhead: `Automate Campaigns, Engage Audiences, and Boost Lead Generation with Our All-in-One Marketing Solution`; 16px then 20px at 768px, max width 768px, neutral gray and centered.
- Avatar strip: six 56px square photo cards, 16px corner radius, 2px neutral border, overlapping by 16px. It has five 16px yellow stars and the exact caption `Trusted by 27,000+ creators.`
- CTA: cyan button `Book a demo` navigates to `/book-demo`; its arrow translates 4px on hover.
- Preview is a `max-width: 1152px`, 320px high then 800px at 768px, dark 4px `rgb(23,23,23)` framed panel, 30px outer radius / 16px inner radius, 8px padding. It uses `/proactiv/dashboard.png` with `object-fit: cover`, a central play button and a bottom charcoal fade.

## Behaviour

- Avatar cards fade and scale into place with 100ms stagger. Hover scales a photo and shows its tooltip. Tooltips are optional on touch.
- Preview starts grayscale and becomes color on hover. Clicking play opens an accessible modal containing the source video `https://www.youtube.com/watch?v=dC1yHLp9bWA`.
- Scroll mapping on the preview: rotateX 20deg to 0deg during first half of its target scroll range, and y 0px to 100px through the whole range. Use Motion hooks. Do not use scroll event listeners.
- Add a narrow cyan meteor trail across the top frame with transform/opacity CSS animation. Reduced motion displays the static frame and no beam.

## Assets and API

- Asset: `/proactiv/dashboard.png` (3100×1882).
- Receive all copy and testimonial photos as props. Component must not read i18n.
- Use existing Lucide icons, Motion and shadcn Dialog. No Next-only APIs.

## Responsive behavior

- Desktop: hero text above a wide 3D preview.
- Tablet: preserve hierarchy and 800px preview height.
- Mobile: 36px headline, trust group wraps gracefully, 320px preview, text and CTA stay visible without horizontal overflow.
