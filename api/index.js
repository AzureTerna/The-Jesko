import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal' } = req.query;

  // Security Gate (Sesuaikan dengan URL lu)
  if (key !== 'SIGMA6767' && key !== '6767Sigma') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  try {
    // BOOTSTRAP: Pastikan tabel ada dan ada isinya
    await sql`CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, user_name VARCHAR(50) UNIQUE, balance BIGINT NOT NULL);`;
    await sql`INSERT INTO accounts (user_name, balance) VALUES ('azreal', 5000000) ON CONFLICT (user_name) DO NOTHING;`;

    // 1. CEK SALDO
    if (!action) {
      const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
      return res.status(200).json({ balance: Number(rows[0].balance) });
    }

    // 2. TRANSAKSI
    const val = parseInt(amount);
    if (isNaN(val)) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    if (action === 'isi') {
      await sql`UPDATE accounts SET balance = balance + ${val} WHERE user_name = ${user};`;
    } else if (action === 'tarik') {
      const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
      if (rows[0].balance < val) return res.status(400).json({ error: 'INSUFFICIENT_FUNDS' });
      await sql`UPDATE accounts SET balance = balance - ${val} WHERE user_name = ${user};`;
    }

    const result = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
    return res.status(200).json({ balance: Number(result.rows[0].balance) });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
