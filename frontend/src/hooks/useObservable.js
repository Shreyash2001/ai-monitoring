import { useState, useEffect } from 'react';

/**
 * Subscribes a React component to an RxJS Observable/Subject.
 * Automatically unsubscribes on unmount.
 *
 * @param {Observable} observable$ - Any RxJS Observable or Subject
 * @param {*} initialValue - Value to use before the first emission
 * @returns {[*, Error|null]} [latestValue, error]
 */
export function useObservable(observable$, initialValue = null) {
  const [value, setValue] = useState(() => {
    // BehaviorSubjects expose getValue() — use it to avoid the first-render flash
    if (observable$ && typeof observable$.getValue === 'function') {
      return observable$.getValue() ?? initialValue;
    }
    return initialValue;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!observable$) return;

    const subscription = observable$.subscribe({
      next: (val) => setValue(val),
      error: (err) => setError(err instanceof Error ? err : new Error(String(err))),
    });

    return () => subscription.unsubscribe();
  }, [observable$]);

  return [value, error];
}
