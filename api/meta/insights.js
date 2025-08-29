import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, META_AD_ACCOUNT_ID } = process.env;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Son erişim token’ını al
    const { data: rows, error } = await supabase
      .from("integrations")
      .select("access_token_encrypted")
      .eq("provider", "meta")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !rows?.length) return res.status(400).json({ error: "no_token" });

    const access_token = rows[0].access_token_encrypted;

    // Dün–bugün için basit istatistik
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0,10);
    const until = new Date().toISOString().slice(0,10);

    const url = `https://graph.facebook.com/v20.0/${META_AD_ACCOUNT_ID}/insights` +
      `?fields=campaign_name,impressions,clicks,spend` +
      `&time_range[since]=${since}&time_range[until]=${until}` +
      `&access_token=${encodeURIComponent(access_token)}`;

    const r = await fetch(url);
    const j = await r.json();
    if (!r.ok) return res.status(400).json({ step: "insights_failed", j });

    // İstersen Supabase'e yaz
    // await supabase.from("reports_daily").insert(j.data.map(x => ({ ...x })));

    return res.status(200).json({ ok: true, rows: j.data?.length || 0, data: j.data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
