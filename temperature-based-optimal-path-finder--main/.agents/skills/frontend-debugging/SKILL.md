---
name: frontend-debugging
description: Advanced debugging techniques using browser developer tools.
---
# Frontend Debugging Skill
Inspired by Chrome DevTools best practices.

1. **DOM Breakpoints**: Use "Break on subtree modifications" to catch rogue scripts altering the UI.
2. **Performance Profiling**: Record a timeline to find frame-drops during heavy Leaflet animations.
3. **Memory Leaks**: Take heap snapshots before and after map destruction to ensure layers and event listeners are garbage collected.
4. **Network Throttling**: Always test the app under "Slow 3G" presets to verify loading states and timeout fallbacks.
