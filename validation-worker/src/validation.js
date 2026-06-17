const { extractTextFromFile } = require('./extract');
const { generateEmbedding, analyzeChunkWithAI } = require('./ai');
const { getTopIsoChunks } = require('./db');
const { publishProgress } = require('./state');

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
}

function summarizeResults(results) {
  if (!results.length) {
    return 'No se encontraron fragmentos relevantes para validar.';
  }

  const average = clampScore(results.reduce((sum, item) => sum + item.compliance_score, 0) / results.length);
  const criticalCount = results.reduce((count, item) => count + item.observations.filter((obs) => obs.severity === 'critical').length, 0);
  const majorCount = results.reduce((count, item) => count + item.observations.filter((obs) => obs.severity === 'major').length, 0);
  return `Validación granular completada sobre ${results.length} fragmentos ISO. Score promedio ${average}. Hallazgos críticos: ${criticalCount}. Hallazgos mayores: ${majorCount}.`;
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function buildDocumentContext(documentText, chunk, maxChars = 12000) {
  const fullText = String(documentText || '');
  if (fullText.length <= maxChars) {
    return fullText;
  }

  const terms = [];
  if (chunk?.clause_ref) {
    terms.push(chunk.clause_ref);
  }
  if (chunk?.title) {
    terms.push(chunk.title);
  }
  if (chunk?.content) {
    terms.push(...String(chunk.content).split(/\s+/).filter((token) => token.length > 4));
  }

  const uniqueTerms = [...new Set(terms.map((term) => String(term).trim()).filter(Boolean))];
  const snippets = [];
  const addSnippet = (index, radius = 1200) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(fullText.length, index + radius);
    snippets.push(fullText.slice(start, end));
  };

  for (const term of uniqueTerms.slice(0, 15)) {
    const normalizedTerm = term.replace(/[^a-zA-Z0-9]/g, ' ').trim();
    if (!normalizedTerm) continue;
    const idx = fullText.toLowerCase().indexOf(normalizedTerm.toLowerCase());
    if (idx !== -1) {
      addSnippet(idx);
      if (snippets.join('').length >= maxChars - 2000) {
        break;
      }
    }
  }

  if (snippets.length === 0) {
    snippets.push(fullText.slice(0, 3000));
    snippets.push(fullText.slice(-3000));
  }

  const preview = [
    '--- Inicio del documento ---',
    snippets[0],
  ];
  for (let i = 1; i < snippets.length; i += 1) {
    preview.push('--- Fragmento relevante ---');
    preview.push(snippets[i]);
  }
  const combined = preview.join('\n\n');
  return combined.length <= maxChars ? combined : combined.slice(0, maxChars);
}

async function runValidationJob(jobData) {
  const { job_id: jobId, file_path: filePath, file_name: fileName, organization_id: organizationId, user_id: userId } = jobData;

  await publishProgress(jobId, {
    job_id: jobId,
    status: 'processing',
    progress: 3,
    message: 'Extrayendo texto del documento',
    organization_id: organizationId,
    user_id: userId,
    file_name: fileName,
    file_path: filePath,
    total_chunks: 0,
    overall_score: '',
    findings: [],
    summary: '',
    error: '',
  });

  const documentText = await extractTextFromFile(filePath);
  const normalizedText = normalizeText(documentText);
  if (normalizedText.length < 20) {
    throw new Error('No se pudo extraer suficiente texto del documento');
  }

  await publishProgress(jobId, {
    status: 'processing',
    progress: 15,
    message: 'Generando embedding del documento',
  });

  const embedding = await generateEmbedding(normalizedText);

  await publishProgress(jobId, {
    status: 'processing',
    progress: 30,
    message: 'Buscando fragmentos ISO relevantes con pgvector',
  });

  const chunks = await getTopIsoChunks(embedding, 5);
  const findings = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const progress = 30 + Math.round(((index + 1) / Math.max(chunks.length, 1)) * 60);

    await publishProgress(jobId, {
      status: 'processing',
      progress,
      message: `Comparando contra ${chunk.clause_ref}`,
      total_chunks: chunks.length,
    });

    const snippet = buildDocumentContext(normalizedText, chunk, 12000);
    if (!snippet) {
      findings.push({
        clause_ref: chunk.clause_ref,
        title: chunk.title,
        relevance_score: Number(chunk.relevance_score ?? 0),
        compliance_score: 0,
        observations: [
          {
            severity: 'major',
            text: `No se encontró un fragmento relevante en el documento para el control ${chunk.clause_ref}.`, 
          },
        ],
        suggestions: [
          'No hay suficiente texto recuperado para validar este control sin inventar información.',
        ],
      });
      continue;
    }

    const analysis = await analyzeChunkWithAI({
      documentText: snippet,
      chunk,
    });

    findings.push({
      clause_ref: chunk.clause_ref,
      title: chunk.title,
      relevance_score: Number(chunk.relevance_score ?? 0),
      compliance_score: analysis.score,
      observations: analysis.observations,
      suggestions: analysis.suggestions,
    });
  }

  const overallScore = findings.length
    ? clampScore(findings.reduce((sum, item) => sum + item.compliance_score, 0) / findings.length)
    : 0;

  const summary = summarizeResults(findings);

  await publishProgress(jobId, {
    job_id: jobId,
    status: 'completed',
    progress: 100,
    message: 'Validación completada',
    organization_id: organizationId,
    user_id: userId,
    file_name: fileName,
    file_path: filePath,
    total_chunks: chunks.length,
    overall_score: overallScore,
    findings,
    summary,
    error: '',
  });

  return {
    job_id: jobId,
    status: 'completed',
    overall_score: overallScore,
    findings,
    summary,
  };
}

module.exports = {
  runValidationJob,
};
