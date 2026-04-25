/* ===== MDLive Editor Core ===== */
const MDLive = {};
(function() {
  'use strict';

  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const STORAGE_KEY = 'mdlive-docs';
  const SETTINGS_KEY = 'mdlive-settings';

  // ===== Init =====
  function init() {
    loadSettings();
    loadDocument();
    initMarked();
    initMermaid();
    initToolbar();
    initPaneResizer();
    initLangDropdown();
    initModals();
    initEmojiPicker();
    initKeyboardShortcuts();
    initFileUpload();
    initExport();
    renderPreview();
    updateWordCount();
    setLang(currentLang);
  }

  // ===== Settings =====
  function loadSettings() {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (s.theme) document.documentElement.dataset.theme = s.theme;
    if (s.lang) currentLang = s.lang;
    if (s.docName) document.getElementById('docName').textContent = s.docName;
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      theme: document.documentElement.dataset.theme,
      lang: currentLang,
      docName: document.getElementById('docName').textContent
    }));
  }

  // ===== Document Persistence =====
  function loadDocument() {
    const name = document.getElementById('docName').textContent;
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    editor.value = docs[name] || getDefaultContent();
  }

  function saveDocument() {
    const name = document.getElementById('docName').textContent;
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    docs[name] = editor.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    updateWordCount();
  }

  function getDefaultContent() {
    return `# Welcome to MDLive ✨

A **live** markdown editor with *real-time* preview.

## Features

- **Bold**, *italic*, ~~strikethrough~~, and <u>underline</u>
- Headings, blockquotes, and code blocks
- Emoji picker 😎
- Mermaid diagrams
- Image & video embeds
- Multi-language support
- Dark & light themes

> "The best way to predict the future is to invent it." — Alan Kay

### Code Block

\`\`\`javascript
function hello() {
  console.log("Hello, MDLive!");
}
\`\`\`

### Mermaid Diagram

\`\`\`mermaid
graph LR
    A[Editor] --> B[Parser]
    B --> C[Preview]
    C --> A
\`\`\`

### Table

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Emoji | ✅ |
| Themes | ✅ |

---

Start editing to see the magic! 🚀
`;
  }

  // ===== Marked Configuration =====
  function initMarked() {
    marked.use({
      breaks: true,
      gfm: true
    });
  }

  // ===== Mermaid =====
  let mermaidReady = false;
  function initMermaid() {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose'
      });
      mermaidReady = true;
    }
  }

  // ===== Render Preview =====
  let renderTimer;
  function renderPreview() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(_renderPreview, 150);
  }

  async function _renderPreview() {
    const raw = editor.value;
    // Extract mermaid blocks before marked processes them
    const mermaidBlocks = [];
    const processed = raw.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
      const idx = mermaidBlocks.length;
      mermaidBlocks.push(code.trim());
      return `<div class="mermaid-placeholder" data-idx="${idx}"></div>`;
    });

    // Process video embeds: ![video](url)
    const withVideos = processed.replace(/!\[video\]\(([^)]+)\)/gi, (match, url) => {
      const embedUrl = parseVideoUrl(url);
      if (embedUrl) {
        return `<div class="video-embed"><iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe></div>`;
      }
      return `<div class="video-embed" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted)">Video: ${url}</div>`;
    });

    let html = marked.parse(withVideos);

    // Post-process: add link badges
    html = html.replace(/<a href="([^"]+)">([^<]*)<\/a>/g, (match, url, text) => {
      const badge = createLinkBadge(url);
      return `<a href="${url}" target="_blank" rel="noopener">${text}${badge}</a>`;
    });

    preview.innerHTML = html;

    // Render mermaid diagrams
    if (mermaidReady && mermaidBlocks.length > 0) {
      for (const ph of preview.querySelectorAll('.mermaid-placeholder')) {
        const idx = parseInt(ph.dataset.idx);
        const code = mermaidBlocks[idx];
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}-${idx}`, code);
          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid-wrapper';
          wrapper.innerHTML = svg;
          ph.replaceWith(wrapper);
        } catch (e) {
          ph.innerHTML = `<pre style="color:var(--danger)">Mermaid error: ${e.message}</pre>`;
        }
      }
    }

    // Handle broken images -> placeholder
    preview.querySelectorAll('img').forEach(img => {
      if (!img.src || img.src === window.location.href) {
        const ph = document.createElement('div');
        ph.className = 'image-placeholder';
        ph.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>${img.alt || 'Image placeholder'}</span>`;
        img.replaceWith(ph);
      }
    });

    saveDocument();
  }

  function parseVideoUrl(url) {
    // YouTube
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    // Vimeo
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    return null;
  }

  function createLinkBadge(url) {
    let host = '';
    try { host = new URL(url).hostname.replace('www.', ''); } catch { host = url; }
    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    return ` <span class="link-badge">${icon} ${host}</span>`;
  }

  // ===== Toolbar Actions =====
  function initToolbar() {
    document.getElementById('toolbar').addEventListener('click', (e) => {
      const btn = e.target.closest('.tool-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'heading') {
        toggleHeadingMenu(btn);
      } else {
        executeAction(action);
      }
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  }

  function toggleHeadingMenu(btn) {
    const menu = document.getElementById('headingMenu');
    if (menu.classList.contains('open')) {
      menu.classList.remove('open');
      return;
    }
    const rect = btn.getBoundingClientRect();
    menu.style.top = rect.bottom + 4 + 'px';
    menu.style.left = rect.left + 'px';
    menu.classList.add('open');

    const close = (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove('open');
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);

    menu.querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        insertHeading(parseInt(b.dataset.level));
        menu.classList.remove('open');
      };
    });
  }

  function insertHeading(level) {
    const line = getLine();
    const prefix = '#'.repeat(level) + ' ';
    if (line.text.startsWith('#')) {
      replaceLine(line.index, prefix + line.text.replace(/^#+\s*/, ''));
    } else {
      replaceLine(line.index, prefix + line.text);
    }
  }

  function executeAction(action) {
    const actions = {
      bold: () => wrapSelection('**', '**'),
      italic: () => wrapSelection('*', '*'),
      underline: () => wrapSelection('<u>', '</u>'),
      strike: () => wrapSelection('~~', '~~'),
      code: () => wrapSelection('`', '`'),
      quote: () => prefixLines('> '),
      codeblock: () => wrapSelection('\n```\n', '\n```\n'),
      link: () => openModal('linkModal'),
      image: () => openModal('imageModal'),
      video: () => openModal('videoModal'),
      mermaid: () => wrapSelection('\n```mermaid\n', '\n```\n'),
      ul: () => prefixLines('- '),
      ol: () => prefixLines('1. '),
      hr: () => insertAtCursor('\n\n---\n\n'),
      table: () => insertAtCursor('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n'),
      emoji: () => toggleEmojiPicker(),
      upload: () => document.getElementById('fileUploadInput').click()
    };
    if (actions[action]) actions[action]();
  }

  // ===== Text Manipulation =====
  function wrapSelection(before, after) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end) || 'text';
    const replacement = before + selected + after;
    editor.setRangeText(replacement, start, end, 'select');
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + selected.length;
    editor.focus();
    renderPreview();
  }

  function insertAtCursor(text) {
    const start = editor.selectionStart;
    editor.setRangeText(text, start, editor.selectionEnd, 'end');
    editor.focus();
    renderPreview();
  }

  function prefixLines(prefix) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', end);
    const endIdx = lineEnd === -1 ? val.length : lineEnd;
    const block = val.substring(lineStart, endIdx);
    const prefixed = block.split('\n').map(l => prefix + l).join('\n');
    editor.setRangeText(prefixed, lineStart, endIdx, 'end');
    editor.focus();
    renderPreview();
  }

  function getLine() {
    const start = editor.selectionStart;
    const val = editor.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', start);
    const endIdx = lineEnd === -1 ? val.length : lineEnd;
    return { index: lineStart, end: endIdx, text: val.substring(lineStart, endIdx) };
  }

  function replaceLine(lineIndex, newText) {
    const line = getLine();
    editor.setRangeText(newText, line.index, line.end, 'end');
    editor.focus();
    renderPreview();
  }

  // ===== Emoji Picker =====
  function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (picker.classList.contains('open')) {
      picker.classList.remove('open');
      return;
    }
    const btn = document.querySelector('[data-action="emoji"]');
    const rect = btn.getBoundingClientRect();
    picker.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    picker.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px';
    picker.classList.add('open');

    const close = (e) => {
      if (!picker.contains(e.target) && !e.target.closest('[data-action="emoji"]')) {
        picker.classList.remove('open');
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }

  // ===== Modals =====
  function initModals() {
    // Link modal
    document.getElementById('linkInsert').addEventListener('click', () => {
      const text = document.getElementById('linkText').value;
      const url = document.getElementById('linkUrl').value;
      if (url) insertAtCursor(`[${text || url}](${url})`);
      closeModal('linkModal');
    });

    // Image modal
    document.getElementById('imageInsert').addEventListener('click', () => {
      const alt = document.getElementById('imageAlt').value;
      const url = document.getElementById('imageUrl').value;
      if (url) insertAtCursor(`![${alt || 'image'}](${url})`);
      closeModal('imageModal');
    });

    document.getElementById('imageFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const alt = document.getElementById('imageAlt').value || file.name;
        document.getElementById('imageUrl').value = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Video modal
    document.getElementById('videoInsert').addEventListener('click', () => {
      const url = document.getElementById('videoUrl').value;
      if (url) insertAtCursor(`![video](${url})`);
      closeModal('videoModal');
    });

    // Cancel buttons
    ['linkCancel', 'imageCancel', 'videoCancel'].forEach(id => {
      document.getElementById(id).addEventListener('click', () => closeModal(id.replace('Cancel', 'Modal')));
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // Enter key in modals
    document.querySelectorAll('.modal input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const modal = input.closest('.modal-overlay');
          modal.querySelector('.btn-primary').click();
        }
      });
    });
  }

  function openModal(id) {
    document.getElementById(id).classList.add('open');
    const firstInput = document.getElementById(id).querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.getElementById(id).querySelectorAll('input').forEach(i => i.value = '');
    editor.focus();
  }

  // ===== Pane Resizer =====
  function initPaneResizer() {
    const resizer = document.getElementById('paneResizer');
    const container = document.querySelector('.editor-container');
    let startX, startLeftWidth;

    resizer.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startLeftWidth = document.querySelector('.editor-pane').getBoundingClientRect().width;
      resizer.classList.add('active');

      const onMove = (e) => {
        const diff = e.clientX - startX;
        const total = container.offsetWidth - resizer.offsetWidth;
        const leftW = Math.max(200, Math.min(startLeftWidth + diff, total - 200));
        document.querySelector('.editor-pane').style.flex = 'none';
        document.querySelector('.editor-pane').style.width = leftW + 'px';
      };

      const onUp = () => {
        resizer.classList.remove('active');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ===== Language Dropdown =====
  function initLangDropdown() {
    const btn = document.getElementById('langBtn');
    const menu = document.getElementById('langMenu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    menu.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        menu.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const lang = b.dataset.lang;
        document.getElementById('langLabel').textContent = lang.toUpperCase();
        setLang(lang);
        menu.classList.remove('open');
        saveSettings();
      });
    });

    document.addEventListener('click', () => menu.classList.remove('open'));
  }

  // ===== Theme Toggle =====
  function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    // Update mermaid theme
    if (mermaidReady) {
      mermaid.initialize({
        startOnLoad: false,
        theme: next === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose'
      });
    }
    saveSettings();
    renderPreview();
  }

  // ===== Keyboard Shortcuts =====
  function initKeyboardShortcuts() {
    editor.addEventListener('keydown', (e) => {
      // Tab support
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Outdent
          const start = editor.selectionStart;
          const val = editor.value;
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          if (val.substring(lineStart, lineStart + 2) === '  ') {
            editor.setRangeText('', lineStart, lineStart + 2, 'end');
          }
        } else {
          insertAtCursor('  ');
        }
        renderPreview();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); executeAction('bold'); break;
          case 'i': e.preventDefault(); executeAction('italic'); break;
          case 'k': e.preventDefault(); executeAction('link'); break;
          case 's': e.preventDefault(); saveDocument(); break;
        }
      }
    });
  }

  // ===== File Upload =====
  function initFileUpload() {
    const input = document.getElementById('fileUploadInput');
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        editor.value = ev.target.result;
        document.getElementById('docName').textContent = file.name;
        saveSettings();
        renderPreview();
      };
      reader.readAsText(file);
      input.value = '';
    });

    // Drag & drop on editor
    editor.addEventListener('dragover', (e) => { e.preventDefault(); editor.style.outline = '2px solid var(--accent)'; });
    editor.addEventListener('dragleave', () => { editor.style.outline = ''; });
    editor.addEventListener('drop', (e) => {
      e.preventDefault();
      editor.style.outline = '';
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.markdown'))) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          editor.value = ev.target.result;
          document.getElementById('docName').textContent = file.name;
          saveSettings();
          renderPreview();
        };
        reader.readAsText(file);
      } else if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          insertAtCursor(`![${file.name}](${ev.target.result})`);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ===== Export =====
  function initExport() {
    document.getElementById('exportBtn').addEventListener('click', () => {
      const name = document.getElementById('docName').textContent;
      const blob = new Blob([editor.value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ===== Editor Input =====
  editor.addEventListener('input', renderPreview);

  // ===== Sync scroll =====
  editor.addEventListener('scroll', () => {
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  });

  // ===== Doc name change =====
  document.getElementById('docName').addEventListener('blur', () => {
    saveSettings();
    saveDocument();
  });
  document.getElementById('docName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('docName').blur(); }
  });

  // Expose to other modules
  MDLive.insertAtCursor = insertAtCursor;
  MDLive.renderPreview = renderPreview;

  // ===== Start =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
