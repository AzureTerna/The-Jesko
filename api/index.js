import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal' } = req.query;

  // Samakan Key dengan yang di HTML
  if (key !== '6767Sigma') return res.status(401).json({ error: 'WRONG_KEY' });

  try {
    // BOOTSTRAP: Pastikan Tabel & Data Awal Ada
    await sql`CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, user_name VARCHAR(50) UNIQUE, balance BIGINT NOT NULL);`;
    await sql`INSERT INTO accounts (user_name, balance) VALUES ('azreal', 5000000) ON CONFLICT (user_name) DO NOTHING;`;

    // 1. AMBIL DATA
    const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
    let currentBalance = Number(rows[0].balance);

    // 2. TRANSAKSI (OPSIONAL)
    if (action === 'isi' || action === 'tarik') {
      const val = parseInt(amount);
      if (action === 'isi') {
        const update = await sql`UPDATE accounts SET balance = balance + ${val} WHERE user_name = ${user} RETURNING balance;`;
        currentBalance = Number(update.rows[0].balance);
      } else if (action === 'tarik') {
        if (currentBalance < val) return res.status(400).json({ error: 'SALDO_LIMIT' });
        const update = await sql`UPDATE accounts SET balance = balance - ${val} WHERE user_name = ${user} RETURNING balance;`;
        currentBalance = Number(update.rows[0].balance);
      }
    }

    return res.status(200).json({ balance: currentBalance });

  } catch (error) {
    return res.status(500).json({ error: 'DATABASE_ERROR', details: error.message });
  }
}
