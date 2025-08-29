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

    if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
      return res.status(500).json({
        error: "missing_env",
        have: {
          META_APP_ID: !!META_APP_ID,
          META_APP_SECRET: !!META_APP_SECRET,
          META_REDIRECT_URI: !!META_REDIRECT_URI,
        },
      });
    }

    // 🔑 Facebook token exchange — tüm parametreler encode edilerek
    const tokenUrl =
      `https://graph.facebook.com/v20.0/oauth/access_token` +
      `?client_id=${encodeURIComponent(META_APP_ID)}` +
      `&client_secret=${encodeURIComponent(META_APP_SECRET)}` +
      `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenResp = await fetch(tokenUrl);
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok || !tokenJson.access_token) {
      return res
        .status(400)
        .json({ step: "token_exchange_failed", response: tokenJson });
    }

    const access_token = tokenJson.access_token;
    const expires_in = Number(tokenJson.expires_in || 3600); // saniye

    // 🔒 Supabase'e kaydet
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    await supabase.from("integrations").insert({
      provider: "meta",
      access_token_encrypted: access_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    });

    // Başarıyla bağlandı → öne yönlendir
    return res.writeHead(302, { Location: "/connect-success.html" }).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

