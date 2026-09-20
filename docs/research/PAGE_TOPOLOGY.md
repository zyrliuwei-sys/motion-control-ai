# EzRemove AI Video Generator — First-Version Clone Topology

Reference: `https://ezremove.ai/ai-video-generator/`

## Product boundary

The reference route has a product sidebar, a global header, a generator workspace, a model rail, and a long SEO landing page. This implementation intentionally does not copy the reference sidebar. It reuses the existing application shell and adds “AI Video Generator” as the first item in the existing text-to-image workspace sidebar.

## Visual order

1. Existing application header and sidebar chrome.
2. Soft mint/lilac generator canvas.
3. Centered title and description.
4. Large white composer card with optional image upload, prompt, mode, model, output settings, and generate action.
5. History affordance.
6. Two sales-video template chips.
7. Four compact “more tools” cards.
8. Horizontal model rail with selectable model cards.
9. Four alternating feature bands using reference screenshots.
10. Three-step “How it works” section.
11. Six benefit cards and a compact FAQ accordion.

## Layout and layering

- The page is a normal flow document inside the existing app shell; it does not introduce a second product sidebar.
- The generator canvas uses a fixed soft gradient treatment and scrolls with the main content.
- The composer is a centered max-width panel with a 20px radius, translucent white surface, and deep soft shadow.
- Model cards are horizontally scrollable on narrow screens and remain a single row on desktop.
- Marketing sections collapse from alternating two-column bands to a single column below the tablet breakpoint.

## Interaction model

- Composer fields are click/input driven.
- Upload controls are local preview controls; generation state is represented as a first-version UI state until a text/image-to-video provider is wired.
- Mode, model, output settings, and template controls are click-driven and update the selected state.
- Model rail is click-to-select.
- FAQ items are click-to-expand accordions.
- The reference page uses an internal scroll container for its content; this clone uses the existing app content scroll behavior.
