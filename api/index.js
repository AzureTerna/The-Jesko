import pg from 'pg';
const { Pool } = pg;

// KITA PAKSA KONFIGURASI SSL DI LUAR OBJECT POOL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});

export default async function handler(req, res) {
  const { key, user = 'azreal' } = req.query;

  if (key !== '6767Sigma') return res.status(401).json({ error: 'WRONG_KEY' });

  try {
    // Pake client langsung biar lebih stabil pas handshake
    const client = await pool.connect();
    
    try {
      const { rows } = await client.query('SELECT balance FROM accounts WHERE user_name = $1', [user]);
      
      if (rows.length === 0) {
        // Emergency Insert jika data hilang
        await client.query('INSERT INTO accounts (user_name, balance) VALUES ($1, 5000000) ON CONFLICT DO NOTHING', [user]);
        return res.status(200).json({ balance: 5000000 });
      }

      return res.status(200).json({ balance: Number(rows[0].balance) });
    } finally {
      // WAJIB: Lepas koneksi biar pool gak penuh
      client.release();
    }
  } catch (error) {
    return res.status(500).json({ 
      error: "SHAKEHAND_FAIL_V3", 
      message: error.message,
      hint: "Coba ganti POSTGRES_URL di Vercel Settings pakai yang '?sslmode=require' di ujungnya"
    });
  }
}
