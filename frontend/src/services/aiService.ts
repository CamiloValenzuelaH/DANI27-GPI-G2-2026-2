console.log("DEBUG: Sistema de entorno cargado");

// Leemos la key de Vite
const API_KEY = import.meta.env.VITE_DEEPSEEK_KEY;
console.log("DEBUG: ¿VITE_DEEPSEEK_KEY detectada?:", !!API_KEY);

export class MissingDeepSeekKeyError extends Error {
  constructor() {
    super("Falta la API Key de DeepSeek en .env.local");
    this.name = "MissingDeepSeekKeyError";
  }
}

export const isMissingDeepSeekKeyError = (err: unknown): err is MissingDeepSeekKeyError => {
  return err instanceof MissingDeepSeekKeyError || (err instanceof Error && err.name === "MissingDeepSeekKeyError");
};

export interface AuditResponse {
  veredicto: "CUMPLE" | "NO CUMPLE";
  justificacion: string;
  accionCorrectiva: string;
}

const cleanModelJson = (raw: string): string => {
  const trimmed = raw.trim();

  // Limpieza de Markdown por si la IA se pone creativa
  const withoutFences = trimmed.replace(/```(?:json)?|```/gi, "").trim();

  // Si viene con texto extra, intento quedarme con el primer objeto JSON.
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start >= 0 && end > start) return withoutFences.slice(start, end + 1).trim();

  return withoutFences;
};

const isModelNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    (msg.includes("404") || msg.includes("not found") || msg.includes("model_not_found")) &&
    msg.includes("model")
  );
};

const isQuotaError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota");
};

export const runDoubleAgentAudit = async (evidencia: string): Promise<AuditResponse> => {
  if (!API_KEY) throw new MissingDeepSeekKeyError();

  const apiBase = "https://api.deepseek.com";
  const modelsToTry = ["deepseek-chat", "deepseek-reasoner"];

  // UNIFICAMOS LOS DOS AGENTES EN UN SOLO PROMPT PARA AHORRAR CRÉDITOS (Evita el error 429)
  const prompt = `
SISTEMA DANI27 - AUDITORÍA ISO 27001

EVIDENCIA A ANALIZAR: "${evidencia}"

TAREA:
1. Actúa como Agente Auditor: Evalúa si la evidencia cumple con que los servidores deben estar en racks cerrados y áreas restringidas.
2. Actúa como Agente Validador: Revisa el análisis anterior y genera un veredicto final.

REQUISITO TÉCNICO: Responde ÚNICAMENTE en formato JSON con esta estructura:
{
  "veredicto": "CUMPLE" o "NO CUMPLE",
  "justificacion": "Explicación breve",
  "accionCorrectiva": "Qué hacer para mejorar"
}
`;

  try {
    let lastError: unknown;
    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(`${apiBase}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: "Responde solo JSON valido, sin markdown ni texto extra." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            top_p: 0.8,
            max_tokens: 1200,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        const responseText = result?.choices?.[0]?.message?.content ?? result?.choices?.[0]?.text ?? "";
        const cleanJson = cleanModelJson(String(responseText));
        return JSON.parse(cleanJson) as AuditResponse;
      } catch (error) {
        lastError = error;
        // Si el modelo no existe (404) o hay cuota (429), intentamos el siguiente.
        if (isModelNotFoundError(error) || isQuotaError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  } catch (error: unknown) {
    console.error("Error en DANI27:", error);
    throw error;
  }
};
