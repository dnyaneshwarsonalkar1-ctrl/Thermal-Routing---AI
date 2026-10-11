---
name: frontend-dev
description: Vanilla HTML/CSS/JS frontend development standards.
---
# Frontend Development Skill
Derived from `airbnb/javascript` and HTML5 Boilerplate best practices.

1. **Vanilla JS Structure**: Keep functions pure where possible. Group DOM interactions separately from business logic.
2. **File Organization**: Maintain clear boundaries between `app.js` (init/glue), `api.js` (networking), and `model.js` (data).
3. **Event Delegation**: Use event delegation on parent containers instead of attaching listeners to many dynamic children.
4. **CSS**: Prefer utility classes or strict BEM methodology to avoid CSS specificity wars.
