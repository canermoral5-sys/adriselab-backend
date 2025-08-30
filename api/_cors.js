export function withCORS(handler){
  return async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin", "https://adriselab.webflow.io"); // prod'da adriselab.com'u da ekle
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    if(req.method==="OPTIONS"){ res.status(204).end(); return; }
    return handler(req,res);
  };
}
