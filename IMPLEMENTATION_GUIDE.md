# NH Terminal - Trading Platform React Implementation Guide

## Project Overview

NH Terminal is a comprehensive trading platform featuring real-time signals, market analysis, community engagement, and educational content. This guide provides a complete implementation roadmap for building the platform using React.

## Design System & Visual Foundation

### Color Palette
- **Primary Background**: `#0f1419` (Deep navy-black)
- **Secondary Background**: `#1a1f2e` (Dark slate)
- **Tertiary Background**: `#242b3d` (Medium dark)
- **Primary Accent**: `#d4a574` (Gold/brass)
- **Success Green**: `#22c55e` (Bright green for bullish)
- **Danger Red**: `#ef4444` (Bright red for bearish)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#a0aec0` (Light gray)
- **Text Tertiary**: `#718096` (Medium gray)
- **Border Color**: `#2d3748` (Dark border)

### Typography
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Headings**: Font Weight 700 (Bold)
- **Body Text**: Font Weight 400 (Regular)
- **Labels**: Font Weight 600 (Semibold)
- **Sizes**: 
  - H1: 32px
  - H2: 24px
  - H3: 20px
  - Body: 14px
  - Small: 12px

### Border Radius
- Small: `4px`
- Medium: `8px`
- Large: `12px`
- Extra Large: `16px`

---

## Project Structure

```
nh-terminal/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PriceCard.jsx
│   │   │   ├── EconomicCalendar.jsx
│   │   │   ├── LatestSignal.jsx
│   │   │   ├── Announcement.jsx
│   │   │   └── MarketSentiment.jsx
│   │   ├── Signals/
│   │   │   ├── SignalsPage.jsx
│   │   │   ├── SignalCard.jsx
│   │   │   ├── SignalFilters.jsx
│   │   │   ├── SignalForm.jsx
│   │   │   └── SignalChart.jsx
│   │   ├── Market/
│   │   │   ├── MarketOverview.jsx
│   │   │   ├── MarketChart.jsx
│   │   │   ├── OutlookView.jsx
│   │   │   ├── ResearchView.jsx
│   │   │   ├── KalenderView.jsx
│   │   │   └── SessionOverview.jsx
│   │   ├── Community/
│   │   │   ├── CommunityPage.jsx
│   │   │   ├── Forum.jsx
│   │   │   ├── LiveTrade.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Announcements.jsx
│   │   │   └── PostCard.jsx
│   │   ├── Profile/
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RewardTiers.jsx
│   │   │   ├── VideoEducation.jsx
│   │   │   └── UserStats.jsx
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignUpPage.jsx
│   │   ├── Common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Tab.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loader.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSignals.js
│   │   ├── useMarketData.js
│   │   └── useCommunity.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── MarketContext.js
│   │   └── SignalContext.js
│   ├── services/
│   │   ├── api.js
│   │   ├── signalService.js
│   │   ├── marketService.js
│   │   ├── communityService.js
│   │   └── authService.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   ├── animations.css
│   │   └── responsive.css
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── package.json
├── .env.example
└── README.md
```

---

## Component Architecture

### 1. Layout Components

#### Header Component
```jsx
// components/Layout/Header.jsx
- Logo and branding
- Navigation tabs (Dashboard, Signal, Market, Community, Profile)
- Settings icon
- Logout button
- Active tab indicator with gold underline
```

**Props:**
- `activeTab`: Current active navigation section
- `onTabChange`: Callback when tab is clicked
- `user`: User object with profile info

#### Sidebar Component
```jsx
// components/Layout/Sidebar.jsx
- Secondary navigation if needed
- User profile section
- Quick links
```

#### Footer Component
```jsx
// components/Layout/Footer.jsx
- Company branding
- Product links (Dashboard, Signals, Market, Economic Calendar)
- Community links (Community, Live Trade, Forum, Education)
- Support links (Help Center, FAQ, Contact, Privacy)
- Copyright information
```

