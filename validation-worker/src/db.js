const { Client } = require('pg');
const { databaseUrl, isoChunksTable } = require('./config');

async function getTopIsoChunks(embedding, limit = 5) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const vectorLiteral = `[${embedding.map((value) => Number(value).toFixed(7)).join(',')}]`;
    const sql = `
      SELECT
        id,
        clause_ref,
        title,
        content,
        1 - (embedding <=> $1::vector) AS relevance_score
      FROM ${isoChunksTable}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;

    const result = await client.query(sql, [vectorLiteral, limit]);
    return result.rows;
  } finally {
    await client.end();
  }
}

module.exports = {
  getTopIsoChunks,
};
