# NH Terminal - Quick Start Guide

## 🚀 Getting Started

This is a complete React 18 trading platform implementation with all components, services, and configuration files ready to use with Claude Code Agent.

### What's Included

- ✅ **Complete Project Structure** - Organized and ready to scale
- ✅ **Design System** - Tailwind CSS with custom NH Terminal theme
- ✅ **Component Library** - Layout, Dashboard, Auth, Market, Signals, Community, Profile
- ✅ **API Services** - Fully configured axios with interceptors
- ✅ **Custom Hooks** - useAuth, useMarketData, useSignals, useCommunity
- ✅ **Context Providers** - AuthContext, MarketContext, SignalContext
- ✅ **Utilities** - Formatters, validators, constants, helpers
- ✅ **Configuration** - Vite, Tailwind, ESLint, Prettier
- ✅ **Documentation** - Comprehensive IMPLEMENTATION_GUIDE.md

---

## 📋 Project Setup

### Step 1: Extract the Archive
```bash
unzip nh-terminal.zip
cd nh-terminal
```

### Step 2: Install Dependencies
```bash
npm install
```

If you encounter any issues:
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your API endpoints
# VITE_API_URL=https://api.nhterminal.com/v1
# VITE_WS_URL=wss://ws.nhterminal.com
```

### Step 4: Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🎯 Using with Claude Code Agent

### Open in Claude Code
1. Open **Claude Code** desktop app or VS Code extension
2. Click "Open in Claude"
3. Select the project folder

### Work with Claude
Tell Claude what you want to build:

```
"Add a new component for real-time trade notifications 
with sound alerts. Update the context provider to manage 
notification state globally and add WebSocket listener 
for new trades."
```

Or:

```
"Create a new page for trading history with filters 
for date range, symbol, and profit/loss. Include a 
data table with sorting and pagination."
```

---

## 📁 Project Structure

```
nh-terminal/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard/       # Dashboard page
│   │   ├── Signals/         # Trading signals
│   │   ├── Market/          # Market analysis
│   │   ├── Community/       # Community features
│   │   ├── Profile/         # User profile
│   │   ├── Auth/            # Authentication
│   │   ├── Layout/          # Header, Footer
│   │   └── Common/          # Reusable components
│   ├── services/            # API services
│   ├── hooks/               # Custom React hooks
│   ├── context/             # Context providers
│   ├── utils/               # Utilities & helpers
│   ├── styles/              # Global styles
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── .env.example             # Environment template
├── README.md                # Full documentation
├── IMPLEMENTATION_GUIDE.md  # Detailed guide
└── .gitignore
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Lint JavaScript files
npm run format           # Format code with Prettier

# Testing
npm run test             # Run tests
npm run test:coverage    # Generate coverage report
```

---

## 🎨 Customization

### Change Theme Colors
Edit `tailwind.config.js`:
```javascript
extend: {
  colors: {
    'color-gold': '#d4a574',      // Change primary color
    'color-success': '#22c55e',    // Change success color
    'bg-primary': '#0f1419',       // Change background
  }
}
```

### Update Brand Name
Search and replace "NH Terminal" with your brand name across the project.

### Add New Pages
1. Create component in `src/components/[Section]/[Page].jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in `Header.jsx`

---

## 🔌 API Integration

### Update API Endpoints
Edit `.env.local`:
```
VITE_API_URL=https://your-api.com/v1
VITE_WS_URL=wss://your-ws.com
```

### API Services Location
- `src/services/api.js` - Base axios configuration
- `src/services/authService.js` - Authentication
- `src/services/signalService.js` - Trading signals
- `src/services/marketService.js` - Market data
- `src/services/communityService.js` - Community features

### Example API Call
```javascript
import { signalService } from './services/signalService';

// In component
const signals = await signalService.getAllSignals({ limit: 10 });
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Output goes to `dist/` folder.

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Tailwind Styles Not Loading
```bash
# Rebuild Tailwind
npm run dev

# Or force rebuild
rm -rf .next node_modules
npm install
```

### WebSocket Connection Issues
- Check `VITE_WS_URL` in `.env.local`
- Verify backend is running and accessible
- Check browser console for errors

---

## 📚 Documentation Files

1. **IMPLEMENTATION_GUIDE.md** - Detailed component documentation
   - Component architecture
   - State management strategy
   - API integration guide
   - Performance optimization

2. **README.md** - Full project documentation
   - Features overview
   - Installation instructions
   - Tech stack details
   - Browser support

3. **package.json** - Project configuration
   - Dependencies
   - Scripts
   - Version info

---

## 🤝 Claude Code Tips

### File Structure Commands
```
"Create the [ComponentName] component with the following features: ..."
"Add a new page for [Feature Name] at src/components/[Section]/[Page].jsx"
"Update the [ServiceName] to include new API endpoints"
```

### Quick Wins
- Add dark/light theme toggle
- Implement loading skeletons
- Add error boundaries
- Create reusable form components
- Add notification/toast system
- Implement infinite scroll
- Add export to CSV functionality

### Performance Improvements
- Code splitting by route
- Image optimization
- Bundle size analysis
- Lazy load components
- Memoize expensive computations

---

## 📊 Browser Support

- ✅ Chrome (Latest 2)
- ✅ Firefox (Latest 2)
- ✅ Safari 12+
- ✅ Edge (Latest 2)
- ✅ Mobile browsers

---

## 🔐 Security

- HTTPS recommended for production
- Environment variables for secrets
- CORS headers configured
- Input validation on client & server
- XSS protection via sanitization
- CSRF token support

---

## 📞 Support Resources

- **GitHub**: https://github.com/nhterminal/platform
- **Documentation**: https://docs.nhterminal.com
- **API Docs**: https://api-docs.nhterminal.com
- **Discord**: https://discord.gg/nhterminal
- **Email**: support@nhterminal.com

---

## 🎓 Learning Resources

- [React 18 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

---

## 📝 Next Steps

1. ✅ Extract project files
2. ✅ Install dependencies  
3. ✅ Configure environment variables
4. ✅ Start development server
5. ✅ Read IMPLEMENTATION_GUIDE.md
6. ✅ Open in Claude Code
7. ✅ Start building!

---

## 💡 Common Tasks

### Add a new API endpoint
1. Update service in `src/services/[Service].js`
2. Create hook in `src/hooks/index.js` if needed
3. Use in component

### Add new page
1. Create component in `src/components/[Section]/[Page].jsx`
2. Add route in `src/App.jsx`
3. Add navigation in `Header.jsx`

### Modify theme
1. Edit `tailwind.config.js`
2. Update colors in theme section
3. Update `src/index.css` for custom styles

### Deploy changes
1. `npm run build`
2. Test with `npm run preview`
3. Deploy to hosting

---

**Version**: 1.0.0  
**Last Updated**: August 2026  
**Framework**: React 18 + Vite + Tailwind CSS
