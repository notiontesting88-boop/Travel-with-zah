'use strict';

// ─── CONFIG — Update these two values for your repo ──────────────────────────
// Replace with your actual GitHub username and repo name
const GITHUB_USER = 'notiontesting88-boop';
const GITHUB_REPO = 'Travel-with-zah';
// Raw base URL — content is read directly from GitHub (no Netlify deploy needed)
const RAW = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); }
  catch(e) { return d; }
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta:{}, content: raw };
  const meta = {};
  const content = match[2].trim();
  // Parse gallery_images list first
  const galleryMatch = match[1].match(/gallery_images:\n((?:\s+-\s+.+\n?)*)/);
  if (galleryMatch) {
    meta.gallery_images = galleryMatch[1]
      .split('\n').map(l=>l.replace(/^\s*-\s*/,'').replace(/^['"]|['"]$/g,'').trim()).filter(Boolean);
  }
  match[1].split('\n').forEach(line => {
    const ci = line.indexOf(':');
    if (ci === -1) return;
    const key = line.slice(0,ci).trim();
    if (key === 'gallery_images') return; // already handled
    let val = line.slice(ci+1).trim();
    if ((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'"))) val=val.slice(1,-1);
    if (val==='true') { meta[key]=true; return; }
    if (val==='false') { meta[key]=false; return; }
    meta[key]=val;
  });
  return { meta, content };
}

function renderMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^---$/gm,'<hr>')
    .replace(/^\- (.+)$/gm,'<li>$1</li>')
    .split('\n\n')
    .map(b => {
      b = b.trim(); if (!b) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|img|li)/.test(b)) return b.startsWith('<li>') ? `<ul>${b}</ul>` : b;
      return `<p>${b.replace(/\n/g,'<br>')}</p>`;
    }).join('\n');
}

function makeCard(post) {
  const href = `/post.html?slug=${encodeURIComponent(post.slug)}`;
  const img  = post.cover || '';
  return `
    <article class="post-card fade-up" data-region="${esc(post.region)}">
      <a href="${href}" style="display:block;color:inherit;">
        <div class="post-card-image">
          ${img ? `<img src="${esc(img)}" alt="${esc(post.title)}" loading="lazy">` : '<div style="background:#222;width:100%;height:100%"></div>'}
          ${post.region ? `<span class="post-card-region">${esc(post.region)}</span>` : ''}
        </div>
        <div class="post-card-body">
          <div class="post-card-date">${fmtDate(post.date)}</div>
          <h3 class="post-card-title">${esc(post.title)}</h3>
          <p class="post-card-desc">${esc(post.description)}</p>
          <span class="post-card-arrow">Read more →</span>
        </div>
      </a>
    </article>`;
}

function revealFadeUps() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);} });
  }, { threshold:0.08, rootMargin:'0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up:not(.visible)').forEach(el=>obs.observe(el));
}

// ─── Fetch posts/index.json from GitHub raw (no Netlify redeploy needed) ─────
// Falls back to local /posts/index.json if GitHub fetch fails

async function fetchPosts() {
  // Try GitHub raw first (always up to date, free)
  try {
    const r = await fetch(`${RAW}/posts/index.json?t=${Date.now()}`);
    if (r.ok) { const d = await r.json(); return d.posts || []; }
  } catch(e) {}
  // Fallback to local
  try {
    const r = await fetch(`/posts/index.json?t=${Date.now()}`);
    if (r.ok) { const d = await r.json(); return d.posts || []; }
  } catch(e) {}
  return [];
}

async function fetchPostDetail(slug) {
  // Try GitHub raw first
  try {
    const r = await fetch(`${RAW}/_posts/${encodeURIComponent(slug)}.md?t=${Date.now()}`);
    if (r.ok) {
      const text = await r.text();
      const { meta, content } = parseFrontMatter(text);
      return { ...meta, slug: meta.slug || slug, content, gallery_images: meta.gallery_images || [] };
    }
  } catch(e) {}
  // Fallback to local JSON
  try {
    const r = await fetch(`/posts/${encodeURIComponent(slug)}.json?t=${Date.now()}`);
    if (r.ok) return r.json();
  } catch(e) {}
  return null;
}

async function fetchSettings() {
  try {
    const r = await fetch(`${RAW}/_data/site_settings.json?t=${Date.now()}`);
    if (r.ok) return r.json();
  } catch(e) {}
  try {
    const r = await fetch(`/data/site_settings.json?t=${Date.now()}`);
    if (r.ok) return r.json();
  } catch(e) {}
  return {};
}

// ─── Navigation ──────────────────────────────────────────────────────────────

(function() {
  const nav    = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (!nav.classList.contains('light')) {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }
  }, { passive:true });
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
    }));
  }
})();

// ─── Site settings (hero images, about text) ─────────────────────────────────

