# AI Video Generator Content Map

## Product direction

Build a first-version AI video generator inside the existing Senzia/uncensored-ai product shell. The reference page at `ezremove.ai/ai-video-generator/` is used for the workspace composition and marketing rhythm, but its product sidebar is intentionally not copied.

## Reference → local

| Reference area            | Local implementation                                        | Decision                                                      |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| Video generator workspace | `/ai-video-generator` route + `AiVideoGeneratorWorkspace`   | Recreated as the primary first-screen experience              |
| Reference product sidebar | Existing `SenziaAppShell` navigation                        | Reused the app shell; no reference sidebar clone              |
| Prompt composer           | Textarea, image upload preview, mode/model/output controls  | Kept the reference control density and rounded surface        |
| Template prompts          | Product Sales Video and Talking-Head Sales Video chips      | Rewritten as starter prompts for this product                 |
| Tool/model rail           | Local card data backed by `ai_video.*.records` translations | Uses downloaded reference imagery as temporary visual content |
| Marketing sections        | Features, steps, benefits and FAQ below the fold            | Included for a complete first version, with new copy          |
| Generate action           | Local queued → ready preview state                          | Provider/API/billing integration remains the next milestone   |

## Navigation

`AI Video Generator` is the first item in the shared studio navigation and links to `/ai-video-generator`. The same nav is passed to the text-to-image page, so the new entry is visible above the existing image-generation entry without introducing a second sidebar system.

## Asset policy

The downloaded assets under `public/ezremove-video/` are temporary visual references for the first version. They support the layout and card treatment while the product-specific model outputs, thumbnails, and brand illustrations are developed.
