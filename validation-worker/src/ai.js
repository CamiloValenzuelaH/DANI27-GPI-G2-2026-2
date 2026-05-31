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