# Senzia Text-to-Video Hero Behaviors

| Trigger               | Visible effect                               | Implementation                                |
| --------------------- | -------------------------------------------- | --------------------------------------------- |
| Enter a prompt        | Create control becomes available             | Local React prompt state                      |
| Click a sample        | Prompt is inserted and sample is selected    | Local React selected sample state             |
| Click model or format | Label cycles to the next configured option   | Local React option index                      |
| Click Create          | Status changes to the localized queued state | Local React queued state, no external request |
| Click Book a demo     | Routes to the localized `/book-demo` page    | Locale-aware `Link`                           |
