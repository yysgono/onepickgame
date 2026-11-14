// Vercel supplies the country of the incoming visitor, not the page language.
function visitorCountry(req,res){
 const value=req.headers?.['x-vercel-ip-country'];
 const country=typeof value==='string'&&/^[A-Z]{2}$/.test(value)?value:null;
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Vary','x-vercel-ip-country');
 res.setHeader('X-Robots-Tag','noindex');
 return res.json({country});
}
module.exports={visitorCountry};
