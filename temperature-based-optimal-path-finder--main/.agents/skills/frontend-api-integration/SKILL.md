---
name: frontend-api-integration
description: Best practices for consuming REST APIs and handling network resilience.
---
# Frontend API Integration Skill
Based on modern async/await and Fetch API standard patterns.

1. **AbortControllers**: Always attach an AbortSignal to fetch requests to prevent hanging UI states if the network drops.
2. **Graceful Degradation**: Implement fallback JSON datasets or local-math fallback logic for 100% offline resilience.
3. **Error Boundaries**: Catch all network exceptions and display a user-friendly error state or fallback toast.
4. **Debouncing**: Debounce high-frequency events (like sliders) before dispatching API calls.
