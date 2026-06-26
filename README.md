# Image Preview

A [Lens](https://github.com/Flickwire-Agent/opencode-lens) plugin that renders images from URLs inline in OpenCode Web chat.

## Features

- **Markdown image syntax** — `![alt](url)` renders as an inline image
- **Remote URLs** — image URLs ending in `.png`, `.jpg`, `.gif`, `.webp`, etc. are detected automatically
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

Once installed, image URLs in OpenCode Web chat messages are automatically rendered:

| Format | Example |
|---|---|
| Markdown image | `![Logo](https://example.com/logo.png)` |
| Raw URL | `https://example.com/diagram.png` |

Click any rendered image to toggle between constrained and full-size view.

## How it works

The plugin runs as a browser script injected by Lens into the OpenCode Web page. It registers a `MutationObserver` on `document.body` and scans new text nodes for image URL references. Images are loaded directly from their remote URLs.

## License

MIT
