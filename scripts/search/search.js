(() => {
  if (window.__kunpoSearchInstalled) return;
  window.__kunpoSearchInstalled = true;
  const version = new URL(document.currentScript.src).searchParams.get('v') || '';
  let enginePromise, dialog, input, status, results, closeButton, previousFocus;
  let timer, requestId = 0, composing = false;

  function engine() {
    if (!enginePromise) {
      enginePromise = import(`/pagefind/pagefind.js?v=${encodeURIComponent(version)}`)
        .then(async module => {
          await module.options({ excerptLength: 28, metaCacheTag: version });
          return module;
        }).catch(error => { enginePromise = undefined; throw error; });
    }
    return enginePromise;
  }

  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.id = 'kunpo-docs-search';
    dialog.setAttribute('aria-labelledby', 'kunpo-search-title');
    dialog.innerHTML = `
      <div class="ks-top"><div><span class="ks-brand">KUNPO API</span><h2 id="kunpo-search-title">搜索文档</h2></div><button type="button" class="ks-close" aria-label="关闭搜索">Esc</button></div>
      <div class="ks-input-wrap"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="搜索文档" placeholder="搜索模型、参数或使用方法…" autocomplete="off" spellcheck="false"></div>
      <div class="ks-status" role="status" aria-live="polite"></div><div class="ks-results"></div>
      <footer class="ks-footer"><span>↑ ↓ 选择结果 · Enter 打开 · Esc 关闭</span><span>文档全文搜索</span></footer>`;
    document.body.append(dialog);
    input = dialog.querySelector('input');
    status = dialog.querySelector('.ks-status');
    results = dialog.querySelector('.ks-results');
    closeButton = dialog.querySelector('.ks-close');
    closeButton.addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }
    });
    input.addEventListener('compositionstart', () => { composing = true; clearTimeout(timer); requestId++; });
    input.addEventListener('compositionend', () => { composing = false; schedule(); });
    input.addEventListener('input', () => { if (!composing) schedule(); });
    results.addEventListener('click', event => {
      const example = event.target.closest('[data-query]');
      if (example) { input.value = example.dataset.query; input.focus(); schedule(); }
    });
  }

  function emptyState() {
    status.textContent = '输入关键词，查找模型说明、请求参数和代码示例';
    results.replaceChildren();
    const examples = document.createElement('div');
    examples.className = 'ks-examples';
    for (const query of ['透明背景', 'Image-GPT2', 'API Key', '图生图']) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.query = query; button.textContent = query;
      examples.append(button);
    }
    results.append(examples);
  }

  function open() {
    if (!dialog) createDialog();
    if (dialog.open) { input.focus(); return; }
    previousFocus = document.activeElement;
    dialog.showModal();
    input.focus();
    if (input.value.trim()) schedule(); else emptyState();
  }

  function close() {
    clearTimeout(timer); requestId++;
    dialog.close();
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function schedule() {
    clearTimeout(timer);
    const id = ++requestId;
    const query = input.value.trim();
    results.replaceChildren();
    if (!query) { emptyState(); return; }
    status.textContent = '正在搜索…';
    timer = setTimeout(() => search(query, id), 160);
  }

  // Pagefind excerpts contain escaped text and <mark>. Render only text/marks.
  function excerpt(target, html) {
    const template = document.createElement('template');
    template.innerHTML = html || '';
    function append(node, parent) {
      if (node.nodeType === Node.TEXT_NODE) parent.append(document.createTextNode(node.textContent));
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const destination = node.tagName === 'MARK' ? document.createElement('mark') : parent;
        if (destination !== parent) parent.append(destination);
        for (const child of node.childNodes) append(child, destination);
      }
    }
    for (const node of template.content.childNodes) append(node, target);
  }

  async function search(query, id) {
    try {
      const [pagefind, matching] = await Promise.all([
        engine(), import(`/kunpo-search/matching.js?v=${encodeURIComponent(version)}`),
      ]);
      const terms = matching.queryTerms(query);
      const found = terms.length ? await pagefind.search(terms.join(' ')) : { results: [] };
      // Pagefind can return partial matches after CJK tokenization. Check the
      // full fragment (not just its excerpt) before displaying a result.
      const candidates = await Promise.all(found.results.map(result => result.data()));
      const pages = candidates.filter(page => matching.matchesQuery(page.content, terms));
      if (id !== requestId || !dialog.open) return;
      results.replaceChildren();
      status.textContent = pages.length ? `找到 ${pages.length} 篇相关文档` : '没有找到相关文档，试试更短的关键词或完整模型 ID';
      for (const page of pages) {
        const section = matching.matchingSection(page, terms);
        const match = section || page;
        const url = new URL(match.url, location.origin);
        if (url.origin !== location.origin) continue;
        const link = document.createElement('a');
        link.className = 'ks-result'; link.href = url.pathname + url.search + url.hash;
        const category = document.createElement('span'); category.className = 'ks-category'; category.textContent = page.meta.category || '文档';
        const title = document.createElement('strong'); title.textContent = page.meta.title;
        const heading = document.createElement('span'); heading.className = 'ks-section'; heading.textContent = section && section.title !== page.meta.title ? section.title : '';
        const description = document.createElement('p'); excerpt(description, match.excerpt || page.excerpt);
        link.append(category, title, heading, description); results.append(link);
      }
    } catch {
      if (id !== requestId || !dialog.open) return;
      results.replaceChildren();
      status.textContent = '搜索暂时不可用，请稍后重试';
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'ks-retry'; retry.textContent = '重新搜索';
      retry.addEventListener('click', schedule); results.append(retry);
    }
  }

  // Capture before Mintlify/React opens its login-only search dialog.
  window.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('#search-bar-entry, button[aria-label="Open search"]')) {
      event.preventDefault(); event.stopImmediatePropagation(); open();
    }
  }, true);

  window.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); event.stopImmediatePropagation(); open(); return;
    }
    if (!dialog?.open) return;
    event.stopPropagation();
    if (event.isComposing || composing) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    const links = [...results.querySelectorAll('a')];
    const current = links.indexOf(document.activeElement);
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && links.length) {
      event.preventDefault();
      const next = event.key === 'ArrowDown' ? (current + 1) % links.length : (current < 0 ? links.length - 1 : (current - 1 + links.length) % links.length);
      links[next].focus(); links[next].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && document.activeElement === input && links.length) {
      event.preventDefault(); links[0].click();
    }
  }, true);
})();
