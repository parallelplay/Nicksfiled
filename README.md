# Nickfield AI — Cinema Studio

A 100% pixel-perfect clone of Higgsfield Cinema Studio, powered by **ByteDance Dreamina-Seedance-2.5**.

## Key Architecture & Features

### 1. Elements Consistency System (@tagging)
- **Character, Prop, and Location Library:** Upload multi-angle reference photos for any character (e.g. `@char_kabir04`) or prop (e.g. `@prop_seeit-glasses`).
- **Smart Mention Popup:** Typing `@` inside the prompt automatically triggers the autocomplete popup, binds the reference assets, and displays pinned thumbnail chips on top of the prompt generator.
- **Multi-Reference Conditioning:** Maps directly to BytePlus Seedance 2.5's native 50-input multimodal reference engine.

### 2. Cinema Studio UI & Project Structure
- **Left Sidebar:** Project Switcher, Project Brief, Settings, Elements Manager, Folders (`All Assets`, `Getting Started`), and AI Filmmaker Tools (`Canvas`, `Chat`, `AI Director`).
- **Floating Generation Prompt Box:** Pinned reference badges, rich textarea with `@` mention triggers, `Seedance 2.5` model selector, `References` dropdown, `9:16` / `16:9` aspect ratio toggle, `1080p` resolution, `30s` duration toggle, and the signature yellow `GENERATE` button.
- **Timeline & Asset Gallery:** Live project asset grid with high-resolution video playback modal, duration chips, and prompt inspector.

## How to Run Locally

1. Start development server:
```bash
npm run dev
```

2. Open browser:
```
http://localhost:3000
```
