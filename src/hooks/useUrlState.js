import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState(defaults = {}) {
  const [params, setParams] = useSearchParams();
  const state = { ...defaults, ...Object.fromEntries(params.entries()) };
  const update = useCallback((patch, replace = true) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === defaults[key]) next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    }, { replace });
  }, [defaults, setParams]);
  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);
  return [state, update, reset];
}
