# Design guidance

Aim for a calm, clear interface with the consistency and attention to detail of polished mainstream products. Establish an original visual identity; do not reproduce a specific company's branding or proprietary layouts.

## Visual direction

- Build clear hierarchy with readable typography, generous spacing, and concise content.
- Begin with restrained neutral surfaces and one purposeful accent. Check text, controls, and focus indicators for accessible contrast.
- Define shared color, typography, spacing, radius, and motion values when UI implementation starts. Reuse them instead of introducing one-off values everywhere.
- Use consistent patterns for buttons, fields, navigation, and feedback. Make the primary action clear without overcrowding a screen.
- Design for narrow screens and long content first, then use larger screens deliberately. Avoid fixed heights that clip enlarged text.

## Interaction and accessibility

- Use semantic headings, landmarks, links, buttons, and form controls with meaningful accessible names.
- Make every action usable with a keyboard. Keep focus visible and ordered logically; manage focus when opening or closing dialogs.
- Give fields persistent labels and clear instructions. Associate validation errors with the relevant input and preserve entered values after failure.
- Explain loading, empty, error, and success states in plain language. Announce important dynamic updates appropriately to assistive technology.
- Do not rely on color, hover, animation, or icons alone to communicate meaning. Respect reduced-motion preferences.
- Make touch targets comfortable, allow text enlargement and zoom, and avoid horizontal scrolling for ordinary page content.
- Add meaningful alternative text for informative images; keep decorative images silent to assistive technology.
- Confirm destructive actions or provide an appropriate undo path.

## Review before delivery

Check the main flow on narrow and wide screens, with keyboard-only navigation and enlarged text. Inspect contrast, focus visibility, labels, and status messages. Exercise loading, empty, failure, and success states. Check important flows with a screen reader when an interactive application exists. Resolve obvious usability issues before adding decorative polish.

## Neon Hollow direction

Dark navy and botanical teal establish the arena. Mint indicates the runner and primary actions; blue marks experience; amber marks explosive supplies; coral marks incoming damage. Readable silhouettes and distinct motion identify enemies beyond color. Menus use native buttons, visible focus, keyboard shortcuts, and a focus loop. Touch controls remain available at narrow widths and on coarse-pointer devices. Reduced-motion preferences remove screen shake and incidental bobbing while retaining combat information.
