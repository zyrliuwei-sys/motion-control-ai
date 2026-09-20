# EzRemove AI Video Generator — Behavior Notes

## Reference observations

- Desktop viewport: 1440 × 900. The reference header is 64px tall and the product sidebar is approximately 212px wide.
- The reference content area is an internal `main.layout-content-right` scroller (`overflow: hidden auto`) rather than document-level scrolling.
- The page background is a pale vertical gradient with mint, lavender, and blush radial highlights.
- The composer surface is white with approximately 0.96 opacity, a 20px radius, a 1px translucent border, and a `0 10px 36px rgba(0,0,0,.12)` shadow.
- The composer toolbar is separated from the prompt surface by a thin divider and uses pill-like controls.
- The model rail is horizontally scrollable and exposes more cards beyond the viewport.
- On mobile the header collapses to a menu button, the sidebar becomes an overlay navigation, the composer controls wrap/stack, and the model rail remains horizontally scrollable.

## States

- Mode control: Text/Image to Video is selected by default; alternate modes are exposed through a menu.
- Model control: Seedance 2.0 is selected by default.
- Output control: 16:9 / 5s / 480p is selected by default.
- Generate button displays the current credit cost.
- Sales templates expose a selected/preview affordance and a NEW badge.
- Model cards expose a selected border state; only one model is active.
- FAQ rows expand/collapse on click.

## Clone decisions

- Keep the visual density and control hierarchy of the reference generator.
- Omit the reference product sidebar and all reference-site navigation links.
- Use the existing app sidebar and keep the new generator entry above the existing text-to-image tools.
- Keep first-version generation local and explicit: controls, upload preview, model selection, templates, and queued state work immediately; provider submission is a follow-up integration because the existing motion-control endpoint requires a different input contract.