### 2. Dashboard Components

#### Dashboard.jsx (Main Container)
**Features:**
- Responsive grid layout
- Real-time price display for XAU/USD
- Live chart with red area fill
- High/Low/Open indicators
- Active signal count and win rate
- Net pips earned display

**State Management:**
```javascript
const [priceData, setPriceData] = useState({
  currency: 'XAU/USD',
  price: 3427.20,
  change: -2.30,
  changePercent: -0.067,
  high: 3434.50,
  low: 3412.30,
  open: 3428.20,
  lastUpdate: '11:38 WIB'
});

const [signals, setSignals] = useState({
  active: 5,
  winRate: 100,
  netPips: 9.3
});
```

#### PriceCard.jsx
**Props:**
- `currency`: 'XAU/USD'
- `price`: Current price
- `change`: Price change amount
- `changePercent`: Percentage change
- `high`: Day high
- `low`: Day low
- `open`: Opening price
- `chartData`: Array of price points for sparkline

**Styling:**
- Large gold text for main price
- Red text for negative changes
- Green/gray text for high/low/open
- Responsive sizing for mobile

#### EconomicCalendar.jsx
**Props:**
- `events`: Array of calendar events
- `onViewAll`: Callback to navigate to full calendar

**Event Structure:**
```javascript
{
  time: '15:30',
  impact: 'HIGH' | 'MEDIUM' | 'LOW',
  currency: 'US',
  event: 'Non-Farm Payrolls',
  icon: React.ReactNode
}
```

**Features:**
- Time display with pill background
- Impact badge (colored)
- Event name
- "View All" link with arrow
- Max 3 events displayed

#### LatestSignal.jsx
**Props:**
- `signal`: Signal object
- `onViewDetails`: Callback

**Signal Structure:**
```javascript
{
  type: 'SELL' | 'BUY',
  currency: 'XAUUSD',
  session: 'London Session',
  status: 'LIVE',
  entry: 3428.50,
  stopLoss: 3428.50,
  takeProfit1: 3428.50,
  takeProfit2: 3428.50,
  pipsGain: 250,
  chartData: []
}
```

#### Announcement.jsx
**Props:**
- `announcements`: Array of announcement objects
- `onViewAll`: Callback

**Announcement Structure:**
```javascript
{
  title: string,
  subtitle: string,
  content: string,
  time: string,
  author: string
}
```

#### MarketSentiment.jsx
**Props:**
- `sentimentData`: Array of sentiment readings

**Sentiment Structure:**
```javascript
{
  pair: 'XAUUSD',
  bullish: 68,
  bearish: 30,
  neutral: 2,
  lastUpdate: 'timestamp'
}
```

---

### 3. Signals Components

#### SignalsPage.jsx (Main Container)
**Features:**
- Signal type toggle (TIM EXPERT / AI REAL-TIME)
- 128 Signals counter
- Filter section with search and dropdowns
- Grid of signal cards (2 columns on desktop, 1 on mobile)
- "Tambah Signal" button for admins

#### SignalCard.jsx
**Props:**
```javascript
{
  type: 'SELL' | 'BUY',
  currency: 'XAUUSD',
  session: 'London Session',
  status: 'LIVE' | 'CLOSED' | 'RUNNING',
  pipsGain: number,
  entry: number,
  stopLoss: number,
  tp1: number,
  tp2: number,
  resistance: string,
  divergence: string,
  chartImage: string,
  publishedTime: string,
  chartData: []
}
```

**Visual Elements:**
- Type badge (green for BUY, red for SELL)
- Pip gain display with green/red background
- Entry, SL, TP1, TP2 values
- Mini chart visualization
- Status indicator
- Technical analysis text

#### SignalFilters.jsx
**Props:**
- `onSearch`: Callback with search term
- `onSessionChange`: Callback with selected session
- `onStatusChange`: Callback with selected status
- `onResultChange`: Callback with selected result
- `onNewestChange`: Callback with selected timeframe

