import { getAssessmentProgress, saveAssessmentProgress } from '../../api/audit';

// storage abstraction: sincroniza con backend y usa localStorage si falla
type ProgressPayload = any;

const KEY = 'assessment-progress-v1';

export async function saveProgressLocal(payload: ProgressPayload) {
  try {
    await saveAssessmentProgress({ payload });
    localStorage.setItem(KEY, JSON.stringify(payload));
    return;
  } catch (e) {
    // fallthrough a local storage
  }

  try {
    // próbalo con localForage si está disponible
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lf = (globalThis as any).localforage;
    if (lf && lf.setItem) {
      await lf.setItem(KEY, payload);
      return;
    }
  } catch (e) {
    // fallthrough
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('No se pudo guardar progreso localmente', e);
  }
}

export async function loadProgressLocal(): Promise<ProgressPayload | null> {
  try {
    const remote = await getAssessmentProgress();
    if (remote?.payload && Object.keys(remote.payload).length > 0) {
      localStorage.setItem(KEY, JSON.stringify(remote.payload));
      return remote.payload;
    }
  } catch (e) {
    // fallthrough
  }

  try {
    const lf = (globalThis as any).localforage;
    if (lf && lf.getItem) {
      return await lf.getItem(KEY);
    }
  } catch (e) {
    // fallthrough
  }

  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('No se pudo leer progreso localmente', e);
    return null;
  }
}
