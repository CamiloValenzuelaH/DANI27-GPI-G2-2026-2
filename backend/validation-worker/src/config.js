const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379/0',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password1234@db:5432/dani27001',
  embeddingsApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  validationModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  isoChunksTable: process.env.ISO_CHUNKS_TABLE || 'iso_27001_chunks',
  validationJobsDir: process.env.VALIDATION_JOBS_DIR || '/shared/validation_jobs',
  queueName: process.env.VALIDATION_QUEUE_NAME || 'iso-validation',
  port: Number(process.env.VALIDATION_WORKER_PORT || 3001),
};
