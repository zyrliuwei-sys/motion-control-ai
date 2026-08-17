# ProactivPricing specification

## Overview

- Target file: `src/components/proactiv/proactiv-pricing.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: click-driven toggle + time-driven logo travel.

## Structure and styles

- Header repeats cyan 56px badge, 48px `Simple pricing`, and description `Simple pricing for startups, small businesses, medium scale businesses and enterprises.`
- A Monthly / Yearly switch has 14px neutral labels and a 40×20 pill. It starts monthly, neutral-900 fill with neutral-500 border. White thumb move/stretch 300ms after 100ms delay. Only text prices change.
- Plans are a max-width 1280px grid: one column, two at 768px, four at 1024px; 40px gap then 16px at desktop; 80px vertical padding. Each card has 24px horizontal / 16px vertical padding, 8px radius. Featured Pro card has neutral-900 radial fill and an animated thin cyan meteor line.
- Plans and exact features follow source data. Price values: Hobby 0/0, Starter 20/100, Pro 30/150, Enterprise Custom. Use cyan button on Pro, neutral-800 buttons otherwise. Feature lines: 16px check then 14px neutral copy.
- Marquee below: `Trusted by big industries`, 160px height, repeated Netflix, Google, Meta and OnlyFans assets, 100px image slots grayscale with color hover and dark masked edges. One 28s linear right-to-left CSS animation. It must stop under reduced motion.
