const Redis = require('ioredis');
const { redisUrl } = require('./config');

const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
const JOB_KEY_PREFIX = 'validation:job:';
const JOB_TTL_SECONDS = 60 * 60 * 24 * 7;

const jobKey = (jobId) => `${JOB_KEY_PREFIX}${jobId}`;

async function writeJobState(jobId, fields) {
  const now = new Date().toISOString();
  const payload = {
    updated_at: now,
    ...fields,
  };

  const entries = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)])
  );

  await redis.hset(jobKey(jobId), entries);
  await redis.expire(jobKey(jobId), JOB_TTL_SECONDS);
}

async function readJobState(jobId) {
  return redis.hgetall(jobKey(jobId));
}

async function publishProgress(jobId, fields) {
  await writeJobState(jobId, fields);
}

module.exports = {
  redis,
  writeJobState,
  readJobState,
  publishProgress,
  jobKey,
};
