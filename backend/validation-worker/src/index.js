const express = require('express');
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { queueName, redisUrl, port } = require('./config');
const { runValidationJob } = require('./validation');
const { readJobState, publishProgress } = require('./state');

const app = express();
app.use(express.json({ limit: '2mb' }));

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue(queueName, { connection });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', queue: queueName });
});

app.post('/jobs/validate/external', async (req, res) => {
  const payload = req.body || {};
  if (!payload.job_id || !payload.file_path || !payload.file_name) {
    return res.status(400).json({ detail: 'payload incompleto' });
  }

  await publishProgress(payload.job_id, {
    job_id: payload.job_id,
    status: 'queued',
    progress: 0,
    message: 'Job recibido por BullMQ',
    organization_id: payload.organization_id || '',
    user_id: payload.user_id || '',
    file_name: payload.file_name,
    file_path: payload.file_path,
    total_chunks: 0,
    overall_score: '',
    findings: [],
    summary: '',
    error: '',
  });

  await queue.add('validate-external', payload, {
    jobId: payload.job_id,
    removeOnComplete: true,
    removeOnFail: false,
  });

  res.status(202).json({ job_id: payload.job_id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req, res) => {
  const state = await readJobState(req.params.jobId);
  if (!state || Object.keys(state).length === 0) {
    return res.status(404).json({ detail: 'Job no encontrado' });
  }
  return res.json(state);
});

const worker = new Worker(
  queueName,
  async (job) => runValidationJob(job.data),
  { connection, concurrency: 1 }
);

worker.on('failed', async (job, error) => {
  if (!job?.data?.job_id) return;
  await publishProgress(job.data.job_id, {
    job_id: job.data.job_id,
    status: 'failed',
    progress: 100,
    message: 'Validación fallida',
    error: error?.message || 'Error desconocido',
  });
});

app.listen(port, () => {
  console.log(`Validation worker API listening on ${port}`);
});