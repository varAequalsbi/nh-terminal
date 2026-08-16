// src/context/index.js
import React, { createContext, useReducer, useCallback } from 'react';

// Auth Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);

  const login = useCallback((user, token) => {
    dispatch({ type: 'LOGIN', payload: { user, token } });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Market Context
export const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
  const [marketState, dispatch] = useReducer(marketReducer, initialMarketState);

  const updatePrice = useCallback((pair, data) => {
    dispatch({ type: 'UPDATE_PRICE', payload: { pair, data } });
  }, []);

  const updateSentiment = useCallback((pair, sentiment) => {
    dispatch({ type: 'UPDATE_SENTIMENT', payload: { pair, sentiment } });
  }, []);

  return (
    <MarketContext.Provider value={{ ...marketState, updatePrice, updateSentiment }}>
      {children}
    </MarketContext.Provider>
  );
};

// Signal Context
export const SignalContext = createContext();

export const SignalProvider = ({ children }) => {
  const [signalState, dispatch] = useReducer(signalReducer, initialSignalState);

  const addSignal = useCallback((signal) => {
    dispatch({ type: 'ADD_SIGNAL', payload: signal });
  }, []);

  const updateSignal = useCallback((id, data) => {
    dispatch({ type: 'UPDATE_SIGNAL', payload: { id, data } });
  }, []);

  const removeSignal = useCallback((id) => {
    dispatch({ type: 'REMOVE_SIGNAL', payload: id });
  }, []);

  return (
    <SignalContext.Provider value={{ ...signalState, addSignal, updateSignal, removeSignal }}>
      {children}
    </SignalContext.Provider>
  );
};

// Reducers
const initialAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return initialAuthState;
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialMarketState = {
  prices: {},
  sentiment: {},
  calendar: [],
  isLoading: false,
};

const marketReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_PRICE':
      return {
        ...state,
        prices: {
          ...state.prices,
          [action.payload.pair]: action.payload.data,
        },
      };
    case 'UPDATE_SENTIMENT':
      return {
        ...state,
        sentiment: {
          ...state.sentiment,
          [action.payload.pair]: action.payload.sentiment,
        },
      };
    case 'SET_CALENDAR':
      return {
        ...state,
        calendar: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialSignalState = {
  signals: [],
  activeSignals: [],
  filteredSignals: [],
  isLoading: false,
};

const signalReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_SIGNAL':
      return {
        ...state,
        signals: [action.payload, ...state.signals],
        activeSignals: action.payload.status === 'active' 
          ? [action.payload, ...state.activeSignals] 
          : state.activeSignals,
      };
    case 'UPDATE_SIGNAL': {
      const updated = state.signals.map((s) =>
        s.id === action.payload.id ? { ...s, ...action.payload.data } : s
      );
      return {
        ...state,
        signals: updated,
        activeSignals: updated.filter((s) => s.status === 'active'),
      };
    }
    case 'REMOVE_SIGNAL':
      return {
        ...state,
        signals: state.signals.filter((s) => s.id !== action.payload),
        activeSignals: state.activeSignals.filter((s) => s.id !== action.payload),
      };
    case 'SET_FILTERED':
      return {
        ...state,
        filteredSignals: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Custom Hooks for Context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useMarket = () => {
  const context = React.useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within MarketProvider');
  }
  return context;
};

export const useSignals = () => {
  const context = React.useContext(SignalContext);
  if (!context) {
    throw new Error('useSignals must be used within SignalProvider');
  }
  return context;
};
