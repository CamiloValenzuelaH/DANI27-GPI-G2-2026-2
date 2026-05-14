const { googleApiKey, embeddingModel, validationModel } = require('./config');

const apiBase = 'https://generativelanguage.googleapis.com/v1beta';
const apiBaseContent = 'https://generativelanguage.googleapis.com/v1';

function ensureApiKey() {
  if (!googleApiKey) {
    throw new Error('Falta GEMINI_API_KEY o GOOGLE_API_KEY');
  }
}

async function generateEmbedding(text) {
  ensureApiKey();

  const response = await fetch(`${apiBase}/models/${embeddingModel}:embedContent?key=${googleApiKey}`, {
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
    'Compara este documento contra este requisito ISO específico.',
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
    'Documento:',
    documentText,
  ].join('\n');
}

async function analyzeChunkWithGemini({ documentText, chunk }) {
  ensureApiKey();

  // Construir y sanitizar generationConfig para evitar 400 por tipos inválidos
  const rawGen = {
    temperature: 0.2,
    topP: 0.9,
    maxOutputTokens: 1200,
  };

  const gen = {
    temperature: Number(rawGen.temperature) || 0.1,
    topP: Number(rawGen.topP) || 0.8,
    maxOutputTokens: Number.isFinite(Number(rawGen.maxOutputTokens)) ? parseInt(rawGen.maxOutputTokens, 10) : 1024,
  };

  const payload = {
    contents: [{ parts: [{ text: buildValidationPrompt({ documentText, chunk }) }] }],
    generationConfig: gen,
  };

  const response = await fetch(`${apiBaseContent}/models/${validationModel}:generateContent?key=${googleApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en Gemini: ${response.status} ${await response.text()}`);
  }

  const respJson = await response.json();
  const text = respJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini no devolvió texto');
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
  analyzeChunkWithGemini,
};
