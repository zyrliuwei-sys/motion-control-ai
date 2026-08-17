# ProactivFooter specification

## Overview

- Target file: `src/components/proactiv/proactiv-footer.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: static + link hover.

## Structure and styles

- Footer is `border-top: 1px solid #171717`, charcoal, 32px horizontal padding, 80px top / 128px bottom. A max-width 1280px inner row is column then `sm:flex-row` and justify-between.
- Left: Proactiv mark and name, then exactly `Copyright © 2024 Proactiv INC` and `All rights reserved.` in muted 12px/14px type.
- Right: grid of three columns and 40px gaps. Product: Pricing, Blog, Contact. Legal: Privacy Policy, Terms of Service, Refund Policy. Social: Twitter, LinkedIn, GitHub. Links 12px then 14px from 640px, muted to white in 200ms.
- Required deviation: include `<BuiltWithShipAny />` in the lower left block beside the copyright attribution. Use the existing component.
- Receive link data as props; use locale-aware Link for internal routes and normal anchors for external URLs. No i18n in the component.
