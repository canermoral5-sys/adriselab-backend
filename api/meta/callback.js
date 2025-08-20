import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const {
      META_APP_ID,
      META_APP_SECRET,
      META_REDIRECT_URI,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE,
      ADMIN_EMAIL
    } = process.env;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const code = req.query.code;
    if (!code) return res.status(400).send("no_code");

    // 1) short-lived token
    const t1 = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`
    ).then(r=>r.json());
    if (!t1.access_token) return res.status(400).json(t1);

    // 2) long-lived (~60 gün)
    const t2 = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${t1.access_token}`
    ).then(r=>r.json());
    if (!t2.access_token) return res.status(400).json(t2);

    // 3) Supabase'e kaydet
    await supabase.from("integrations").insert({
      user_email: ADMIN_EMAIL || "owner@adriselab.com",
      provider: "meta",
      access_token_encrypted: t2.access_token,
      expires_at: new Date(Date.now() + 60*24*60*60*1000).toISOString()
    });

    // 4) başarı sayfası
    res.writeHead(302, { Location: "/connect-success" });
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