(async function() {
  const s = await fetchSettings();
  const homeBg = document.getElementById('hero-bg');
  if (homeBg && s.homepage_hero) homeBg.style.backgroundImage = `url('${s.homepage_hero}')`;
  const blogBg = document.getElementById('blog-hero-bg');
  if (blogBg && s.blog_hero) blogBg.style.backgroundImage = `url('${s.blog_hero}')`;
  const aboutEl = document.getElementById('about-text');
  if (aboutEl && s.about_text) aboutEl.textContent = s.about_text;
  const titleEl = document.querySelector('.featured-custom-title');
  if (titleEl && s.featured_title) titleEl.innerHTML = s.featured_title;
})();

// ─── Homepage: featured posts ─────────────────────────────────────────────────

(async function() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const all = await fetchPosts();
  const posts = all.filter(p=>p.published!==false).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
  if (!posts.length) {
    grid.innerHTML = '<p class="no-posts" style="grid-column:1/-1">No posts yet — check back soon!</p>';
    return;
  }
  grid.innerHTML = posts.map(makeCard).join('');
  revealFadeUps();
})();

// ─── Blog page: all posts + filters ──────────────────────────────────────────

(async function() {
  const grid    = document.getElementById('blog-grid');
  const filters = document.getElementById('blog-filters');
  if (!grid) return;
  const all   = await fetchPosts();
  const posts = all.filter(p=>p.published!==false).sort((a,b)=>new Date(b.date)-new Date(a.date));
  if (!posts.length) {
    grid.innerHTML = '<p class="no-posts">No posts yet — check back soon!</p>';
    return;
  }
  // Region filters
  if (filters) {
    const regions = [...new Set(posts.map(p=>p.region).filter(Boolean))];
    regions.forEach(r => {
      const btn = document.createElement('button');
      btn.className='filter-btn'; btn.dataset.filter=r; btn.textContent=r;
      filters.appendChild(btn);
    });
    filters.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filters.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const region = btn.dataset.filter;
      grid.querySelectorAll('.post-card').forEach(c => {
        c.style.display = (region==='all'||c.dataset.region===region) ? '' : 'none';
      });
    });
  }
  grid.innerHTML = posts.map(makeCard).join('');
  revealFadeUps();
})();

// ─── Post detail page ─────────────────────────────────────────────────────────

(async function() {
  if (!document.getElementById('post-container')) return;
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { window.location.href='/blog.html'; return; }
  const post = await fetchPostDetail(slug);
  if (!post) {
    document.getElementById('post-container').innerHTML =
      '<div style="padding:120px 48px;text-align:center"><h2>Post not found</h2><p><a href="/blog.html">← Back to blog</a></p></div>';
    return;
  }
  document.title = `${post.title} — Travel with Zaheer`;
  const heroBg = document.querySelector('.post-hero-bg');
  if (heroBg) heroBg.style.backgroundImage = `url('${post.hero_image||post.cover}')`;
  const regionEl = document.querySelector('.post-region');
  const dateEl   = document.querySelector('.post-date');
  const titleEl  = document.querySelector('.post-hero-title');
  const descEl   = document.querySelector('.post-lead');
  if (regionEl) regionEl.textContent = post.region||'';
  if (dateEl)   dateEl.textContent   = fmtDate(post.date);
  if (titleEl)  titleEl.textContent  = post.title;
  if (descEl)   descEl.textContent   = post.description||'';
  const contentEl = document.getElementById('post-content');
  if (contentEl) contentEl.innerHTML = renderMarkdown(post.content);
  // Gallery
  const gallerySection = document.querySelector('.post-gallery');
  const galleryGrid    = document.querySelector('.gallery-grid');
  if (galleryGrid && post.gallery_images && post.gallery_images.length) {
    if (gallerySection) gallerySection.style.display='';
    galleryGrid.innerHTML = post.gallery_images.map(src=>
      `<div class="gallery-item"><img src="${esc(src)}" alt="${esc(post.title)}" loading="lazy"></div>`
    ).join('');
    initLightbox();
  } else if (gallerySection) {
    gallerySection.style.display='none';
  }
})();

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function initLightbox() {
  const lb    = document.querySelector('.lightbox');
  const lbImg = lb&&lb.querySelector('img');
  const close = lb&&lb.querySelector('.lightbox-close');
  if (!lb) return;
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;
      lbImg.src=img.src; lb.classList.add('active'); document.body.style.overflow='hidden';
    });
  });
  const closeLb = () => { lb.classList.remove('active'); document.body.style.overflow=''; };
  if (close) close.addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if(e.target===lb) closeLb(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeLb(); });
}

document.addEventListener('DOMContentLoaded', revealFadeUps);

window.sharePost = function(platform) {
  const url   = window.location.href;
  const title = document.querySelector('.post-hero-title')?.textContent||'Travel with Zaheer';
  if (platform==='twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,'_blank');
  else if (platform==='copy') {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('[onclick*="copy"]');
      if (btn) { btn.textContent='Copied!'; setTimeout(()=>btn.textContent='Copy Link',2000); }
    });
  }
};
