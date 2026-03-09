import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal' } = req.query;

  // Gate Security
  if (key !== '6767Sigma') return res.status(401).json({ error: 'WRONG_KEY' });

  try {
    // AUTO-INIT: Bikin tabel kalau ilang & isi saldo awal
    await sql`CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, user_name VARCHAR(50) UNIQUE, balance BIGINT NOT NULL);`;
    await sql`INSERT INTO accounts (user_name, balance) VALUES ('azreal', 5000000) ON CONFLICT (user_name) DO NOTHING;`;

    // 1. GET BALANCE
    const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
    let currentBalance = Number(rows[0].balance);

    // 2. TRANSACTION
    if (action === 'isi' || action === 'tarik') {
      const val = parseInt(amount);
      if (isNaN(val)) return res.status(400).json({ error: 'INVALID_AMOUNT' });

      if (action === 'isi') {
        const update = await sql`UPDATE accounts SET balance = balance + ${val} WHERE user_name = ${user} RETURNING balance;`;
        currentBalance = Number(update.rows[0].balance);
      } else if (action === 'tarik') {
        if (currentBalance < val) return res.status(400).json({ error: 'BROKE_BOY_ERROR' });
        const update = await sql`UPDATE accounts SET balance = balance - ${val} WHERE user_name = ${user} RETURNING balance;`;
        currentBalance = Number(update.rows[0].balance);
      }
    }

    return res.status(200).json({ balance: currentBalance });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "DB_CRASH", details: error.message });
  }
}
