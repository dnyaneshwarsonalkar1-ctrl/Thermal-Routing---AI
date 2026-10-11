# Thermal Route: Design Inspiration & Visual Direction

## Core Concept
"Snap Map for Agricultural Cold-Chains." 
The goal is to move away from dry, spreadsheet-like logistics dashboards and build a high-utility, tactical, and visually engaging "Command Center" interface. 

## Visual References & Inspiration
- **Snap Map / Zenly**: High-clarity, floating 3D status pill markers, animated vehicle tokens, fluid camera movements. 
  - *What to adapt*: The fun, intuitive tracking feel, marker elevation, and dark map contrast.
  - *What NOT to copy*: Cartoonish avatars. We need to maintain enterprise seriousness.
- **Uber Freight / Flexport**: Clean, data-dense bottom-sheet cards.
  - *What to adapt*: Crisp typography, stark contrast for key metrics, prominent "AI Recommended" badging.

## Color Tokens (CSS Variables)
- **Background**: `--bg-color: #0b0f19` (Deep tactical slate)
- **Panel Backdrop**: `--panel-bg: rgba(30, 41, 59, 0.7)` (Frosted glass effect using backdrop-filter)
- **Text Primary**: `--text-main: #f8fafc`
- **Text Muted**: `--text-muted: #94a3b8`
- **Risk Colors**:
  - *Green (Low Risk)*: `--accent-green: #10b981` (Quality > 80%)
  - *Amber (Moderate Risk)*: `--accent-amber: #f59e0b` (Quality > 60%)
  - *Red (Critical Risk)*: `--accent-red: #ef4444` (Quality < 60%)

## Typography
- **Primary Font**: `Inter`, sans-serif. Highly legible at small sizes for data-heavy overlays.
