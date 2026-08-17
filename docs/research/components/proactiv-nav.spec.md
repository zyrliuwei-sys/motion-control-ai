# ProactivNav specification

## Overview

- Target file: `src/components/proactiv/proactiv-nav.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: scroll-driven + click-driven.

## DOM and exact styles

- Root is `position: fixed; top: 16px; inset-inline: 0; z-index: 50`, width 95% and `max-width: 1280px`; at 1024px it becomes width 100%.
- Inner desktop bar is flex, justify-between, `padding: 12px 16px`, 6px radius. It starts transparent. At scrollY > 100 it is 80% width with `rgb(23,23,23)` background and a subtle neutral inset border.
- Brand is a 24px white circular visual with a black Proactiv-style P mark followed by bold 14px white `Proactiv`.
- Desktop nav links are 14px white, `padding: 8px 16px`, 6px radius. Hover is `rgb(38,38,38)` with `color: rgba(255,255,255,.8)` over 200ms. Links: Features, Pricing, Blog, Contact.
- Actions: transparent Register link, then cyan `rgb(57,195,239)` button with black 14px text, 6px radius and 16px horizontal / 8px vertical padding. Hover moves it `translateY(-2px)`, active scales .98.
- Desktop exists only from 1024px. At lower widths show a compact 24px menu icon. Its click opens a full viewport `rgb(8,9,10)` panel with close icon, four 26px white links and Book a demo / Register controls.

## Behaviour

- Initial entrance: y -80px to 0 over 800ms with cubic-bezier(.6,.05,.1,.9).
- Scroll trigger must use Motion `useScroll`, not a window event.
- Mobile menu is click-driven, closes from the close control or a navigation click.
- Reduce motion: no entrance/scroll interpolation.

## Responsive behavior

- Desktop 1440: centered horizontal navigation at 16px from top.
- Tablet and mobile: only brand plus hamburger in compact bar; open menu fills viewport.

## APIs

- Receive brand and link data as props. Use the repo's locale-aware `Link` for internal URLs. Do not read i18n in the component.
