import React,{useEffect,useState} from 'react';
import './CoupangHeaderBanner.css';
import amazonCopy from './amazonBannerCopy.json';
export const AMAZON_URL='https://www.amazon.com/?tag=onepickgamegl-20';
let countryRequest;
export function visitorCountry(){
 if(!countryRequest)countryRequest=fetch('/api/visitor-country',{cache:'no-store',credentials:'same-origin'})
  .then(response=>response.ok?response.json():null).then(data=>typeof data?.country==='string'&&/^[A-Z]{2}$/.test(data.country)?data.country:null).catch(()=>null);
 return countryRequest;
}
export function bannerDocument(mobile){
 const width=mobile?320:728,height=mobile?100:90;
 // Only the supplied account and the single active viewport size are loaded.
 const options={id:920431,template:'carousel',trackingCode:'AF6207831',width:String(width),height:String(height),tsource:''};
 return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><style>html,body{margin:0;padding:0;width:'+width+'px;height:'+height+'px;overflow:hidden}</style></head><body><script src="https://ads-partners.coupang.com/g.js"></script><script>new PartnersCoupang.G('+JSON.stringify(options)+');</script></body></html>';
}
export default function CoupangHeaderBanner({lang='en'}={}){
 const text=amazonCopy[lang]||amazonCopy.en;
 const [country,setCountry]=useState(null);
 const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 767px)').matches);
 useEffect(()=>{let live=true;visitorCountry().then(value=>{if(live)setCountry(value);});return()=>{live=false;};},[]);
 useEffect(()=>{const query=window.matchMedia('(max-width: 767px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 // Keep the slot height stable while geolocation and the ad itself load.
 // Country lookup failures do not select an affiliate program.
 return <aside className="onepick-affiliate-slot" aria-label={country==='KR'?'광고 · 쿠팡 파트너스':country?text.ad:undefined} aria-hidden={!country}>
  {country==='KR'&&<><p className="onepick-affiliate-disclosure"><strong>광고</strong> 이 배너는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p><div className="onepick-affiliate-frame"><iframe key={mobile?'mobile':'desktop'} title="쿠팡 파트너스 광고" width={mobile?320:728} height={mobile?100:90} srcDoc={bannerDocument(mobile)} scrolling="no"/></div></>}
  {country&&country!=='KR'&&<div className="onepick-amazon-ad" dir={lang==='ar'?'rtl':'ltr'}>
   <p className="onepick-affiliate-disclosure"><strong>{text.ad}</strong> {lang!=='en'&&text.disclosure}</p>
   <a className="onepick-amazon-banner" href={AMAZON_URL} target="_blank" rel="sponsored nofollow noopener noreferrer"><span className="onepick-amazon-brand" dir="ltr">Amazon.com</span><span className="onepick-amazon-message"><strong>{text.title}</strong><span>{text.subtitle}</span></span><span className="onepick-amazon-cta">{text.cta} ↗</span></a>
   <p className="onepick-amazon-required" lang="en" dir="ltr">As an Amazon Associate I earn from qualifying purchases.</p>
  </div>}
 </aside>;
}
