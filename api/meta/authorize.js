const FB_OAUTH_URL = "https://www.facebook.com/v20.0/dialog/oauth";

export default async function handler(req, res) {
  const { META_APP_ID, META_REDIRECT_URI } = process.env;
  const scope = ["ads_read","ads_management"].join(",");
  const url = `${FB_OAUTH_URL}?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&response_type=code&scope=${scope}`;
  res.writeHead(302, { Location: url });
  res.end();
}
