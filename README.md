# Image Preview

A [Lens](https://github.com/Flickwire-Agent/opencode-lens) plugin that renders images inline in OpenCode Web chat.

## Features

- **Markdown image syntax** — `![alt](path)` renders as an inline image
- **Remote URLs** — image URLs ending in `.png`, `.jpg`, `.gif`, `.webp`, etc. are detected automatically
- **Local file paths** — absolute paths (`/path/to/file.png`) and home-relative paths (`~/path/to/file.png`) are served through the Lens proxy
- **Code block protection** — image references inside `<code>`/`<pre>` blocks are ignored
- **Click to expand** — toggle between a 60vh constraint and full natural size
- **Lazy loading** — images load on demand as they scroll into view
- **Error fallback** — broken or missing images show a descriptive text placeholder
- **Dynamic** — uses `MutationObserver` to process messages as they stream in

## Install

### Prerequisites

- [Lens](https://github.com/Flickwire-Agent/opencode-lens) running as a reverse proxy in front of OpenCode Web

### Setup

Clone the plugin:

```bash
git clone https://github.com/Flickwire-Agent/opencode-lens-image-preview.git
```

Add it to your `lens.config.json` (or set the `OPENCODE_WEB_PLUGINS` environment variable):

```json
{
  "plugins": [
    "../opencode-lens-image-preview/lens.plugin.json"
  ]
}
```

Then restart Lens:

```bash
pnpm proxy
```

## Usage

Once installed, any image reference in an OpenCode Web chat message is automatically rendered. The plugin detects three formats:

| Format | Example |
|---|---|
| Markdown image | `![Diagram](~/assets/diagram.png)` |
| Remote URL | `![Logo](https://example.com/logo.png)` |
| Raw local path | `/home/user/screenshots/capture.png` |

Click any rendered image to toggle between constrained and full-size view.

## How it works

The plugin runs as a browser script injected by Lens into the OpenCode Web page. It registers a `MutationObserver` on `document.body` and scans new text nodes for image references. Local files are served through Lens's `/__lens/files/` endpoint, which reads them from disk.

## License

MIT
