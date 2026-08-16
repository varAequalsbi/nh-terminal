// src/hooks/index.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { signalService } from '../services/signalService';
import { marketService } from '../services/marketService';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';

// useAuth Hook
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(setError)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return { user, isLoading, error, login, logout };
};

// useSignals Hook
export const useSignals = (filters = {}) => {
  const [signals, setSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setIsLoading(true);
        const data = await signalService.getAllSignals(filters);
        setSignals(data.signals || []);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
  }, [JSON.stringify(filters)]);

  const createSignal = useCallback(async (signalData) => {
    try {
      const newSignal = await signalService.createSignal(signalData);
      setSignals((prev) => [newSignal, ...prev]);
      return newSignal;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return { signals, isLoading, error, createSignal };
};

// useMarketData Hook
export const useMarketData = (pair = 'XAUUSD') => {
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const data = await marketService.getCurrentPrice(pair);
        setPriceData(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Connect WebSocket for real-time updates
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (wsUrl) {
      wsRef.current = new WebSocket(`${wsUrl}?pair=${pair}`);

      wsRef.current.onmessage = (event) => {
        try {
          const updated = JSON.parse(event.data);
          setPriceData((prev) => ({ ...prev, ...updated }));
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError(err);
      };
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [pair]);

  return { priceData, isLoading, error };
};

// useCommunity Hook
export const useCommunity = (section = 'forum') => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let response;

        if (section === 'forum') {
          response = await communityService.getForumPosts();
        } else if (section === 'announcements') {
          response = await communityService.getAnnouncements();
        } else if (section === 'live-trade') {
          response = await communityService.getLiveTradeMessages();
        }

        setData(response || []);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [section]);

  return { data, isLoading, error, setData };
};

// useFetch Hook (Generic)
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, dependencies);

  return { data, isLoading, error };
};

// useDebounce Hook
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// usePagination Hook
export const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

// useLocalStorage Hook
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// useAsync Hook
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
};
