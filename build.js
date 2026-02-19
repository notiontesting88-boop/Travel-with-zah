#!/usr/bin/env node
// ============================================
// BUILD SCRIPT — Travel with Zaheer
// Runs on every Netlify deploy (takes ~1 second)
// Converts _posts/*.md → posts/index.json + posts/[slug].json
// ============================================

const fs   = require('fs');
const path = require('path');

const POSTS_DIR  = path.join(__dirname, '_posts');
const OUTPUT_DIR = path.join(__dirname, 'posts');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Parse front matter from markdown files ──────────────────────────────────
function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta    = {};
  const content = match[2].trim();

  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;

    const key   = line.slice(0, colonIdx).trim();
    let   value = line.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Boolean
    if (value === 'true')  { meta[key] = true;  return; }
    if (value === 'false') { meta[key] = false; return; }

    meta[key] = value;
  });

  // Parse gallery_images list (multi-line yaml list)
  const galleryMatch = match[1].match(/gallery_images:\n((?:\s+-\s+.+\n?)*)/);
  if (galleryMatch) {
    meta.gallery_images = galleryMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s*-\s*/, '').replace(/^['"]|['"]$/g, '').trim())
      .filter(Boolean);
  }

  return { meta, content };
}

// ── Process all markdown files ───────────────────────────────────────────────
let posts = [];

if (!fs.existsSync(POSTS_DIR)) {
  console.log('No _posts directory found — creating empty posts/index.json');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify({ posts: [] }, null, 2));
  process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const raw              = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { meta, content } = parseFrontMatter(raw);

  const slug = meta.slug || file.replace(/\.md$/, '');

  const post = {
    title:          meta.title          || '',
    slug,
    description:    meta.description    || '',
    date:           meta.date           || '',
    region:         meta.region         || '',
    cover:          meta.cover          || '',
    hero_image:     meta.hero_image     || '',
    gallery_images: meta.gallery_images || [],
    content,
    published:      meta.published !== false,
  };

  // Write individual post JSON
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${slug}.json`),
    JSON.stringify(post, null, 2)
  );

  // Add to index (without full content to keep it small)
  posts.push({
    title:       post.title,
    slug:        post.slug,
    description: post.description,
    date:        post.date,
    region:      post.region,
    cover:       post.cover,
    hero_image:  post.hero_image,
    published:   post.published,
  });
});

// Sort by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write index
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'index.json'),
  JSON.stringify({ posts }, null, 2)
);

// ── Copy site_settings.json to /data for frontend JS ────────────────────────
const settingsSrc  = path.join(__dirname, '_data', 'site_settings.json');
const settingsDest = path.join(__dirname, 'data',  'site_settings.json');

if (fs.existsSync(settingsSrc)) {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  }
  fs.copyFileSync(settingsSrc, settingsDest);
  console.log('✓ Copied site_settings.json → /data/');
}

console.log(`✓ Built ${posts.length} posts → posts/index.json + individual JSONs`);
posts.forEach(p => console.log(`  • ${p.slug} (${p.published ? 'published' : 'draft'})`));
