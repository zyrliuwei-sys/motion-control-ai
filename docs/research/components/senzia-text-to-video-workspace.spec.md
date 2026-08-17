# SenziaTextToVideoWorkspace Specification

## Overview

- **Target file:** `src/components/proactiv/proactiv-hero.tsx` (rendered only by the standalone `/text-to-video` route)
- **Reference:** `https://www.senzia.cc/text-to-video`
- **Interaction model:** click-driven editor workspace

## DOM Structure

- `SenziaAppShell` supplies the header and sidebar; this component owns only the flexible main workspace.
- The workspace has a page title, a prompt composer, a prompt-assist action, two parameter controls, a generation allowance row, and a sample gallery.
- Each sample is a real button: selecting it moves its prompt into the composer. The primary action becomes available after the prompt has content and changes the visible status when invoked.

## Computed Style Reference

The reference page presents a charcoal application shell rather than a marketing hero: a near-black page, a darker `~256px` sidebar at desktop, one-pixel neutral borders, small 12–14px interface text, and restrained 6–10px corner radii. The primary action is a light neutral button, not a glowing accent treatment. The live remote page's DOM was successfully extracted, but its browser renderer timed out while returning the computed-style snapshot; the values below are the implementation's measured design targets pending a stable source rendering session.

### Workspace

- display: `flex`
- background: `#0d1014`
- minimum height: `calc(100dvh - 64px)`
- desktop content width: `min(100% - 64px, 1040px)`
- desktop outer padding: `44px 40px 80px`

### Composer

- background: `#151a20`
- border: `1px solid #303844`
- border-radius: `10px`
- minimum height: `176px`
- prompt text: `14px / 22px`

### Controls and samples

- control height: `38px`
- control border radius: `7px`
- muted text: `#8d98a7`
- active/primary fill: `#edf1f5`
- active/primary text: `#101419`
- gallery: three columns on desktop, two on tablet, one on mobile

## States & Behaviors

### Prompt generation

- **Trigger:** entering text in the composer or clicking a sample card.
- **State A:** the Create button is disabled and styled with low-contrast neutral fill.
- **State B:** the button is enabled once the trimmed prompt has content.
- **Action:** clicking Create does not call an external service; it changes the local queued-status copy, making the prototype's behavior explicit and safe.

### Prompt assistance

- **Trigger:** click `Generate With AI`.
- **State A:** empty prompt or manually supplied prompt.
- **State B:** the first safe sample prompt is inserted when the composer is empty, otherwise the current prompt is retained.
- **Transition:** no visual transition; it is a direct editor action.

### Sample card

- **Trigger:** click or keyboard activation.
- **State A:** neutral bordered thumbnail card.
- **State B:** selected card has a light outline and its prompt is loaded into the composer.
- **Transition:** `150ms ease` for border and background.

### Parameter buttons

- **Trigger:** click.
- **State:** each click cycles through supplied options and exposes the selected value in the button label.

## Assets

- `/public/proactiv/first.png`
- `/public/proactiv/second-backup.png`
- `/public/proactiv/third.png`
- `/public/proactiv/fourth-backup.png`

These are local Motion Control AI visuals rather than copied third-party sample media; the visual structure is cloned while the product imagery remains correctly branded.

## Responsive Behavior

- **Desktop (1440px):** left rail visible; composer and gallery occupy the main workspace in two columns.
- **Tablet (768px):** rail collapses into a horizontal, scrollable tool row; main workspace remains full width.
- **Mobile (390px):** one-column workspace; controls wrap; samples are one per row; no horizontal overflow.
