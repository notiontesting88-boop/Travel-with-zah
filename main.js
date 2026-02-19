'use strict';

// ─── Helpers ────────────────────────────────────────────────────────────────

function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); }
  catch { return d; }
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
      b = b.trim();
      if (!b) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|img|li)/.test(b)) return b.startsWith('<li>') ? `<ul>${b}</ul>` : b;
      return `<p>${b.replace(/\n/g,'<br>')}</p>`;
    }).join('\n');
}

function makeCard(post) {
  const href = `/post.html?slug=${encodeURIComponent(post.slug)}`;
  const img  = post.cover || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80';
  return `
    <article class="post-card fade-up" data-region="${esc(post.region)}">
      <a href="${href}" style="display:block;color:inherit;">
        <div class="post-card-image">
          <img src="${esc(img)}" alt="${esc(post.title)}" loading="lazy">
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
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up:not(.visible)').forEach(el => obs.observe(el));
}

// ─── Navigation ──────────────────────────────────────────────────────────────

(function() {
  const nav    = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
})();

// ─── Load site settings (hero images, about text) ───────────────────────────

(function() {
  fetch('/data/site_settings.json')
    .then(r => r.ok ? r.json() : null)
    .then(s => {
      if (!s) return;
      const homeBg = document.getElementById('hero-bg');
      if (homeBg && s.homepage_hero) homeBg.style.backgroundImage = `url('${s.homepage_hero}')`;

      const blogBg = document.getElementById('blog-hero-bg');
      if (blogBg && s.blog_hero) blogBg.style.backgroundImage = `url('${s.blog_hero}')`;

      const aboutEl = document.getElementById('about-text');
      if (aboutEl && s.about_text) aboutEl.textContent = s.about_text;

      const titleEl = document.querySelector('.featured-custom-title');
      if (titleEl && s.featured_title) titleEl.innerHTML = s.featured_title;
    })
    .catch(() => {});
})();

// ─── Homepage: featured posts ────────────────────────────────────────────────

(function() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  fetch('/posts/index.json?v=' + Date.now())
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      const posts = (data.posts || [])
        .filter(p => p.published !== false)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      if (!posts.length) {
        grid.innerHTML = '<p class="no-posts" style="grid-column:1/-1;">No posts yet — check back soon!</p>';
        return;
      }
      grid.innerHTML = posts.map(makeCard).join('');
      revealFadeUps();
    })
    .catch(() => {
      grid.innerHTML = '<p class="no-posts" style="grid-column:1/-1;">Could not load posts.</p>';
    });
})();

// ─── Blog page: all posts + filters ─────────────────────────────────────────

(function() {
  const grid    = document.getElementById('blog-grid');
  const filters = document.getElementById('blog-filters');
  if (!grid) return;

  fetch('/posts/index.json?v=' + Date.now())
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      const posts = (data.posts || [])
        .filter(p => p.published !== false)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (!posts.length) {
        grid.innerHTML = '<p class="no-posts">No posts yet — check back soon!</p>';
        return;
      }

      // Build region filter buttons
      if (filters) {
        const regions = [...new Set(posts.map(p => p.region).filter(Boolean))];
        regions.forEach(r => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = r;
          btn.textContent = r;
          filters.appendChild(btn);
        });

        filters.addEventListener('click', e => {
          const btn = e.target.closest('.filter-btn');
          if (!btn) return;
          filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const region = btn.dataset.filter;
          grid.querySelectorAll('.post-card').forEach(card => {
            card.style.display = (region === 'all' || card.dataset.region === region) ? '' : 'none';
          });
        });
      }

      grid.innerHTML = posts.map(makeCard).join('');
      revealFadeUps();
    })
    .catch(() => {
      grid.innerHTML = '<p class="no-posts">Could not load posts.</p>';
    });
})();

// ─── Post detail page ────────────────────────────────────────────────────────

(function() {
  const body = document.getElementById('post-container');
  if (!body) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { window.location.href = '/blog.html'; return; }

  fetch(`/posts/${encodeURIComponent(slug)}.json?v=` + Date.now())
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(post => {
      // Page title + meta
      document.title = `${post.title} — Travel with Zaheer`;

      // Hero
      const heroBg = document.querySelector('.post-hero-bg');
      if (heroBg) heroBg.style.backgroundImage = `url('${post.hero_image || post.cover}')`;

      // Meta
      const regionEl = document.querySelector('.post-region');
      const dateEl   = document.querySelector('.post-date');
      const titleEl  = document.querySelector('.post-hero-title');
      const descEl   = document.querySelector('.post-lead');
      if (regionEl) regionEl.textContent = post.region || '';
      if (dateEl)   dateEl.textContent   = fmtDate(post.date);
      if (titleEl)  titleEl.textContent  = post.title;
      if (descEl)   descEl.textContent   = post.description;

      // Content
      const contentEl = document.getElementById('post-content');
      if (contentEl) contentEl.innerHTML = renderMarkdown(post.content);

      // Gallery
      const gallerySection = document.querySelector('.post-gallery');
      const galleryGrid    = document.querySelector('.gallery-grid');
      if (galleryGrid && post.gallery_images && post.gallery_images.length) {
        gallerySection.style.display = '';
        galleryGrid.innerHTML = post.gallery_images.map(src =>
          `<div class="gallery-item"><img src="${esc(src)}" alt="${esc(post.title)}" loading="lazy"></div>`
        ).join('');
        initLightbox();
      } else if (gallerySection) {
        gallerySection.style.display = 'none';
      }
    })
    .catch(() => {
      body.innerHTML = '<div style="padding:120px 48px;text-align:center;font-family:sans-serif"><h2>Post not found</h2><p><a href="/blog.html">← Back to blog</a></p></div>';
    });
})();

// ─── Lightbox ────────────────────────────────────────────────────────────────

function initLightbox() {
  const lb    = document.querySelector('.lightbox');
  const lbImg = lb && lb.querySelector('img');
  const close = lb && lb.querySelector('.lightbox-close');
  if (!lb) return;

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;
      lbImg.src = img.src;
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLb = () => { lb.classList.remove('active'); document.body.style.overflow = ''; };
  if (close) close.addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
}

// Scroll reveal for static elements
document.addEventListener('DOMContentLoaded', revealFadeUps);

// Share button helper (used in post.html)
window.sharePost = function(platform) {
  const url   = window.location.href;
  const title = document.querySelector('.post-hero-title')?.textContent || 'Travel with Zaheer';
  if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  } else if (platform === 'copy') {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('[onclick="sharePost(\'copy\')"]');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy Link', 2000); }
    });
  }
};
