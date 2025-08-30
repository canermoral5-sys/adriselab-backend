import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "missing_code" });

    const {
      META_APP_ID,
      META_APP_SECRET,
      META_REDIRECT_URI,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE,
    } = process.env;

    // 1) Token al
    const tokenUrl =
      `https://graph.facebook.com/v20.0/oauth/access_token` +
      `?client_id=${encodeURIComponent(META_APP_ID)}` +
      `&client_secret=${encodeURIComponent(META_APP_SECRET)}` +
      `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenResp = await fetch(tokenUrl);
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok || !tokenJson.access_token) {
      return res.status(400).json({ step: "token_exchange_failed", response: tokenJson });
    }

    const access_token = tokenJson.access_token;
    const expires_in = Number(tokenJson.expires_in || 3600);

    // 2) Ad Accounts çek
    const meAcc = await fetch(
      `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,account_id,name&access_token=${encodeURIComponent(access_token)}`
    );
    const accJson = await meAcc.json();
    if (!meAcc.ok) {
      return res.status(400).json({ step: "adaccounts_failed", response: accJson });
    }

    // 3) TEST için email sabit
    const user_email = "caner@adriselab.com";

    // 4) Supabase'e kaydet
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const rows = (accJson.data || []).map(a => ({
      provider: "meta",
      user_email,                            // 🔑 buraya eklendi
      account_id: a.id,
      account_name: a.name || a.id,
      access_token_encrypted: access_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    }));
    if (rows.length) {
      await supa.from("integrations").insert(rows);
    }

    // 5) Başarı → yönlendir
    return res.writeHead(302, { Location: "/connect-success" }).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
