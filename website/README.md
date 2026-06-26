# 📸 PAP Bot Website

Website untuk PAP Bot - Discord Photo Sharing Bot

## 🌟 Features

- ✅ Responsive Design
- ✅ Modern UI/UX
- ✅ 4 Game Modes Explanation
- ✅ Complete Commands List
- ✅ FAQ Accordion
- ✅ How to Use Guide
- ✅ Smooth Animations
- ✅ Mobile Friendly

## 📁 File Structure

```
website/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## 🚀 Deployment

### Option 1: GitHub Pages

1. Push folder `website/` ke GitHub repository
2. Go to Settings → Pages
3. Select branch and folder
4. Website akan live di: `https://username.github.io/repo-name`

### Option 2: Netlify

1. Connect GitHub repository ke Netlify
2. Set build command: (leave empty)
3. Set publish directory: `website`
4. Deploy

### Option 3: Vercel

1. Import GitHub repository ke Vercel
2. Set root directory: `website`
3. Deploy

### Option 4: Manual Hosting

Upload semua file ke web hosting (shared hosting, VPS, dll)

## 🔧 Customization

### Change Bot Invite Link

Edit di `index.html`:
```html
<a href="YOUR_INVITE_LINK_HERE" class="btn btn-primary">
```

### Change Colors

Edit di `styles.css`:
```css
:root {
    --primary: #5865F2;
    --secondary: #FF73FA;
    /* ... */
}
```

### Add New Mode

Tambahkan di section modes di `index.html`

## 📱 Mobile Responsive

Website sudah responsive untuk:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🎨 Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #5865F2 | Buttons, Links |
| Secondary | #FF73FA | Accents |
| Accent | #FFD93D | Highlights |
| Background | #0F0F0F | Main BG |
| Card | #242424 | Cards BG |

## 📝 Credits

- Font: Inter (Google Fonts)
- Icons: Custom SVG
- Design: Inspired by PinPlay Website

## 📜 License

MIT License - Free to use

---

Made with ❤️ for PAP Bot