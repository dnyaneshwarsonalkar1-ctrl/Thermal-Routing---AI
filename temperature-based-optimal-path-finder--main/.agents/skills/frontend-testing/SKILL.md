---
name: frontend-testing
description: Methodologies for testing Vanilla JS UI components.
---
# Frontend Testing Skill
Derived from `testing-library/dom` principles.

1. **Test Behavior, Not Implementation**: Verify that the correct DOM nodes appear when a user clicks a button, rather than testing internal state variables.
2. **Mocking External APIs**: Use mocking (or interceptors) to prevent tests from hitting live endpoints like OSRM or Open-Meteo.
3. **Unit Tests**: Test pure business logic (like Q10 thermal decay) aggressively with isolated inputs/outputs.
4. **Visual Regression**: Look out for z-index stacking context issues with map libraries (Leaflet).
