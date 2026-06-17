<<<<<<< HEAD
import { useEffect, useRef } from 'react';

export default function useAutosave(callback: () => Promise<void> | void, delay = 2000, deps: any[] = []) {
  const timer = useRef<number | null>(null);
  const running = useRef(false);

  useEffect(() => {
    running.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      Promise.resolve(callback()).finally(() => {
        // noop
      });
    }, delay);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      running.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
}
=======
import { useEffect, useRef } from 'react';

export default function useAutosave(callback: () => Promise<void> | void, delay = 2000, deps: any[] = []) {
  const timer = useRef<number | null>(null);
  const running = useRef(false);

  useEffect(() => {
    running.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      Promise.resolve(callback()).finally(() => {
        // noop
      });
    }, delay);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      running.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
}
>>>>>>> Chat-bot
