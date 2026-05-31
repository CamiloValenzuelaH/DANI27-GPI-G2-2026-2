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

  const documentText = await extractTextFromFile(filePath, 100000);
  const normalizedText = documentText.trim();
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

    const analysis = await analyzeChunkWithAI({
      documentText: normalizedText.slice(0, 16000),
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
