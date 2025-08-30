import { createClient } from "@supabase/supabase-js";
import { withCORS } from "../_cors.js"; // _cors.js, api/ klasörünün altında

export default withCORS(async (req, res) => {
  try {
    // 1) email parametresi şart (şimdilik test için)
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ ok: false, error: "missing_email" });
    }

    // 2) Supabase client
    const supa = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // 3) Bu kullanıcıya ait Meta hesaplarını çek
    const { data, error } = await supa
      .from("integrations")
      .select("account_id, account_name")
      .eq("provider", "meta")
      .eq("user_email", email)
      .order("account_name", { ascending: true });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    // 4) Listeyi döndür
    return res.status(200).json({ ok: true, accounts: data || [] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});
