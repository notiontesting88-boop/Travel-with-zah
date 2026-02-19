/* ============================================
   TRAVEL WITH ZAHEER — Main JS
   ============================================ */

'use strict';

// ============================================
// NAVIGATION
// ============================================

(function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (!nav) return;

  // Scroll behavior
  const onScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }
})();

// ============================================
// SCROLL REVEAL
// ============================================

(function initScrollReveal() {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
})();

// ============================================
// LAZY LOADING IMAGES
// ============================================

(function initLazyLoad() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });

  images.forEach(img => observer.observe(img));
})();

// ============================================
// LIGHTBOX
// ============================================

(function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const galleryItems = document.querySelectorAll('.gallery-item img');

  const open = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  galleryItems.forEach(img => {
    img.parentElement.addEventListener('click', () => {
      open(img.src, img.alt);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();

// ============================================
// BLOG FILTERS
// ============================================

(function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const posts = document.querySelectorAll('.post-card[data-region]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const region = btn.dataset.filter;

      posts.forEach(post => {
        if (region === 'all' || post.dataset.region === region) {
          post.style.display = '';
          setTimeout(() => post.classList.add('visible'), 50);
        } else {
          post.style.display = 'none';
        }
      });
    });
  });
})();

// ============================================
// MARKDOWN RENDERER (for post detail)
// ============================================

(function initMarkdown() {
  const contentEl = document.getElementById('post-content');
  if (!contentEl) return;

  // Very lightweight markdown parser
  function parseMarkdown(md) {
    if (!md) return '';
    return md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold/italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Blockquote
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr>')
      // Unordered list
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n+/g, '\n\n')
      .split('\n\n')
      .map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<blockquote') || block.startsWith('<hr') || block.startsWith('<img')) {
          return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');
  }

  // Get content from data attribute or script tag
  const rawContent = contentEl.dataset.content || '';
  if (rawContent) {
    contentEl.innerHTML = parseMarkdown(rawContent);
  }
})();

// ============================================
// POST PAGE LOADER (from URL params / JSON files)
// ============================================

(function initPostLoader() {
  // This handles loading post data for post.html
  // In a Netlify + Decap CMS setup, each post gets its own HTML via build
  // This JS handles the dynamic loading pattern for dev/preview

  const postContainer = document.getElementById('post-container');
  if (!postContainer) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    window.location.href = '/blog.html';
    return;
  }

  // Load post data from JSON
  fetch(`/posts/${slug}.json`)
    .then(res => {
      if (!res.ok) throw new Error('Post not found');
      return res.json();
    })
    .then(post => {
      renderPost(post);
    })
    .catch(() => {
      postContainer.innerHTML = '<div class="no-posts">Post not found. <a href="/blog.html">Return to blog</a></div>';
    });

  function renderPost(post) {
    // Update page meta
    document.title = `${post.title} — Travel with Zaheer`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = post.description || '';

    // Hero
    const heroBg = document.querySelector('.post-hero-bg');
    if (heroBg && post.hero_image) {
      heroBg.style.backgroundImage = `url('${post.hero_image}')`;
    } else if (heroBg && post.cover) {
      heroBg.style.backgroundImage = `url('${post.cover}')`;
    }

    // Title and meta
    const titleEl = document.querySelector('.post-hero-title');
    if (titleEl) titleEl.textContent = post.title;

    const regionEl = document.querySelector('.post-region');
    if (regionEl) regionEl.textContent = post.region || '';

    const dateEl = document.querySelector('.post-date');
    if (dateEl) dateEl.textContent = formatDate(post.date);

    // Content
    const contentEl = document.getElementById('post-content');
    if (contentEl && post.content) {
      contentEl.dataset.content = post.content;
      // Trigger markdown render
      const evt = new Event('DOMContentLoaded');
      // Re-run markdown parser inline
      contentEl.innerHTML = renderMarkdown(post.content);
    }

    // Gallery
    if (post.gallery_images && post.gallery_images.length) {
      const gallerySection = document.querySelector('.post-gallery');
      const galleryGrid = document.querySelector('.gallery-grid');
      if (galleryGrid) {
        gallerySection.style.display = '';
        post.gallery_images.forEach(imgSrc => {
          const item = document.createElement('div');
          item.className = 'gallery-item';
          const img = document.createElement('img');
          img.src = imgSrc;
          img.alt = post.title;
          img.loading = 'lazy';
          item.appendChild(img);
          galleryGrid.appendChild(item);
        });
        // Re-init lightbox
        initLightboxForNew();
      }
    }
  }

  function initLightboxForNew() {
    const lightbox = document.querySelector('.lightbox');
    if (!lightbox) return;
    const lightboxImg = lightbox.querySelector('img');
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  }
})();

