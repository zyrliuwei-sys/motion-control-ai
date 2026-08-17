# SenziaAppShell Specification

## Overview

- **Target file:** `src/components/senzia-app-shell.tsx`
- **Reference:** `https://www.senzia.cc/text-to-video`
- **Interaction model:** static application chrome; click-driven navigation and links

## DOM Structure

```text
application shell
├── banner
│   ├── Senzia logo link
│   └── language switch + Login controls
└── workspace row
    ├── complementary sidebar
    │   ├── Recently used group
    │   ├── Explore group
    │   ├── Creation tools group
    │   └── Home / Blog / PRO Upgrade links
    └── main (supplied as children)
```

## Extracted Source Content

- Banner: `Senzia Logo`, `Switch language English`, `Login`
- Navigation: `Recently used`, `Explore`, `Text to Video`, `Image to Video`, `AI Image Generator`, `AI Video Extender`, `AI Photo Editor`, `Home`, `Blog`, `PRO Upgrade`

## Computed Style Reference

The source DOM was visible in Chrome but its remote renderer repeatedly timed out before returning `getComputedStyle`. These values therefore record the clone foundation used for the reimplementation rather than claiming unverified source values.

- application background: `#0d1014`
- header: `64px` high, bottom border `1px solid #252b34`
- sidebar: `256px` wide, background `#12161c`, right border `1px solid #252b34`
- active nav item: `#222a34` background, `8px` radius
- labels: 12–14px neutral gray; compact uppercase group heading

## States & Behaviors

- **Current tool:** Text to Video has `aria-current="page"` and the active fill.
- **Hover:** inactive navigation and header actions shift to `#1d242c` over `150ms ease`.
- **Mobile:** sidebar is replaced by a horizontal, scrollable tool strip below the app bar. No horizontal page overflow.

## Responsive Behavior

- **Desktop (1440px):** application chrome fills the viewport; sidebar stays visible.
- **Tablet (768px):** width is reduced but sidebar remains usable.
- **Mobile (390px):** vertical sidebar hidden; tool strip appears below top bar.