**Filter Options:**
- Search input for currency pairs
- Session dropdown (London, Asia, NY, etc.)
- Status dropdown (Running, Closed, etc.)
- Result dropdown (All, Win, Loss, etc.)
- Newest dropdown (All, Today, This Week, etc.)

#### SignalForm.jsx (For Creating New Signals)
**Fields:**
- Signal type toggle (BUY/SELL)
- Entry price input
- Stop loss input
- Take profit 1 input
- Take profit 2 input
- Chart upload with drag-and-drop
- Analysis/notes textarea
- Publish button

**Validation:**
- All price fields required
- Chart file size max 5MB
- File type validation (images only)

#### SignalChart.jsx
**Props:**
- `data`: Array of price points
- `type`: 'SELL' | 'BUY'
- `height`: Chart height in pixels

**Features:**
- Area chart with gradient fill
- Red fill for SELL signals
- Green fill for BUY signals
- Responsive sizing
- No axes to maintain clean look

---

### 4. Market Components

#### MarketOverview.jsx
**Tabs:**
1. **Chart** - Full market chart display
2. **Outlook** - Daily market outlook and analysis
3. **Research** - Market research data
4. **Kalender** - Economic calendar

#### OutlookView.jsx
**Features:**
- Daily outlook headline
- Support/resistance levels
- Market analysis text
- Session information
- Forecast data

**Props:**
```javascript
{
  headline: string,
  analysis: string,
  supportLevels: number[],
  resistanceLevels: number[],
  forecastData: string
}
```

#### SessionOverview.jsx (In Market Page)
**Structure:**
- Asia session status and time
- London session status and time
- New York session status and time (upcoming)
- Current session indicator
- Next session countdown
- Market activity gauge

#### KeyMarketDrivers.jsx
**Props:**
```javascript
{
  drivers: [
    { name: 'DXY Strength', active: boolean },
    { name: 'Gold Pressure', active: boolean },
    { name: 'NFP Ahead', active: boolean },
    { name: 'JPY Weakness', active: boolean }
  ]
}
```

---

### 5. Community Components

#### CommunityPage.jsx
**Tabs:**
1. **Forum** - Discussion threads
2. **Live Trade** - Live trading chat
3. **Chat** - General chat room
4. **Info** - Community information

#### Forum.jsx
**Features:**
- Thread creation button
- Forum post cards
- Author information with tier badge
- Like and reply counts
- Media attachments (Foto/Video buttons)

**Post Structure:**
```javascript
{
  id: string,
  author: {
    name: string,
    tier: 'TRADER' | 'INACTIVE' | 'PRIME' | 'ELITE' | 'SULTAN',
    avatar: string,
    userId: string
  },
  title: string,
  content: string,
  timestamp: string,
  likes: number,
  replies: number,
  media: {
    photos: string[],
    videos: string[]
  }
}
```

#### LiveTrade.jsx
**Features:**
- Live chat interface
- Real-time message display
- User tier badges
- Timestamp for each message
- Admin highlight (gold border)
- Message input field

**Message Structure:**
```javascript
{
  id: string,
  author: {
    name: string,
    tier: 'TRADER' | 'PRIME' | 'ELITE' | 'SULTAN',
    avatar: string
  },
  content: string,
  timestamp: string,
  isAdmin: boolean,
  isOwn: boolean
}
```

#### Announcements.jsx
**Features:**
- Announcement creation form
- Announcement list
- "Judul Pengumuman" (Title input)
- "Isi Pengumuman" (Content textarea)
- Photo upload with icon
- Publish button

**Announcement Structure:**
```javascript
{
  id: string,
  title: string,
  content: string,
  image?: string,
  timestamp: string,
  author: {
    name: string,
    tier: string
  }
}
```

---

### 6. Profile Components

