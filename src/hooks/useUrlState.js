import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState(defaults = {}) {
  const [params, setParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  const stableDefaults = defaultsRef.current;
  const state = { ...stableDefaults, ...Object.fromEntries(params.entries()) };
  const update = useCallback(
    (patch, replace = true) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(patch).forEach(([key, value]) => {
            if (
              value === undefined ||
              value === null ||
              value === '' ||
              value === stableDefaults[key]
            )
              next.delete(key);
            else next.set(key, String(value));
          });
          return next;
        },
        { replace }
      );
    },
    [setParams, stableDefaults]
  );
  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);
  return [state, update, reset];
}
