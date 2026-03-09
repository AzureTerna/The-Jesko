import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Pakai service role biar bisa bypass RLS
);

export default async function handler(req, res) {
  const { action, amount, key, user = 'azreal' } = req.query;

  if (key !== 'SIGMA6767') return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    // --- MODE CEK SALDO ---
    if (!action) {
      let { data, error } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_name', user)
        .single();

      // Kalau tabel belum ada atau user belum ada, kita buatkan otomatis
      if (error && error.code === 'PGRST116') { 
         // Buat user default jika tidak ditemukan
         const { data: newUser } = await supabase
          .from('accounts')
          .insert([{ user_name: user, balance: 5000000 }])
          .select()
          .single();
         return res.status(200).json({ balance: newUser.balance, note: "User Created" });
      }
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ balance: data.balance });
    }

    // --- MODE TRANSAKSI (ISI/TARIK) ---
    const val = parseInt(amount);
    const { data: current } = await supabase.from('accounts').select('balance').eq('user_name', user).single();
    
    let newBalance = action === 'isi' ? current.balance + val : current.balance - val;
    if (newBalance < 0) return res.status(400).json({ error: 'SALDO_LIMIT' });

    await supabase.from('accounts').update({ balance: newBalance }).eq('user_name', user);

    return res.status(200).json({ balance: newBalance });

  } catch (error) {
    return res.status(500).json({ error: "Table might not exist. Create 'accounts' table in Supabase Dashboard UI." });
  }
}
