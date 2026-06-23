import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { subscribeExternalValidationJob } from '../../api/externalValidation';

type ActiveJob = {
  jobId: string;
  status: string;
  progress: number;
  result: any | null;
};

type ValidationJobContextValue = {
  activeJob: ActiveJob | null;
  subscribe: (jobId: string) => Promise<void>;
  unsubscribe: () => void;
};

const ValidationJobContext = createContext<ValidationJobContextValue | undefined>(undefined);

export const useValidationJob = (): ValidationJobContextValue => {
  const ctx = useContext(ValidationJobContext);
  if (!ctx) throw new Error('useValidationJob must be used within ValidationJobProvider');
  return ctx;
};

export const ValidationJobProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(() => {
    try {
      const raw = sessionStorage.getItem('lastValidationJob');
      return raw ? (JSON.parse(raw) as ActiveJob) : null;
    } catch {
      return null;
    }
  });

  const sseRef = useRef<EventSource | null>(null);
  const currentJobRef = useRef<string | null>(null);

  const persistActiveJob = (job: ActiveJob | null) => {
    try {
      if (job) sessionStorage.setItem('lastValidationJob', JSON.stringify(job));
      else sessionStorage.removeItem('lastValidationJob');
    } catch {
      // ignore storage errors
    }
  };

  const subscribe = async (jobId: string) => {
    if (currentJobRef.current === jobId) return;
    unsubscribe();
    currentJobRef.current = jobId;

    // initialize activeJob if not present or different
    setActiveJob((prev) => {
      if (prev && prev.jobId === jobId) return prev;
      const init: ActiveJob = { jobId, status: 'queued', progress: 0, result: null };
      return init;
    });

    try {
      const source = await subscribeExternalValidationJob(jobId, {
        onProgress: (data) => {
          setActiveJob((prev) => {
            const next: ActiveJob = {
              jobId,
              status: data.status ?? (prev?.status ?? 'processing'),
              progress: typeof data.progress === 'number' ? data.progress : (prev?.progress ?? 0),
              result: prev?.result ?? null,
            };
            return next;
          });
        },
        onDone: (data) => {
          const final: ActiveJob = {
            jobId,
            status: 'completed',
            progress: 100,
            result: data,
          };
          setActiveJob(final);
          persistActiveJob(final);
        },
        onError: (message) => {
          console.error('Validation stream error:', message);
        },
      });

      sseRef.current = source;
    } catch (error) {
      console.error('Could not subscribe to validation job events', error);
    }
  };

  const unsubscribe = () => {
    currentJobRef.current = null;
    if (sseRef.current) {
      try { sseRef.current.close(); } catch {}
      sseRef.current = null;
    }
  };

  useEffect(() => {
    // cleanup on unmount
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ValidationJobContext.Provider value={{ activeJob, subscribe, unsubscribe }}>
      {children}
    </ValidationJobContext.Provider>
  );
};

export default ValidationJobContext;