#### ProfilePage.jsx
**Sections:**
1. **User Header** with profile picture, name, tier, and progress bar
2. **Reward Tiers** - Visual tier progression
3. **Video Edukasi** - Educational video grid
4. **Reward Program** - Active rewards section

#### RewardTiers.jsx
**Tiers Display:**
```javascript
[
  { name: 'SULTAN', lots: 1500, reward: 'iPhone 17 Pro Max', status: 'upcoming' },
  { name: 'ELITE', lots: 1000, reward: '$1,000 Cash', status: 'upcoming' },
  { name: 'PRIME', lots: 500, reward: 'Samsung Galaxy A55', status: 'current' },
  { name: 'TRADER', lots: 50, reward: 'Merchandise NH', status: 'passed' },
  { name: 'INACTIVE', lots: 0, reward: '-', status: 'passed' }
]
```

**Features:**
- Timeline vertical layout
- Current tier highlighted with gold
- Progress percentage display
- Total lots earned
- Member since date

#### VideoEducation.jsx
**Features:**
- Grid of video cards
- Video title and course number
- View count display
- Premium lock icon for locked content
- Play button overlay
- Duration display

**Video Structure:**
```javascript
{
  id: string,
  title: string,
  courseNumber: number,
  duration: string,
  views: number,
  thumbnail?: string,
  isPremium: boolean,
  videoUrl: string
}
```

---

### 7. Authentication Components

#### LoginPage.jsx
**Features:**
- Centered login form
- Purple gradient background with blur effect
- Email input field
- Password input field
- "Forgot Password?" link
- "Log In" button
- "Don't Have Account? Sign Up" link

**Form Validation:**
- Email format validation
- Password minimum 8 characters
- Form submission error handling

**State:**
```javascript
const [formData, setFormData] = useState({
  email: '',
  password: ''
});
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);
```

---

## Common Components

### Button.jsx
```jsx
<Button 
  variant="primary" | "secondary" | "outline" | "danger"
  size="sm" | "md" | "lg"
  disabled={boolean}
  loading={boolean}
  onClick={handler}
>
  Text
</Button>
```

### Card.jsx
```jsx
<Card className="optional-class">
  <Card.Header title="Title" />
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

### Badge.jsx
```jsx
<Badge variant="success" | "danger" | "warning" | "info" | "default">
  Label
</Badge>
```

### Tab.jsx
```jsx
<Tabs activeTab={active} onChange={setActive}>
  <Tab label="Tab 1" value="tab1">Content 1</Tab>
  <Tab label="Tab 2" value="tab2">Content 2</Tab>
