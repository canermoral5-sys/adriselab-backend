export default function handler(req,res){
  res.status(200).json({
    META_APP_ID: process.env.META_APP_ID,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI
  });
}
