(() => {
  const script = document.currentScript;
  const manifestUrl =
    window.KGEN_OFFICIAL_LINKS_SOURCE ||
    (script && script.dataset.manifest) ||
    'OfficialLinks.json';

  const fallbackLabels = {
    website: 'Website',
    github: 'GitHub',
    whitepaper: 'Whitepaper',
    boot: 'Boot',
    bscscan: 'BscScan',
    pancakeswap: 'PancakeSwap',
    geckoterminal: 'GeckoTerminal',
    coinmarketcap_dexscan: 'CMC DexScan',
    liquidity_lock: 'Liquidity Lock',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    facebook_page: 'Facebook Page',
    facebook_community: 'Facebook Community',
    instagram: 'Instagram',
    line_official: 'LINE',
    x: 'X',
    telegram: 'Telegram',
    community: 'Community',
    official: 'Official',
    markets: 'Markets',
    security: 'Security'
  };

  function labelFor(key, link) {
    return link.label || fallbackLabels[key] || key;
  }

  function metaFor(link) {
    return link.account || link.status || 'Official';
  }

  function isExternal(url) {
    return /^https?:\/\//.test(url);
  }

  function applyAnchor(anchor, key, link) {
    if (!link || !link.url) return;
    anchor.href = link.url;
    if (isExternal(link.url)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener';
    }
    const label = anchor.dataset.officialLinkLabel || labelFor(key, link);
    if (!anchor.textContent.trim() || anchor.dataset.officialLinkReplace === 'true') {
      anchor.textContent = label;
    }
    anchor.dataset.officialLinkStatus = link.status || '';
  }

  function renderGroup(container, manifest) {
    const keys = (container.dataset.officialLinks || '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
    const links = manifest.links || {};
    const cardClass = container.dataset.officialLinksCardClass || 'community-card';
    const anchorClass = container.dataset.officialLinksAnchorClass || '';
    const showStatus = container.dataset.officialLinksShowStatus !== 'false';
    container.innerHTML = '';

    keys.forEach((key) => {
      const link = links[key];
      if (!link || !link.url || link.status === 'NOT_OFFICIAL') return;

      const wrapper = document.createElement('div');
      if (cardClass) wrapper.className = cardClass;

      const anchor = document.createElement('a');
      if (anchorClass) anchor.className = anchorClass;
      anchor.href = link.url;
      if (isExternal(link.url)) {
        anchor.target = '_blank';
        anchor.rel = 'noopener';
      }

      const title = document.createElement('span');
      title.textContent = labelFor(key, link);
      anchor.appendChild(title);

      if (showStatus) {
        const meta = document.createElement('span');
        meta.textContent = metaFor(link);
        anchor.appendChild(meta);
      }

      wrapper.appendChild(anchor);
      container.appendChild(wrapper);
    });
  }

  fetch(manifestUrl, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Official links manifest HTTP ${response.status}`);
      return response.json();
    })
    .then((manifest) => {
      document.querySelectorAll('[data-official-link]').forEach((anchor) => {
        const key = anchor.dataset.officialLink;
        applyAnchor(anchor, key, (manifest.links || {})[key]);
      });

      document.querySelectorAll('[data-official-links]').forEach((container) => {
        renderGroup(container, manifest);
      });
    })
    .catch((error) => {
      document.querySelectorAll('[data-official-links]').forEach((container) => {
        container.innerHTML = `<div class="community-card"><span>Official links unavailable</span><span>${error.message}</span></div>`;
      });
      console.warn('[KGEN] Official links manifest load failed:', error);
    });
})();
