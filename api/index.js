import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal' } = req.query;

  // Cek Key
  if (key !== '6767Sigma') {
    return res.status(401).json({ error: 'UNAUTHORIZED_KEY' });
  }

  try {
    // 1. GET DATA
    const { rows } = await sql`SELECT balance FROM accounts WHERE user_name = ${user};`;
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    let currentBalance = Number(rows[0].balance);

    // 2. TRANSACTION LOGIC
    if (action === 'isi' || action === 'tarik') {
      const val = parseInt(amount);
      if (isNaN(val)) return res.status(400).json({ error: 'INVALID_AMOUNT' });

      if (action === 'isi') {
        const update = await sql`UPDATE accounts SET balance = balance + ${val} WHERE user_name = ${user} RETURNING balance;`;
        currentBalance = Number(update.rows[0].balance);
      } else if (action === 'tarik') {
        if (currentBalance < val) return res.status(400).json({ error: 'INSUFFICIENT_FUNDS' });
        const update = await sql`UPDATE accounts SET balance = balance - ${val} WHERE user_name = ${user} RETURNING balance;`;
        currentBalance = Number(update.rows[0].balance);
      }
    }

    return res.status(200).json({ balance: currentBalance });

  } catch (error) {
    // Ini biar lu tau persis apa yang bikin Error 500
    console.error("Database Error:", error);
    return res.status(500).json({ error: error.message, detail: "Pastikan Storage sudah di-CONNECT di Dashboard Vercel" });
  }
}