</Tabs>
```

---

## State Management Strategy

### Context Providers
1. **AuthContext** - User authentication and profile
2. **MarketContext** - Real-time market data
3. **SignalContext** - Trading signals management

### Example: AuthContext
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email, password) => {
    // API call
  };

  const logout = () => {
    // Clear user data
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Styling Approach

### CSS Variables (variables.css)
```css
:root {
  --bg-primary: #0f1419;
  --bg-secondary: #1a1f2e;
  --bg-tertiary: #242b3d;
  
  --text-primary: #ffffff;
  --text-secondary: #a0aec0;
  --text-tertiary: #718096;
  
  --color-gold: #d4a574;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  
  --border-color: #2d3748;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Global Styles (globals.css)
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

### Responsive Design (responsive.css)
```css
/* Mobile First Approach */
@media (min-width: 768px) {
  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-2 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .container {
    padding: 0 40px;
  }
}
```

---

## API Integration

### Base API Service (services/api.js)
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle logout
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Signal Service
```javascript
// services/signalService.js
export const signalService = {
  getAllSignals: async (filters = {}) => {
    const response = await api.get('/signals', { params: filters });
    return response.data;
  },

  getSignalById: async (id) => {
    const response = await api.get(`/signals/${id}`);
    return response.data;
  },

  createSignal: async (signalData) => {
    const response = await api.post('/signals', signalData);
    return response.data;
  },

  updateSignal: async (id, signalData) => {
    const response = await api.put(`/signals/${id}`, signalData);
    return response.data;
  }
};
```

---

## Data Flow Example: Dashboard Real-time Updates

```javascript
// hooks/useMarketData.js
import { useEffect, useState, useCallback } from 'react';
import { marketService } from '../services/marketService';

export const useMarketData = () => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await marketService.getCurrentPrice('XAUUSD');
        setPriceData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up WebSocket for real-time updates
    const ws = new WebSocket(process.env.REACT_APP_WS_URL);
    
    ws.onmessage = (event) => {
      const updated = JSON.parse(event.data);
      setPriceData(prev => ({ ...prev, ...updated }));
    };

    return () => ws.close();
  }, []);

  return { priceData, loading, error };
};
```

---

## Performance Optimization

### Code Splitting
```javascript
// App.jsx
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const SignalsPage = lazy(() => import('./components/Signals/SignalsPage'));
const MarketOverview = lazy(() => import('./components/Market/MarketOverview'));

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      {/* Routes */}
    </Suspense>
  );
}
```

### Memoization
```javascript
// Only re-render when props change
export const SignalCard = memo(({ signal, onSelect }) => {
  return (
    // Component JSX
  );
});

SignalCard.displayName = 'SignalCard';
```

### useCallback for Event Handlers
```javascript
const handleSignalCreate = useCallback(async (formData) => {
  // This function reference won't change unless dependencies change
  await signalService.createSignal(formData);
}, []);
```

---

## Testing Strategy

### Component Tests (Jest + React Testing Library)
```javascript
// __tests__/Dashboard.test.jsx
import { render, screen } from '@testing-library/react';
import Dashboard from '../components/Dashboard/Dashboard';

describe('Dashboard', () => {
  it('renders price data correctly', () => {
    render(<Dashboard />);
    expect(screen.getByText('XAU/USD')).toBeInTheDocument();
  });

  it('displays economic calendar events', () => {
    render(<Dashboard />);
    expect(screen.getByText('Non-Farm Payrolls')).toBeInTheDocument();
  });
});
```

---

## Environment Configuration

### .env.example
```
REACT_APP_API_URL=https://api.nhterminal.com/v1
REACT_APP_WS_URL=wss://ws.nhterminal.com
REACT_APP_ENV=development
REACT_APP_LOG_LEVEL=debug
```

---

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern browser with ES6 support

### Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file from `.env.example`
4. Start development server: `npm start`
5. Build for production: `npm run build`

### Package Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "zustand": "^4.3.2",
    "recharts": "^2.5.0",
    "date-fns": "^2.29.3"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "tailwindcss": "^3.2.4",
    "vite": "^4.1.0"
  }
}
```

---

## Browser Support
- Chrome (Latest 2 versions)
- Firefox (Latest 2 versions)
- Safari 12+
- Edge (Latest 2 versions)

---

## Performance Metrics Target
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

---

## Security Considerations
- HTTPS only communication
- JWT token storage in secure HttpOnly cookies
- CSRF protection on all POST requests
- Input validation on client and server
- XSS protection with content sanitization
- Rate limiting on API endpoints

---

## Deployment Checklist
- [ ] Environment variables configured
- [ ] API endpoints updated for production
- [ ] Build optimized (`npm run build`)
- [ ] Performance audit passed
- [ ] Security audit completed
- [ ] Error logging configured
- [ ] Analytics configured
- [ ] PWA manifest created
- [ ] Service worker implemented
- [ ] CDN configured for assets

---

## Support & Resources
- Documentation: https://docs.nhterminal.com
- API Reference: https://api-docs.nhterminal.com
- GitHub: https://github.com/nhterminal/platform
- Issue Tracker: https://github.com/nhterminal/platform/issues

---

**Last Updated**: August 2026
**Version**: 1.0.0
