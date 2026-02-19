# Travel with Zaheer — Setup Guide

## 🚀 Complete Deployment Instructions

---

## Step 1: Upload to GitHub

1. Go to **github.com** → click **"New"** to create a new repository
2. Name it: `travel-with-zaheer` (or anything you like)
3. Set it to **Public** (required for free Netlify + Decap CMS)
4. Click **Create repository**
5. Upload all project files (drag & drop, or use GitHub Desktop)
6. Click **Commit changes**

---

## Step 2: Connect to Netlify

1. Go to **netlify.com** → Sign up / Log in (free)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Select your repository: `travel-with-zaheer`
5. Leave build settings as-is (netlify.toml handles it)
6. Click **"Deploy site"**

Your site will be live in under 30 seconds! ✅

---

## Step 3: Enable Netlify Identity

1. In Netlify, go to your site → **Site Settings**
2. Click **"Identity"** in the left sidebar
3. Click **"Enable Identity"**
4. Under **Registration**, select: **"Invite only"**
   *(This prevents strangers from signing up)*

---

## Step 4: Enable Git Gateway

1. Still in **Site Settings → Identity**
2. Scroll down to **"Services"**
3. Click **"Enable Git Gateway"**

This connects your admin panel to GitHub so changes are saved automatically.

---

## Step 5: Invite Yourself as Admin

1. In Netlify → **Identity** tab (top menu)
2. Click **"Invite users"**
3. Enter your email address
4. Check your email and click the invite link
5. Set your password

---

## Step 6: Access the Admin Panel

1. Go to: `https://your-site-name.netlify.app/admin`
2. Log in with your email + password
3. You'll see the admin panel! ✅

---

## 📝 How to Use the Admin Panel

### Adding a Blog Post:
1. Click **"✍️ Blog Posts"** in the left sidebar
2. Click **"New Blog Post"**
3. Fill in:
   - **Title**: Your post headline
   - **URL Slug**: Short URL (e.g. `paris-hidden-gems`)
   - **Short Description**: 1–2 sentences for the listing page
   - **Publish Date**: When you wrote this
   - **Region**: Select from the dropdown
   - **Cover Photo**: Upload your thumbnail image
   - **Hero Photo**: Upload the big banner image
   - **Gallery Photos**: Add extra photos (optional)
   - **Post Content**: Write your full article
   - **Published**: Toggle ON to make it live
4. Click **"Publish"** (top right)
5. Your site updates automatically! 🎉

### Editing Site-Wide Settings:
1. Click **"⚙️ Site Settings"** in the sidebar
2. Edit:
   - Homepage hero photo
   - Blog page hero photo
   - About me text
   - Featured section title
3. Click **"Publish"**

---

## 🗂️ File Structure

```
travel-with-zaheer/
├── index.html              ← Homepage
├── blog.html               ← Blog listing
├── post.html               ← Single post template
├── 404.html                ← Not found page
├── styles.css              ← All styles
├── main.js                 ← All JavaScript
├── netlify.toml            ← Netlify config
├── _redirects              ← URL redirects
├── admin/
│   ├── index.html          ← CMS entry point
│   └── config.yml          ← CMS field definitions
├── _posts/                 ← Blog post markdown files (created by CMS)
│   └── golden-temples-kyoto.md
├── _data/
│   └── site_settings.json  ← Site settings (edited via CMS)
├── posts/
│   └── index.json          ← Posts index for JS rendering
└── uploads/               ← Uploaded images (created by Netlify)
```

---

## ⚡ Performance Notes

- **Build time**: Under 5 seconds (no build framework)
- **Page load**: Under 1 second (pure HTML/CSS/JS)
- **Images**: Lazy loaded for performance
- **Caching**: Long-term cache headers set for assets

---

## 🔧 Customization

### Change Brand Colors:
Edit `styles.css` → find `:root {` at the top → update `--gold` value

### Change Fonts:
Edit `styles.css` → update the `@import` Google Fonts URL and `--font-*` variables

### Add New Regions:
Edit `admin/config.yml` → find `- label: "🌍 Region"` → add to `options:` list

---

## ❓ Troubleshooting

**Admin login not working?**
→ Make sure you clicked the invite link in your email and set a password

**Images not uploading?**
→ Ensure Git Gateway is enabled in Netlify Identity settings

**Post not appearing on site?**
→ Check that "Published" is toggled ON in the admin

**Site not updating after publish?**
→ Wait 30–60 seconds, then hard refresh (Ctrl+Shift+R)

---

## 📞 Support

For Netlify issues: support.netlify.com
For Decap CMS docs: decapcms.org/docs
