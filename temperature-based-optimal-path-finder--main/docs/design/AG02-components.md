# DOM Component Specs

*Keep components compatible with Vanilla JS (no heavy frameworks like React/Vue). Use CSS classes for state.*

## 1. ProduceSelector & Config
- Glassmorphic floating pane top-left with `backdrop-filter: blur(12px)`.
- Standard `<select>` and inputs styled with dark tactical borders.

## 2. RouteComparisonCard
- Docked bottom-center.
- Shows `rankedRoutes[0]` (Recommended) vs `rankedRoutes[1]` (Alternate).
- Contains the `explanation` string returned by the API.

## 3. ThermalRiskBadge
- Small pill `<span class="badge badge-[riskLevel]">`.
- Translates `Green`, `Amber`, `Red` into localized CSS backgrounds.

## 4. HeatwaveSlider
- `<input type="range" min="0" max="8" step="1">`.
- Custom Webkit slider thumb colored Amber to look like a heat dial.

## 5. DispatchHUD
- Hidden by default. Appears on clicking "Start Dispatch Journey".
- Floating above the map, tracking the truck's array index to decrement Quality % in real-time as it traverses the route.
