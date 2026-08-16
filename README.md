# NH Terminal - Trading Platform

A modern, full-featured trading platform built with React 18, featuring real-time market data, trading signals, community engagement, and comprehensive market analysis tools.

## 🌟 Features

### Dashboard
- **Live Price Display** - Real-time XAU/USD pricing with change indicators
- **Interactive Charts** - Area charts showing price movements
- **Economic Calendar** - High-impact economic events with real-time updates
- **Trading Signals** - Latest buy/sell signals with performance metrics
- **Market Sentiment** - Bullish/Bearish sentiment analysis
- **Quick Stats** - Active signals, win rate, and net pips earned

### Trading Signals
- **Signal Management** - View, filter, and create trading signals
- **Signal Types** - BUY/SELL signals with detailed analysis
- **AI Signals** - TIM EXPERT and AI REAL-TIME signal types
- **Performance Tracking** - Win rate and pip gain tracking
- **Chart Integration** - Visual representation of signal opportunities
- **Signal Filtering** - Search, filter by session, status, and results

### Market Analysis
- **Chart View** - Comprehensive market charting tools
- **Outlook** - Daily market analysis and predictions
- **Research** - In-depth market research data
- **Economic Calendar** - Full calendar with events and impact levels
- **Session Overview** - Asia, London, and New York trading sessions
- **Key Market Drivers** - DXY, Gold, NFP, and JPY analysis

### Community
- **Forum** - Discussion threads and community posts
- **Live Trading Chat** - Real-time trading conversations
- **Announcements** - Important platform announcements
- **User Tiers** - Community member ranking system
- **Media Support** - Photo and video attachments

### User Profile
- **Reward Tiers** - INACTIVE, TRADER, PRIME, ELITE, SULTAN
- **Educational Content** - Video courses and tutorials
- **Account Statistics** - Performance metrics and progress
- **Reward Program** - Incentive programs and achievements

### Authentication
- **Login/Signup** - Secure user authentication
- **Password Recovery** - Forgot password functionality
- **Session Management** - Persistent login with tokens

## 📋 Technical Stack

- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Router**: React Router 6.20
- **HTTP Client**: Axios 1.6
- **State Management**: Zustand 4.4
- **Charts**: Recharts 2.10
- **Icons**: Lucide React 0.294
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library
- **Date Handling**: date-fns 2.30

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nhterminal/platform.git
   cd nh-terminal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API endpoints:
   ```
   VITE_API_URL=https://api.nhterminal.com/v1
   VITE_WS_URL=wss://ws.nhterminal.com
   VITE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
nh-terminal/
├── src/
│   ├── components/
│   │   ├── Auth/              # Authentication pages
│   │   ├── Common/            # Reusable components
│   │   ├── Dashboard/         # Dashboard components
│   │   ├── Signals/           # Trading signals section
│   │   ├── Market/            # Market analysis section
│   │   ├── Community/         # Community features
│   │   ├── Profile/           # User profile section
│   │   └── Layout/            # Layout components
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # React Context providers
│   ├── services/              # API services
│   ├── styles/                # Global stylesheets
│   ├── utils/                 # Utility functions
│   ├── App.jsx                # Main app component
│   └── main.jsx               # Entry point
├── public/                    # Static assets
├── .env.example               # Environment variables template
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🎨 Design System

### Color Palette
- **Primary Background**: `#0f1419`
- **Secondary Background**: `#1a1f2e`
- **Accent (Gold)**: `#d4a574`
- **Success (Green)**: `#22c55e`
- **Danger (Red)**: `#ef4444`
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#a0aec0`

### Typography
- **Font Family**: Inter
- **Heading Sizes**: 32px, 24px, 20px
- **Body Text**: 14px
- **Small Text**: 12px

## 🧩 Key Components

### Dashboard Components
- `<PriceCard />` - Display current price with indicators
- `<EconomicCalendar />` - Show upcoming economic events
- `<LatestSignal />` - Display most recent trading signal
- `<MarketSentiment />` - Show market sentiment analysis
- `<Announcement />` - Community announcements

### Signals Components
- `<SignalCard />` - Individual signal display
- `<SignalFilters />` - Filter and search signals
- `<SignalChart />` - Visual signal chart
- `<SignalForm />` - Create new signal

### Market Components
- `<MarketOverview />` - Main market view
- `<SessionOverview />` - Trading session information
- `<KeyMarketDrivers />` - Market factor analysis

### Community Components
- `<Forum />` - Discussion threads
- `<LiveTrade />` - Live chat interface
- `<Announcements />` - Platform announcements

### Common Components
- `<Button />` - Primary UI button
- `<Card />` - Content container
- `<Badge />` - Status badges
- `<Tabs />` - Tab navigation
- `<Input />` - Form input field
- `<Modal />` - Modal dialog

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast development and optimized builds. Key features:
- Hot Module Replacement (HMR) for instant updates
- Optimized production builds with code splitting
- Asset optimization

### Tailwind CSS
Tailwind CSS is configured for utility-first styling with:
- Custom color palette matching NH Terminal design
- Responsive breakpoints for mobile/tablet/desktop
- Custom spacing and sizing

### Environment Variables

Create `.env.local` file:
```
VITE_API_URL=https://api.nhterminal.com/v1
VITE_WS_URL=wss://ws.nhterminal.com
VITE_APP_NAME=NH Terminal
VITE_LOG_LEVEL=debug
```

## 📡 API Integration

### Base URL
All API requests are prefixed with `VITE_API_URL` environment variable.

### Authentication
- Uses JWT tokens stored in localStorage
- Tokens automatically included in request headers
- Automatic logout on 401 responses

### WebSocket Connection
Real-time data updates via WebSocket:
- Market price updates
- Signal notifications
- Chat messages
- User notifications

### Example API Endpoints
```
GET  /api/signals           # Get all signals
POST /api/signals           # Create new signal
GET  /api/market/price      # Get current prices
GET  /api/community/posts   # Get community posts
GET  /api/user/profile      # Get user profile
```

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Test Structure
- Unit tests for components using React Testing Library
- Integration tests for data flows
- E2E tests for critical user journeys

## 📊 Performance

### Optimization Techniques
- **Code Splitting**: Lazy loading of routes with React.lazy()
- **Component Memoization**: Preventing unnecessary re-renders
- **Image Optimization**: Serving optimized images
- **Caching Strategy**: Browser caching for assets

### Performance Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s

## 🔐 Security

- HTTPS only in production
- JWT token-based authentication
- CSRF protection on API requests
- XSS prevention with content sanitization
- Input validation on client and server

## 🌐 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari 12+
- Edge (latest 2 versions)

## 📦 Deployment

### Build Production Version
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "preview"]
```

## 📚 Documentation

- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Detailed component documentation
- **[API Reference](https://api-docs.nhterminal.com)** - API endpoint documentation
- **[Design System](https://design.nhterminal.com)** - Design specifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved by NH Terminal.

## 💬 Support

- **Documentation**: https://docs.nhterminal.com
- **Discord Community**: https://discord.gg/nhterminal
- **Email Support**: support@nhterminal.com
- **Issue Tracker**: https://github.com/nhterminal/platform/issues

## 🙏 Acknowledgments

- React team for the excellent framework
- Tailwind CSS for utility-first styling
- Recharts for data visualization
- All contributors and community members

---

**Version**: 1.0.0  
**Last Updated**: August 2026  
**Maintained by**: NH Terminal Team
