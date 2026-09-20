# AiVideoGeneratorWorkspace Specification

## Overview

- **Target file:** `src/components/ai-video-generator-workspace.tsx`
- **Reference:** `docs/design-references/ezremove-ai-video-generator-desktop.png`
- **Mobile reference:** `docs/design-references/ezremove-ai-video-generator-mobile.png`
- **Interaction model:** click-driven controls with local input/upload state; horizontal model rail; click-driven FAQ accordions.

## Reference computed styles

### Canvas

- desktop content area: `1228px` wide after the reference sidebar
- minimum page height: `840px`
- background: `linear-gradient(rgb(248, 250, 252) 0%, rgb(240, 249, 248) 40%, rgb(250, 248, 252) 70%, rgb(248, 250, 252) 100%)` with mint/lilac/blush radial highlights
- base text color: `rgb(51, 51, 51)`
- font family: `"Trebuchet MS", Poppins, helvetica, "PingFang SC", Arial`

### Composer

- width: `1052px` at the observed desktop content width
- surface height: `240px`
- position: `relative`
- background: `rgba(255, 255, 255, 0.96)`
- border: `1px solid rgba(255, 255, 255, 0.6)`
- border radius: `20px`
- box shadow: `rgba(0, 0, 0, 0.12) 0px 10px 36px 0px`
- toolbar: `display:flex`, `padding: 12px 24px 16px`, `gap: 12px`, `height: 66px`

### Model rail

- title and cards in a vertical flex group with `gap: 16px`
- card row: `display:flex`, `gap:16px`, `overflow:auto`, `padding: 1px 1px 12px`
- cards preserve a wide visual preview and expose model name plus concise description

## Content

- H1: `Free AI Video Generator Online`
- Supporting text: `Turn your ideas into engaging videos from text, images, or visual references. Create online for free and bring product concepts, social posts, ads, and creative stories to life with less effort.`
- Prompt placeholder: `Describe the motion, camera, lighting, and style you want to generate.`
- Default mode: `Text/Image to Video`
- Default model: `Seedance 2.0`
- Default output: `16:9 / 5s / 480p`
- Default generate cost: `50 credits`

## Responsive behavior

- **Desktop (1440px):** centered max-width composer, four compact tool cards in one row, model cards in a horizontal rail.
- **Tablet (768px):** composer remains centered with reduced side padding; quick tools use two columns; feature bands reduce gaps.
- **Mobile (390px):** title/description are centered, composer controls wrap, tool cards use a horizontal rail, model cards remain horizontally scrollable, feature sections stack.
