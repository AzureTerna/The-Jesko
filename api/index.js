import pg from 'pg';
const { Pool } = pg;

// Pake NON_POOLING biar gak 'fetch failed' lewat proxy Vercel
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const { key, user = 'azreal' } = req.query;
  if (key !== '6767Sigma') return res.status(401).json({ error: 'WRONG_KEY' });

  try {
    const client = await pool.connect();
    
    // Test Query
    const { rows } = await client.query('SELECT balance FROM accounts WHERE user_name = $1', [user]);
    
    if (rows.length === 0) {
      await client.query('INSERT INTO accounts (user_name, balance) VALUES ($1, 5000000) ON CONFLICT DO NOTHING', [user]);
      client.release();
      return res.status(200).json({ balance: 5000000 });
    }

    client.release();
    return res.status(200).json({ balance: Number(rows[0].balance) });
  } catch (error) {
    return res.status(500).json({ 
      error: "DIRECT_CONNECT_FAIL", 
      message: error.message 
    });
  }
}
