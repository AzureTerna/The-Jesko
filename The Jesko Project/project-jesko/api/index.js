import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal' } = req.query;

  // Security Gate
  if (key !== 'SIGMA6767') return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    // 1. GET BALANCE
    if (!action) {
      const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
      return res.status(200).json({ balance: rows[0].balance });
    }

    // 2. TRANSACTION LOGIC (ISI / TARIK)
    const val = parseInt(amount);
    if (isNaN(val)) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    if (action === 'isi') {
      await sql`UPDATE accounts SET balance = balance + ${val} WHERE user_name = ${user};`;
      await sql`INSERT INTO transactions (type, amount, user_target) VALUES ('ISI', ${val}, ${user});`;
    } 
    else if (action === 'tarik') {
      const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
      if (rows[0].balance < val) return res.status(400).json({ error: 'INSUFFICIENT_FUNDS' });
      
      await sql`UPDATE accounts SET balance = balance - ${val} WHERE user_name = ${user};`;
      await sql`INSERT INTO transactions (type, amount, user_target) VALUES ('TARIK', ${val}, ${user});`;
    }

    const result = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
    return res.status(200).json({ balance: result.rows[0].balance });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
