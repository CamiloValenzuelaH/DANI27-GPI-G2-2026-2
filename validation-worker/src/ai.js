const { embeddingsApiKey, embeddingModel, validationModel, deepseekApiKey, deepseekBaseUrl } = require('./config');

const apiBase = 'https://generativelanguage.googleapis.com/v1beta';

function ensureApiKey() {
  if (!embeddingsApiKey) {
    throw new Error('Falta la clave de embeddings (GEMINI_API_KEY o GOOGLE_API_KEY)');
  }
}

function vectorToString(values) {
  return `[${values.map((value) => Number(value).toFixed(7)).join(',')}]`;
}

async function generateEmbedding(text) {
  ensureApiKey();

  const response = await fetch(`${apiBase}/models/${embeddingModel}:embedContent?key=${embeddingsApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: {
        parts: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error generando embedding: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const embedding = payload.embedding || payload.embeddings?.[0]?.embedding || {};
  const values = embedding.values || embedding.value || payload.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('La respuesta de embeddings no incluye valores');
  }

  return values.map(Number);
}

function buildValidationPrompt({ documentText, chunk }) {
  return [
    'Eres un auditor ISO 27001:2022. Evalúa si el fragmento del documento contiene evidencia del control ISO indicado.',
    '',
    'CRITERIO DE SCORING:',
    '- 100: el documento contiene el control con todos sus datos (estado, madurez, riesgo, responsable) Y evidencia documental adicional (políticas, procedimientos, registros).',
    "- 60-80: el documento menciona el control con sus datos básicos (estado, madurez, riesgo, responsable) pero sin evidencia documental adjunta. Esto es VÁLIDO para informes de evaluación.",
    '- 20-50: el control aparece mencionado pero le faltan datos básicos (falta estado, madurez, riesgo o responsable).',
    '- 0-10: el control no aparece en el documento o no hay información relevante.',
    '',
    'IMPORTANTE: un informe de evaluación de controles que lista estado, madurez, riesgo y responsable es evidencia válida. No exijas políticas, organigramas ni registros si el documento es un informe resumen.',
    '',
    'REGLA DE CLASIFICACIÓN:',
    '- Si el control aparece en el documento con estado de implementación (aunque sea solo una fila de tabla), el score mínimo es 20 y debe calificarse como INCOMPLETO, no INEXISTENTE.',
    '- INEXISTENTE solo si el clause_ref no aparece en ninguna parte del texto recuperado.',
    '- Un informe de evaluación que lista el control con estado, madurez, riesgo y responsable es evidencia válida parcial — no exijas el procedimiento completo para evitar INEXISTENTE.',
    '',
    'Retorna solo JSON válido con este esquema:',
    '{',
    '  "score": 0-100,',
    '  "observations": [{"severity":"critical|major|minor","text":"..."}],',
    '  "suggestions": ["..."]',
    '}',
    '',
    `Requisito ISO [${chunk.clause_ref}] ${chunk.title}:`,
    chunk.content,
    '',
    'Fragmento del documento:',
    documentText,
  ].join('\n');
}

async function analyzeChunkWithAI({ documentText, chunk }) {
  if (!deepseekApiKey) {
    throw new Error('Falta DEEPSEEK_API_KEY');
  }

  const baseUrl = deepseekBaseUrl.endsWith('/') ? deepseekBaseUrl.slice(0, -1) : deepseekBaseUrl;
  const payload = {
    model: validationModel,
    messages: [
      { role: 'system', content: 'Responde solo JSON válido, sin markdown ni texto extra.' },
      { role: 'user', content: buildValidationPrompt({ documentText, chunk }) },
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 1200,
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en DeepSeek: ${response.status} ${await response.text()}`);
  }

  const respJson = await response.json();
  const text = respJson?.choices?.[0]?.message?.content || respJson?.choices?.[0]?.text;
  if (!text) {
    throw new Error('DeepSeek no devolvió texto');
  }

  const cleaned = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  const score = Math.max(0, Math.min(100, Number(parsed.score ?? parsed.compliance_score ?? 50)));
  const observations = Array.isArray(parsed.observations)
    ? parsed.observations
        .map((item) => ({
          severity: ['critical', 'major', 'minor'].includes(String(item.severity)) ? String(item.severity) : 'minor',
          text: String(item.text ?? item.issue ?? '').trim(),
        }))
        .filter((item) => item.text)
    : [];
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    score,
    observations,
    suggestions,
  };
}

module.exports = {
  generateEmbedding,
  analyzeChunkWithAI,
  vectorToString,
};