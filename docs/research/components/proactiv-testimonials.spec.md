# ProactivTestimonials specification

## Overview

- Target file: `src/components/proactiv/proactiv-testimonials.tsx`
- Screenshot: `docs/design-references/proactiv-source-desktop.png`
- Interaction model: time-driven + click-driven.

## Structure and styles

- Dark relative section, its header has the cyan 56px badge, centered 48px heading `Used by entreprenurs`, and centered 16px description `Proactiv is used by serial entrepreneurs and overachievers.`
- Main presentation has 240px vertical padding. Behind it is a low-opacity, masked four-column testimonial wall. Each 242px card has 32px padding, 12px radius, rgba(40,40,40,.3) fill, 10% white border and light inset shadow.
- Foreground carousel is centered, `max-width: 768px`, `height: 320px`, with a 480px masked radial disc above the quote, 56px circular avatar, 20px bold quote and people controls.

## States

- Default carousel records are Manu Arora / Tech Innovator & Entrepreneur / `What a fantastic AI Proactiv AI is, I just love it. It has completely transformed the way I approach problems and develop solutions.` / `https://i.pravatar.cc/150?img=1`; Tyler Durden / Creative Director & Business Owner / `I made a soap with the help of AI, it was so easy to use. I'm so glad this happened because it revolutionized my entire business model and production process.` / img 2; Alice Johnson / Senior Software Engineer / `This AI has transformed the way I work! It's like having a brilliant assistant who knows exactly what I need before I even ask.` / img 3.
- Auto rotate every 7 seconds. Clicking a person pill selects it and stops auto rotate. Avatar transition opacity with rotate 60deg, 700ms cubic-bezier(.68,-.3,.32,1); quote transition x 16px opacity, enter 500ms delay 200, exit 300ms delay 300.
- Pills are 12px, 8px/4px padding, 6px external margin, rounded full with conic border. Active pill has cyan 50% border; other pills 70% opacity. At <640 hide designations and put each name on its own line.
- The background grid can repeat provided testimonial text/photos and must stay clearly secondary to the foreground slider. Reduced motion makes direct content swaps and disables auto advance.
