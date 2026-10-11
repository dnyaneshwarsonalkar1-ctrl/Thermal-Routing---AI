---
name: code-review
description: Frontend-specific code review checklist and etiquette.
---
# Code Review Skill
Inspired by standard open-source PR templates.

1. **Security**: Ensure no sensitive API keys are hardcoded in the frontend code.
2. **Performance**: Flag any synchronous blocking loops (e.g., `while(true)`) that would freeze the main thread.
3. **Maintainability**: Ensure code is documented, variables have descriptive names, and magic numbers (like T_ref) are extracted to config files.
4. **Cross-browser Compatibility**: Remind authors to avoid highly experimental CSS/JS features without polyfills.
