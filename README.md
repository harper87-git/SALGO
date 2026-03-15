# SALGO — Deployment Guide

## What's in this folder

```
salgo/
├── index.html          ← App shell with PWA meta tags
├── package.json        ← Dependencies (React + Vite)
├── vite.config.js      ← Build config
├── public/
│   ├── manifest.json   ← PWA manifest (Add to Home Screen)
│   ├── sw.js           ← Service worker (offline support)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── src/
    ├── main.jsx        ← Entry point
    └── App.jsx         ← Your full app
```

---

## Deploy to Vercel (15 minutes)

### Step 1 — Create a GitHub repository

1. Go to **github.com** and sign in (or create a free account)
2. Click the **+** icon → **New repository**
3. Name it `salgo`
4. Leave it **Public**
5. Click **Create repository**

### Step 2 — Upload your files

On the new empty repo page:
1. Click **uploading an existing file**
2. Drag the entire contents of this folder into the upload area
   - Make sure the folder structure is preserved (src/, public/, etc.)
3. Scroll down, click **Commit changes**

### Step 3 — Deploy on Vercel

1. Go to **vercel.com** and sign in with GitHub
2. Click **Add New Project**
3. Find and click **Import** next to your `salgo` repository
4. Vercel auto-detects Vite — just click **Deploy**
5. Wait ~60 seconds

Your app is now live at `https://salgo.vercel.app` (or similar).

---

## Share with testers

Send them the Vercel URL. On mobile, they'll see an
**"Add to Home Screen"** prompt — tap it and SALGO installs
like a native app with its own icon.

---

## Making updates later

1. Edit `src/App.jsx` with your changes
2. Go to your GitHub repo → `src/App.jsx` → click the pencil ✏️ icon
3. Paste the updated code → **Commit changes**
4. Vercel auto-deploys in ~30 seconds

---

## Before adding Supabase

Keep the URL handy — when you're ready for accounts and
data persistence, you'll connect Supabase to this same
Vercel project. Nothing needs to be rebuilt from scratch.
