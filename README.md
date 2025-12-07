# Phyllis Home Care Website

A modern, professional website for Phyllis Home Care - a personal assistance homecare company providing compassionate in-home care services for seniors and adults.

## 🌟 Features

- **Clean, Modern Design** - Warm, trustworthy aesthetic that builds confidence
- **Mobile Responsive** - Looks great on all devices
- **Easy Online Application** - Multi-step form for requesting care services
- **Caregiver Recruitment** - Career page with online application
- **Fast Loading** - Pure HTML/CSS/JS with no heavy frameworks
- **SEO Optimized** - Proper meta tags and semantic HTML
- **Accessible** - Follows web accessibility best practices

## 📁 Project Structure

```
phyllishomecare/
├── index.html          # Homepage
├── apply.html          # Care request application form
├── careers.html        # Caregiver recruitment & application
├── services.html       # Detailed services page
├── css/
│   ├── style.css       # Main stylesheet
│   ├── apply.css       # Application form styles
│   └── pages.css       # Additional page styles
├── js/
│   └── main.js         # JavaScript functionality
├── images/             # Image assets (add your images here)
├── README.md           # This file
└── .gitignore          # Git ignore file
```

## 🚀 Deployment

### GitHub Pages (Recommended)

1. Create a new GitHub repository
2. Push this code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/phyllishomecare.git
   git push -u origin main
   ```
3. Go to repository Settings > Pages
4. Select "Deploy from a branch" and choose `main` branch
5. Your site will be live at `https://YOUR_USERNAME.github.io/phyllishomecare/`

### Custom Domain

To use a custom domain (e.g., phyllishomecare.com):

1. In GitHub repo Settings > Pages, add your custom domain
2. Create a `CNAME` file in the root with your domain:
   ```
   www.phyllishomecare.com
   ```
3. Configure your domain's DNS:
   - Add a CNAME record pointing to `YOUR_USERNAME.github.io`
   - Or use A records pointing to GitHub's IPs

### Other Hosting Options

- **Netlify**: Drag and drop the folder or connect to GitHub
- **Vercel**: Connect to GitHub for automatic deployments
- **AWS S3**: Upload files to an S3 bucket with static hosting enabled
- **Traditional Hosting**: Upload via FTP to any web host

## 🎨 Customization

### Branding

1. **Logo**: Update the logo in the header/footer (currently using text + icon)
2. **Colors**: Modify CSS variables in `css/style.css`:
   ```css
   :root {
       --color-primary: #2D5A4A;      /* Main brand color */
       --color-accent: #C4A962;        /* Accent/gold color */
       /* ... other colors */
   }
   ```
3. **Fonts**: Change Google Fonts imports in HTML and CSS

### Content

- Update phone numbers: Search for `(800) 555-0123` and replace
- Update email addresses: Search for `@phyllishomecare.com` and replace
- Update address in the contact section
- Add real testimonials
- Update service descriptions as needed

### Images

Add images to the `images/` folder and update the placeholder sections:
- Hero section image
- About section images
- Service detail images
- Team member photos (for About page)

## 📝 Forms

The forms currently use JavaScript to simulate submissions. To make them functional:

### Option 1: Formspree (Easy)
1. Sign up at formspree.io
2. Update form `action` attributes:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

### Option 2: Netlify Forms
If hosting on Netlify, add `netlify` attribute to forms:
```html
<form name="contact" netlify>
```

### Option 3: Custom Backend
Connect to your own backend API endpoint.

## 📱 Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage with hero, services overview, about, process, testimonials, contact |
| `apply.html` | Multi-step care request form |
| `careers.html` | Caregiver recruitment with benefits and application |
| `services.html` | Detailed service descriptions |

## 🔧 Development

No build process required! Just edit the HTML, CSS, and JS files directly.

For local development:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📄 License

This website template is proprietary to Phyllis Home Care.

## 🤝 Support

For questions or customization requests, contact the development team.

---

Built with ❤️ for Phyllis Home Care
