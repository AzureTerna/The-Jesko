import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_ASLI_AZREAL, // PAKAI NAMA BARU TADI!
  ssl: {
    rejectUnauthorized: false,
  }
});

export default async function handler(req, res) {
  const { key, user = 'azreal' } = req.query;
  if (key !== '6767Sigma') return res.status(401).json({ error: 'WRONG_KEY' });

  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query('SELECT balance FROM accounts WHERE user_name = $1', [user]);
      if (rows.length === 0) {
        await client.query('INSERT INTO accounts (user_name, balance) VALUES ($1, 5000000) ON CONFLICT DO NOTHING', [user]);
        return res.status(200).json({ balance: 5000000 });
      }
      return res.status(200).json({ balance: Number(rows[0].balance) });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({ 
      error: "BYPASS_FAIL_V4", 
      message: error.message 
    });
  }
}
