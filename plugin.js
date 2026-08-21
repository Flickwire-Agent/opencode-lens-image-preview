(function () {
  "use strict";

  var IMG_EXTS = "png|jpg|jpeg|gif|webp|svg|bmp|ico|avif";
  var MARKDOWN_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
  var URL_RE = new RegExp(
    "(https?://[^\\s<>\"']+\\.(?:" + IMG_EXTS + ")(?:\\?[^\\s<>\"']*)?)",
    "gi",
  );

  function injectStyles() {
    if (document.getElementById("lens-img-style")) return;
    var style = document.createElement("style");
    style.id = "lens-img-style";
    style.textContent =
      ".lens-img-wrap{display:inline-block;margin:8px 0;max-width:100%;line-height:0}.lens-img-wrap img{display:block;max-width:100%;max-height:60vh;object-fit:contain;cursor:zoom-in;border-radius:8px;transition:max-height .2s ease}.lens-img-wrap img:focus-visible{outline:2px solid currentColor;outline-offset:3px}.lens-img-wrap img.lens-img-expanded{max-height:none;cursor:zoom-out}.lens-img-label{display:block;font-size:12px;line-height:1.4;margin-top:2px;color:color-mix(in srgb,currentColor 58%,transparent);font-family:ui-monospace,monospace}";
    document.head.appendChild(style);
  }

  function isInCodeBlock(node) {
    var el = node.parentElement;
    while (el) {
      if (el.tagName === "CODE" || el.tagName === "PRE") return true;
      el = el.parentElement;
    }
    return false;
  }

  function isPluginContent(node) {
    var el = node.parentElement;
    while (el) {
      if (el.hasAttribute("data-lens-image-preview")) return true;
      el = el.parentElement;
    }
    return false;
  }

  function hasImageRefs(text) {
    MARKDOWN_RE.lastIndex = 0;
    URL_RE.lastIndex = 0;
    return MARKDOWN_RE.test(text) || URL_RE.test(text);
  }

  function isRemoteImageSource(src) {
    try {
      var url = new URL(src);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function buildImageElement(src, alt) {
    var wrap = document.createElement("span");
    wrap.className = "lens-img-wrap";
    wrap.setAttribute("data-lens-image-preview", "");

    var img = document.createElement("img");
    img.src = src;
    img.alt = alt || "";
    img.loading = "lazy";
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.setAttribute("aria-expanded", "false");
    img.setAttribute("aria-label", "Expand image" + (alt ? ": " + alt : ""));

    function toggleImage() {
      var expanded = img.classList.toggle("lens-img-expanded");
      img.setAttribute("aria-expanded", String(expanded));
      img.setAttribute("aria-label", (expanded ? "Collapse" : "Expand") + " image" + (alt ? ": " + alt : ""));
    }

    img.addEventListener("click", toggleImage);
    img.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleImage();
    });

    img.addEventListener("error", function () {
      if (!this.parentNode) return;
      this.style.display = "none";
      var err = document.createElement("span");
      err.className = "lens-img-label";
      err.setAttribute("role", "alert");
      err.textContent = "[Image unavailable: " + src + "]";
      this.parentNode.appendChild(err);
    });

    wrap.appendChild(img);

    if (alt) {
      var label = document.createElement("span");
      label.className = "lens-img-label";
      label.textContent = alt;
      wrap.appendChild(label);
    }

    return wrap;
  }

  function processTextNode(node) {
    if (node._lensProcessed) return;
    node._lensProcessed = true;

    var text = node.textContent;
    if (!text || !hasImageRefs(text)) return;

    var matches = [];
    var m;

    MARKDOWN_RE.lastIndex = 0;
    while ((m = MARKDOWN_RE.exec(text)) !== null) {
      if (!isRemoteImageSource(m[2])) continue;
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        alt: m[1],
        src: m[2],
      });
    }

    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        alt: "",
        src: m[1],
      });
    }

    if (matches.length === 0) return;

    matches.sort(function (a, b) {
      return a.start - b.start;
    });

    var merged = [matches[0]];
    for (var i = 1; i < matches.length; i++) {
      if (matches[i].start >= merged[merged.length - 1].end) {
        merged.push(matches[i]);
      }
    }

    var fragment = document.createDocumentFragment();
    var pos = 0;

    for (var j = 0; j < merged.length; j++) {
      var match = merged[j];
      if (match.start > pos) {
        fragment.appendChild(document.createTextNode(text.slice(pos, match.start)));
      }
      fragment.appendChild(buildImageElement(match.src, match.alt));
      pos = match.end;
    }

    if (pos < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(pos)));
    }

    // A chat re-render may detach queued nodes before the deferred scan runs.
    if (node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  }

  var scanTimer = null;

  function scheduleScan(delay) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanMessages, delay || 300);
  }

  function scanMessages() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (node._lensProcessed) return NodeFilter.FILTER_REJECT;
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (isInCodeBlock(node)) return NodeFilter.FILTER_REJECT;
        if (isPluginContent(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    var toProcess = [];
    while (walker.nextNode()) {
      toProcess.push(walker.currentNode);
    }

    for (var i = 0; i < toProcess.length; i++) {
      processTextNode(toProcess[i]);
    }
  }

  var observer = null;

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(function (mutations) {
      var hasAdditions = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          hasAdditions = true;
        }
        if (mutations[i].type === "characterData") {
          // Streamed assistant responses can extend an existing text node.
          mutations[i].target._lensProcessed = false;
          hasAdditions = true;
        }
      }
      if (hasAdditions) scheduleScan(200);
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  function init() {
    injectStyles();
    startObserver();
    scheduleScan(500);
    setTimeout(function () {
      scheduleScan(0);
    }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
