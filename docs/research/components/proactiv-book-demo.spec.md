# ProactivBookDemo Specification

## Overview

- **Target file:** `src/components/proactiv/proactiv-book-demo.tsx`
- **Reference:** Senzia Text to Video tool surface, scoped to a dedicated Motion Control AI booking route.
- **Interaction model:** Static navigation with hover and keyboard-focus feedback.

## DOM Structure

- Full-viewport charcoal route shell with a compact back link.
- Two-column desktop layout: booking rationale and outcomes on the left, a real Motion Control AI dashboard image on the right.
- The image is an actual existing product asset, not a div-based mockup.
- Two locale-aware links return home or begin account creation.

## Visual Direction

- Preserve the existing Motion Control AI charcoal and cyan brand system rather than introducing a second accent color.
- Use the app's existing tight sans display treatment, 6px control radius, hairline charcoal borders, and restrained shadows.
- At desktop the split begins at the `lg` breakpoint; below it the image follows the content in one column.

## States & Behaviors

- **Links:** translate upward slightly on hover; focus uses the shared cyan focus outline.
- **Reduced motion:** transitions remain functional but do not use continuous animation.
- **Responsive:** desktop is a 2-column composition; tablet and mobile collapse to a single column with 16px side padding.

## Assets

- Product image: `public/proactiv/dashboard.png`.

## Content Contract

- All visible strings are received as props from the `book-demo` block.
- The component does not read i18n messages directly.
