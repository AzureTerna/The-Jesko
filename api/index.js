import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_ASLI_AZREAL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal', target } = req.query;

  // Security Gate
  if (key !== '6767Sigma') return res.status(401).json({ error: 'WRONG_KEY' });

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Mulai Transaksi biar gak korupsi data

    // 1. CEK USER UTAMA
    const userRes = await client.query('SELECT balance FROM accounts WHERE user_name = $1', [user]);
    if (userRes.rows.length === 0) throw new Error('USER_NOT_FOUND');
    let myBalance = BigInt(userRes.rows[0].balance);
    const val = amount ? BigInt(amount) : 0n;

    // 2. LOGIC ACTION
    if (action === 'isi') {
      myBalance += val;
      await client.query('UPDATE accounts SET balance = $1 WHERE user_name = $2', [myBalance.toString(), user]);
    } 
    
    else if (action === 'tarik') {
      if (myBalance < val) throw new Error('INSUFFICIENT_FUNDS');
      myBalance -= val;
      await client.query('UPDATE accounts SET balance = $1 WHERE user_name = $2', [myBalance.toString(), user]);
    } 
    
    else if (action === 'transfer') {
      if (!target) throw new Error('TARGET_REQUIRED');
      if (myBalance < val) throw new Error('INSUFFICIENT_FUNDS');
      
      // Kurangi saldo pengirim
      myBalance -= val;
      await client.query('UPDATE accounts SET balance = $1 WHERE user_name = $2', [myBalance.toString(), user]);
      
      // Tambah saldo penerima (Auto-create jika target belum ada)
      await client.query(`
        INSERT INTO accounts (user_name, balance) VALUES ($1, $2) 
        ON CONFLICT (user_name) DO UPDATE SET balance = accounts.balance + EXCLUDED.balance
      `, [target, val.toString()]);
    }

    await client.query('COMMIT'); // Simpan Permanen
    return res.status(200).json({ 
      status: 'SUCCESS',
      user: user,
      balance: myBalance.toString(),
      action: action || 'check'
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Batalkan jika error biar saldo gak ilang misterius
    return res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
}
