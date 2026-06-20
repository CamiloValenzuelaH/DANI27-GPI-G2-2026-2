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

async function getChunksByClauseRefs(clauseRefs) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const placeholders = clauseRefs.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
      SELECT id, clause_ref, title, content
      FROM ${isoChunksTable}
      WHERE clause_ref = ANY(ARRAY[${placeholders}])
      ORDER BY clause_ref
    `;
    const result = await client.query(sql, clauseRefs);
    return result.rows.map(row => ({
      ...row,
      relevance_score: 1.0,
    }));
  } finally {
    await client.end();
  }
}

module.exports = { getTopIsoChunks, getChunksByClauseRefs };
