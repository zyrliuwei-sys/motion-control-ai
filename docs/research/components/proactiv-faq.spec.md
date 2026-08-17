# ProactivFaq specification

## Overview

- Target file: `src/components/proactiv/proactiv-faq.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: click-driven accordion.

## Structure and behavior

- `max-width: 768px`, centered, `padding: 80px 32px`; heading `Frequently asked questions`, centered 48px desktop. List has 40px top gap and 10px gaps.
- Every card is 16px padding, #171717/neutral-900 fill, 12px radius, pointer cursor; question is 16px bold. All default closed; only one may be open. Answer is 16px normal neutral-400, 16px top margin.
- Transition answer height 0 -> auto and opacity 0 -> 1 over 200ms ease out. Provide button semantics, aria-expanded and keyboard behavior. The component receives typed FAQ records as props; no i18n reads.