// ============================================
// BLOG LISTING LOADER
// ============================================

(function initBlogLoader() {
  const blogGrid = document.getElementById('blog-grid');
  if (!blogGrid) return;

  fetch('/posts/index.json')
    .then(res => {
      if (!res.ok) throw new Error('No posts index');
      return res.json();
    })
    .then(data => {
      const posts = (data.posts || []).filter(p => p.published !== false);
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (!posts.length) {
        blogGrid.innerHTML = '<div class="no-posts">No posts yet. Check back soon!</div>';
        return;
      }

      // Populate filter buttons
      const regions = [...new Set(posts.map(p => p.region).filter(Boolean))];
      const filtersEl = document.getElementById('blog-filters');
      if (filtersEl && regions.length) {
        regions.forEach(region => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = region;
          btn.textContent = region;
          filtersEl.appendChild(btn);
        });
      }

      posts.forEach((post, i) => {
        const card = createPostCard(post);
        card.style.animationDelay = `${i * 80}ms`;
        blogGrid.appendChild(card);
      });

      // Re-init scroll reveal
      document.querySelectorAll('.fade-up').forEach(el => {
        new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
          });
        }, { threshold: 0.1 }).observe(el);
      });
    })
    .catch(() => {
      // Static fallback - posts are embedded in HTML
    });
})();

// ============================================
// HOME FEATURED POSTS LOADER
// ============================================

(function initFeaturedLoader() {
  const featuredGrid = document.getElementById('featured-grid');
  if (!featuredGrid) return;

  fetch('/posts/index.json')
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
      const posts = (data.posts || [])
        .filter(p => p.published !== false)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      if (!posts.length) return;

      featuredGrid.innerHTML = '';
      posts.forEach((post, i) => {
        const card = createPostCard(post);
        card.classList.add('fade-up');
        featuredGrid.appendChild(card);
      });

      // Re-init scroll reveal for new elements
      document.querySelectorAll('.fade-up').forEach(el => {
        new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
          });
        }, { threshold: 0.1 }).observe(el);
      });
    })
    .catch(() => {});
})();

// ============================================
// SITE SETTINGS LOADER
// ============================================

(function initSiteSettings() {
  fetch('/data/site_settings.json')
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(settings => {
      // Homepage hero
      const homeHero = document.querySelector('.hero .hero-bg');
      if (homeHero && settings.homepage_hero) {
        homeHero.style.backgroundImage = `url('${settings.homepage_hero}')`;
      }

      // Blog hero
      const blogHero = document.querySelector('.page-hero .page-hero-bg');
      if (blogHero && settings.blog_hero) {
        blogHero.style.backgroundImage = `url('${settings.blog_hero}')`;
      }

      // About text
      const aboutTextEl = document.querySelector('.about-strip-text');
      if (aboutTextEl && settings.about_text) {
        aboutTextEl.textContent = settings.about_text;
      }

      // Featured title
      const featuredTitleEl = document.querySelector('.featured-custom-title');
      if (featuredTitleEl && settings.featured_title) {
        featuredTitleEl.textContent = settings.featured_title;
      }
    })
    .catch(() => {});
})();

// ============================================
// HELPERS
// ============================================

function createPostCard(post) {
  const article = document.createElement('article');
  article.className = 'post-card fade-up';
  article.dataset.region = post.region || '';

  const href = `/blog/${post.slug || post.title?.toLowerCase().replace(/\s+/g, '-')}.html`;

  article.innerHTML = `
    <a href="${href}" class="post-card-link">
      <div class="post-card-image">
        <img
          data-src="${post.cover || ''}"
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          alt="${escapeHtml(post.title)}"
          loading="lazy"
        />
        ${post.region ? `<span class="post-card-region">${escapeHtml(post.region)}</span>` : ''}
      </div>
      <div class="post-card-body">
        <div class="post-card-date">${formatDate(post.date)}</div>
        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
        <p class="post-card-desc">${escapeHtml(post.description || '')}</p>
        <span class="post-card-arrow">Read more →</span>
      </div>
    </a>
  `;

  // Make whole card clickable
  article.querySelector('.post-card-link').style.display = 'block';
  article.querySelector('.post-card-link').style.color = 'inherit';

  // Lazy load the image
  const img = article.querySelector('img[data-src]');
  if (img) {
    new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' }).observe(img);
  }

  return article;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|img|p)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}
