# Proactiv interaction and responsive audit

- Desktop breakpoint: 1024px. Tablet breakpoint: 768px. Mobile breakpoint: 640px.
- Navigation is fixed, enters from `translateY(-80px)` over 0.8s. Once `scrollY > 100`, the desktop bar contracts from 100% to 80%, gains `rgb(23,23,23)` background and a rounded masked panel. The mobile bar gains the same dark background and an inset border. It must respect reduced motion.
- Hero dashboard responds to its containing scroll progress: 3D rotation `20deg -> 0deg`; translation `0px -> 100px`. Hover clears grayscale. The central play control opens a video dialog.
- Tool cards are scroll-driven only. At desktop each is a 3-column text/image pair; first image fades in during the center range. Below 1024px the content is a normal static single column stack.
- Testimonials rotate every 7 seconds until a person button is selected. Avatar uses opacity/rotation; quote uses a 16px horizontal fade. The name button disables auto-rotation.
- Pricing switch moves an inline knob over 300ms and changes the displayed price only. Cards do not navigate; the featured card has a 2-4 second cyan meteor beam.
- FAQ defaults closed; clicking one item closes any other item. Answer transition: height `0 -> auto`, opacity `0 -> 1`, 200ms ease out.
- All animated elements must have a reduced-motion static state.
