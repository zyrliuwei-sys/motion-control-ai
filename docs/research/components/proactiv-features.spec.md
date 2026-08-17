# ProactivFeatures specification

## Overview

- Target file: `src/components/proactiv/proactiv-features.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: scroll-driven background, hover-driven card illustrations, decorative time-driven motion.

## DOM and exact styles

- Outer section has 80px vertical padding, charcoal background and a large masked conic cyan/blue gradient behind it. The gradient is decoration only and must not obscure text.
- Center badge: 56px square, 3D rotateX(25deg), neutral-800 to neutral-950 frame, 5px internal radius, charcoal interior, cyan bolt. A faint cyan baseline sits below.
- Heading: `Automate your social media`, centered 48px / weight 500 desktop. Description: `Proactiv houses a rich set of features to automate your marketing efforts across all social medias`, centered 16px neutral gray.
- Grid is one column then three columns at 1024px, `gap: 8px; padding-top/bottom: 40px`. The first card spans two columns on desktop. Cards have 12px radius, 32px padding, rgba(40,40,40,.3) surface, rgba(255,255,255,.1) border and subtle light inset shadow.
- Feature copy exactly:
  1. Post to multiple platforms at once. `With our AI-powered platform, you can post to multiple platforms at once, saving you time and effort.`
  2. Analytics for everything. `Check analytics, track your posts, and get insights into your audience.`
  3. Integrated AI. `Proactiv uses AI to help you create engaging content.`
  4. Easy Collaboration. `Proactive can integrate with Zapier, Slack and every other popular integration tools.`
  5. Know your audience. `Based on your audience, create funnels and drive more traffic.`

## Visuals and behaviours

- Social card: rows of small colored social glyph tiles and two cyan moving routing lines.
- Analytics: a simple line chart and a `+200 connections` label that scales in on hover.
- AI: five small colored round marks that rise slightly in sequence plus one slow cyan scanning line.
- Collaboration: three campaign cards arranged on a vertical timeline. Hover brightens the email item and offsets pointer labels.
- Audience: hover vertically switches Manu Arora / 69,420 for Tyler Durden / 8008 with a 200ms transition. Use the local avatar where useful.
- Avoid canvas and expensive particle dependencies. CSS and existing Lucide icons are sufficient. All loops must stop under reduced motion.

## API and responsive behavior

- Receive the five content records as props, no i18n reads inside.
- 1440: asymmetric 2+1+1+1 grid. 768 and 390: one column; no overflow.
