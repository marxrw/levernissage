import { useState, useEffect, useRef } from "react";

const FEATURES = { reviews: false };

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = "frame2026";
const ADMIN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`;
const CONTACT_EMAIL = "hello@useframe.ca";

function capture(event, props = {}) {
  try { window.posthog?.capture(event, props); } catch (_) {}
}

function getDailySeed(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function seededRandom(seed){let s=seed;return()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff;};}
function dailyShuffle(arr){const a=[...arr];const rand=seededRandom(getDailySeed());for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function artistDisplayName(artist) {
  if (!artist) return "";
  const parts = artist.split(/\s*(?:,|&|\band\b)\s*/i).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) return "Group Exhibition";
  return artist;
}

async function fetchShows(){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.approved&order=gallery.asc`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
  if(!res.ok)throw new Error("Failed to fetch shows");
  const data=await res.json();
  const today=new Date();
  today.setHours(0,0,0,0);
  const THREE_DAYS=3*24*60*60*1000;
  return data
    .map(s=>({
      id:s.id,gallery:s.gallery,title:s.title||"",artist:s.artist||"",
      dates:s.dates||"",openDate:s.open_date||"",closeDate:s.close_date||"",
      hood:s.neighbourhood||"",color:s.color||"#C8A882",
      reviewed:s.reviewed||false,featured:s.featured||false,
      editors_pick:s.editors_pick||false,between:s.between||false,
      quote:s.quote||"",by:s.quote_by||"",desc:s.description||"",
      address:s.address||"",hours:s.hours||"",
      byAppointment:s.by_appointment||false,
      image_url:s.image_url||null,image_url_2:s.image_url_2||null,
      image_url_3:s.image_url_3||null,image_url_4:s.image_url_4||null,
      image_url_5:s.image_url_5||null,
      website_url:s.website_url||null,instagram_url:s.instagram_url||null,
      contact_email:s.contact_email||null,
      lat:parseFloat(s.lat)||null,lng:parseFloat(s.lng)||null,
    }))
    .filter(s=>{
      if(s.featured)return true;
      if(s.editors_pick)return true;
      if(!s.openDate)return true;
      const openDate=new Date(s.openDate.split("-")[0],s.openDate.split("-")[1]-1,s.openDate.split("-")[2]);
      openDate.setHours(0,0,0,0);
      return(openDate-today)<=THREE_DAYS;
    });
}

async function fetchPendingShows(){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.cleaned&order=created_at.desc`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
  if(!res.ok)throw new Error("Failed");
  return res.json();
}

async function adminAction(action,id,featured=false){
  const res=await fetch(ADMIN_FUNCTION_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json","x-admin-secret":ADMIN_PASSWORD},
    body:JSON.stringify({id,action,featured}),
  });
  return res.ok;
}

const T={
  en:{
    city:"Montreal",featured:"Featured",shows:"Shows",map:"Map",reviews:"Reviews",
    allShows:"All Current Shows",neighbourhoods:"Neighbourhoods",editorsPicks:"Editor's Picks",
    openingThisWeek:"Opening This Week",closingThisWeek:"Closing This Week",nearby:"Nearby",
    myPlan:"My Plan",getDirections:"Directions",openWebsite:"Open website",
    openInstagram:"Instagram",share:"Share",dates:"Dates",hours:"Hours",area:"Area",
    byAppointment:"By Appointment",requestAppt:"Request a visit",
    noShowsInPlan:"No shows in your plan yet",addFromShows:"Add shows from the Shows tab",
    frameReview:"Frame Review",onNow:"On Now",loading:"Loading…",error:"Could not load shows.",
    addToPlan:"+ Plan",inPlan:"✓ Plan",venue:"Venue",
    listYourShow:"List your show",featureYourShow:"Feature your show",
    getInTouch:"Get in touch",comeToMyCity:"Come to my city",
    listingSubtitle:"Free listing",featureSubtitle:"Premium placement",
    contactGallery:"Contact the gallery",
    enableLocation:"Enable location for nearby shows",
    badgeOnNow:"On Now",badgeClosingToday:"Closing Today",badgeClosing:"Closing",
    badgeOpeningToday:"Opening Today",badgeOpening:"Opening",badgeUpcoming:"Upcoming",
    days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    details:"Details",
    pwaHeadline:"Your art guide, one tap away.",
    pwaBody:"Frame on your home screen like any other app. No download, no App Store.",
    pwaStep1Safari:"Tap ••• in the Safari toolbar",
    pwaStep2Safari:"Tap Share",
    pwaStep3Safari:"Tap Add to Home Screen",
    pwaAndStep1:"Tap ⋮ in Chrome",
    pwaAndStep2:"Tap Add to Home Screen",
    pwaSafariOnlyTitle:"Open Frame in Safari",
    pwaSafariOnlyBody:"Adding to your home screen only works in Safari. Copy the link and paste it in Safari — it takes two seconds.",
    pwaGotIt:"Got it",
  },
  fr:{
    city:"Montréal",featured:"En vedette",shows:"Expositions",map:"Carte",reviews:"Critiques",
    allShows:"Toutes les expositions",neighbourhoods:"Quartiers",editorsPicks:"Sélection",
    openingThisWeek:"Ouvertures cette semaine",closingThisWeek:"Fermetures cette semaine",nearby:"À proximité",
    myPlan:"Mon plan",getDirections:"Itinéraire",openWebsite:"Site web",
    openInstagram:"Instagram",share:"Partager",dates:"Dates",hours:"Heures",area:"Quartier",
    byAppointment:"Sur rendez-vous",requestAppt:"Demander une visite",
    noShowsInPlan:"Aucune exposition dans votre plan",addFromShows:"Ajoutez des expositions depuis Expositions",
    frameReview:"Critique Frame",onNow:"En cours",loading:"Chargement…",error:"Impossible de charger.",
    addToPlan:"+ Plan",inPlan:"✓ Plan",venue:"Lieu",
    listYourShow:"Soumettre une expo",featureYourShow:"Mettre en vedette",
    getInTouch:"Nous contacter",comeToMyCity:"Frame ici aussi",
    listingSubtitle:"Soumission gratuite",featureSubtitle:"Placement premium",
    contactGallery:"Contacter la galerie",
    enableLocation:"Activer la localisation",
    badgeOnNow:"En cours",badgeClosingToday:"Ferme aujourd'hui",badgeClosing:"Ferme",
    badgeOpeningToday:"Ouvre aujourd'hui",badgeOpening:"Ouverture",badgeUpcoming:"À venir",
    days:["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
    details:"Détails",
    pwaHeadline:"Votre guide d'art, à portée de main.",
    pwaBody:"Frame sur votre écran d'accueil comme une vraie app. Sans téléchargement, sans App Store.",
    pwaStep1Safari:"Appuyez sur ••• dans Safari",
    pwaStep2Safari:"Appuyez sur Partager",
    pwaStep3Safari:"Appuyez sur Sur l'écran d'accueil",
    pwaAndStep1:"Appuyez sur ⋮ dans Chrome",
    pwaAndStep2:"Appuyez sur Ajouter à l'écran d'accueil",
    pwaSafariOnlyTitle:"Ouvrez Frame dans Safari",
    pwaSafariOnlyBody:"L'ajout à l'écran d'accueil ne fonctionne que dans Safari. Copiez le lien et collez-le dans Safari — ça prend deux secondes.",
    pwaGotIt:"Compris",
  }
};

const INK="#0F0E0C",BLUE="#2B5BE8",WHITE="#FFFFFF",BORDER="#E8E5E0",MID="#6B6560",LIGHT="#F4F4F4";
const FEATURED_COLOR="#F5A623";
const CARD_PLACEHOLDER="#FFFFFF";
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const BADGE_GREEN="rgba(26,122,74,0.50)";
const BADGE_BLUE="rgba(26,74,138,0.50)";
const BADGE_RED="rgba(204,26,26,0.50)";
const BADGE_AMBER="rgba(160,110,20,0.50)";
const NEARBY_RADIUS_KM=2.5;
const FEATURED_CARD_HEIGHT=202;
const FEATURED_INFO_PANEL_HEIGHT=55;
const FEATURED_PILL_BOTTOM=FEATURED_INFO_PANEL_HEIGHT+3;
const INITIAL_CARDS_TO_WAIT=3;
const PWA_STORAGE_KEY="frame_pwa_prompted";

function detectPWAContext() {
  const ua = navigator.userAgent;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua) && !/OPiOS/.test(ua);
  const isIOSOther = isIOS && !isIOSSafari;
  const isAndroidChrome = isAndroid && /Chrome/.test(ua) && !/OPR/.test(ua);
  const isMobile = isIOS || isAndroid;
  // ?pwa=1 bypasses localStorage check for testing
  const forceShow = new URLSearchParams(window.location.search).get('pwa') === '1';
  const alreadySeen = !forceShow && !!localStorage.getItem(PWA_STORAGE_KEY);
  return { isStandalone, isIOSSafari, isIOSOther, isAndroidChrome, isMobile, alreadySeen };
}

function PWAPrompt({ t, onDismiss }) {
  const ctx = detectPWAContext();
  if (ctx.isStandalone || ctx.alreadySeen || !ctx.isMobile) return null;
  if (!ctx.isIOSSafari && !ctx.isIOSOther && !ctx.isAndroidChrome) return null;

  const handleDismiss = () => {
    localStorage.setItem(PWA_STORAGE_KEY, '1');
    onDismiss();
  };

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 8000,
    background: "rgba(15,14,12,0.45)",
    backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
    display: "flex", flexDirection: "column", justifyContent: "flex-end",
    maxWidth: 430, margin: "0 auto",
    animation: "pwaFadeIn 0.3s ease forwards",
  };

  const sheetStyle = {
    background: WHITE,
    borderRadius: "20px 20px 0 0",
    paddingBottom: "max(env(safe-area-inset-bottom), 36px)",
    animation: "pwaSlideUp 0.42s cubic-bezier(0.16,1,0.3,1) forwards",
  };

  const stepStyle = {
    display: "flex", alignItems: "center", gap: 16,
    padding: "15px 0", borderBottom: `1px solid ${BORDER}`,
  };

  const stepNumStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22, fontStyle: "italic", fontWeight: 400,
    color: "#D4D0CB", width: 20, flexShrink: 0, lineHeight: 1,
  };

  const stepTextStyle = {
    fontSize: 16, fontWeight: 600, color: INK, flex: 1,
  };

  const ShareIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.45,flexShrink:0}}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );

  const PlusBoxIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{opacity:0.45,flexShrink:0}}>
      <rect x="1" y="1" width="16" height="16" rx="3" stroke={INK} strokeWidth="1.8"/>
      <line x1="9" y1="5" x2="9" y2="13" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="5" y1="9" x2="13" y2="9" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  const DotsHIcon = () => (
    <svg width="18" height="6" viewBox="0 0 18 6" style={{opacity:0.45,flexShrink:0}}>
      <circle cx="2.5" cy="3" r="2.5" fill={INK}/>
      <circle cx="9" cy="3" r="2.5" fill={INK}/>
      <circle cx="15.5" cy="3" r="2.5" fill={INK}/>
    </svg>
  );

  const DotsVIcon = () => (
    <svg width="5" height="18" viewBox="0 0 5 18" style={{opacity:0.45,flexShrink:0}}>
      <circle cx="2.5" cy="2.5" r="2.5" fill={INK}/>
      <circle cx="2.5" cy="9" r="2.5" fill={INK}/>
      <circle cx="2.5" cy="15.5" r="2.5" fill={INK}/>
    </svg>
  );

  return (
    <div style={overlayStyle} onClick={handleDismiss}>
      <div style={sheetStyle} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:BORDER,margin:"12px auto 24px"}}/>

        {/* Top row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",marginBottom:20}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontStyle:"italic",fontWeight:600,color:MID,letterSpacing:"0.08em"}}>Frame</span>
          <button onClick={handleDismiss} style={{width:28,height:28,borderRadius:"50%",background:LIGHT,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:MID,fontSize:14,fontFamily:"sans-serif",lineHeight:1}}>✕</button>
        </div>

        {/* Headline */}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontStyle:"italic",fontWeight:600,color:INK,lineHeight:1.15,padding:"0 24px",marginBottom:8}}>{t.pwaHeadline}</div>

        {/* Body */}
        <div style={{fontSize:15,color:MID,padding:"0 24px",marginBottom:28,lineHeight:1.55}}>{t.pwaBody}</div>

        {/* iOS Safari steps */}
        {ctx.isIOSSafari && (
          <div style={{padding:"0 24px",marginBottom:28}}>
            <div style={{...stepStyle,borderTop:`1px solid ${BORDER}`}}>
              <div style={stepNumStyle}>1</div>
              <div style={stepTextStyle}>{t.pwaStep1Safari}</div>
              <DotsHIcon/>
            </div>
            <div style={stepStyle}>
              <div style={stepNumStyle}>2</div>
              <div style={stepTextStyle}>{t.pwaStep2Safari}</div>
              <ShareIcon/>
            </div>
            <div style={stepStyle}>
              <div style={stepNumStyle}>3</div>
              <div style={stepTextStyle}>{t.pwaStep3Safari}</div>
              <PlusBoxIcon/>
            </div>
          </div>
        )}

        {/* iOS other browser */}
        {ctx.isIOSOther && (
          <div style={{margin:"0 24px 28px",background:LIGHT,borderRadius:10,padding:"18px 16px",display:"flex",gap:14,alignItems:"flex-start"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:INK,marginBottom:5,lineHeight:1.4}}>{t.pwaSafariOnlyTitle}</div>
              <div style={{fontSize:13,color:MID,lineHeight:1.55}}>{t.pwaSafariOnlyBody}</div>
            </div>
          </div>
        )}

        {/* Android Chrome steps */}
        {ctx.isAndroidChrome && (
          <div style={{padding:"0 24px",marginBottom:28}}>
            <div style={{...stepStyle,borderTop:`1px solid ${BORDER}`}}>
              <div style={stepNumStyle}>1</div>
              <div style={stepTextStyle}>{t.pwaAndStep1}</div>
              <DotsVIcon/>
            </div>
            <div style={stepStyle}>
              <div style={stepNumStyle}>2</div>
              <div style={stepTextStyle}>{t.pwaAndStep2}</div>
              <PlusBoxIcon/>
            </div>
          </div>
        )}

        {/* CTA */}
        <button onClick={handleDismiss} style={{margin:"0 24px",width:"calc(100% - 48px)",padding:16,borderRadius:6,background:INK,color:WHITE,border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase",cursor:"pointer"}}>
          {t.pwaGotIt}
        </button>
      </div>
    </div>
  );
}

function parseLocalDate(str){if(!str)return null;const[y,m,d]=str.split("-");return new Date(y,m-1,d);}
function dayDiff(dateStr){if(!dateStr)return null;return(parseLocalDate(dateStr)-TODAY)/86400000;}
function isClosingToday(s){if(!s.closeDate)return false;const d=dayDiff(s.closeDate);return d>=0&&d<1;}
function isClosingThisWeek(s){if(!s.closeDate)return false;const d=dayDiff(s.closeDate);return d>=1&&d<=7;}
function isOpeningToday(s){if(!s.openDate)return false;const d=dayDiff(s.openDate);return d>=0&&d<1;}
function isOpeningThisWeek(s){if(!s.openDate)return false;const d=dayDiff(s.openDate);return d>=1&&d<=7;}
function isOnNow(s){if(!s.openDate||!s.closeDate)return false;const od=parseLocalDate(s.openDate);const cd=parseLocalDate(s.closeDate);return od<TODAY&&cd>=TODAY;}
function isUpcoming(s){if(!s.openDate)return false;return dayDiff(s.openDate)>7;}

function statusBadgeInfo(s,t){
  if(isClosingToday(s))return{label:t.badgeClosingToday,color:BADGE_RED};
  if(isOpeningToday(s))return{label:t.badgeOpeningToday,color:BADGE_BLUE};
  if(isOpeningThisWeek(s)){const d=new Date(s.openDate);return{label:`${t.badgeOpening} ${t.days[d.getDay()]}`,color:BADGE_BLUE};}
  if(isClosingThisWeek(s)){const d=new Date(s.closeDate);return{label:`${t.badgeClosing} ${t.days[d.getDay()]}`,color:BADGE_RED};}
  if(isOnNow(s))return{label:t.badgeOnNow,color:BADGE_GREEN};
  if(isUpcoming(s))return{label:t.badgeUpcoming,color:BADGE_AMBER};
  return null;
}

function mapsUrl(addr){return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;}
function staticMapUrl(lat,lng){return`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&scale=2&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${GMAPS_KEY}&style=feature:poi|visibility:off`;}
function shortAddr(a){if(!a)return"";const firstComma=a.indexOf(",");return firstComma>-1?a.slice(0,firstComma).trim():a.trim();}
function getImages(s){return[s.image_url,s.image_url_2,s.image_url_3,s.image_url_4,s.image_url_5].filter(Boolean);}
function distanceKm(lat1,lng1,lat2,lng2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function pinSVG(featured,id){
  const fid=id||"x";
  if(featured){return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pf${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pf${fid})"/><circle cx="17" cy="15" r="12" fill="#7BA7D4"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/><text x="17" y="20" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}
  return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pn${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pn${fid})"/><circle cx="17" cy="15" r="12" fill="#E8251A"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/></svg>`;
}

function SplashScreen({visible}){
  return(
    <div style={{
      position:"fixed",inset:0,background:WHITE,zIndex:9000,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      maxWidth:430,margin:"0 auto",
      opacity:visible?1:0,
      transition:"opacity 0.8s ease",
      pointerEvents:visible?"auto":"none",
    }}>
      <div style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontSize:36,fontStyle:"italic",fontWeight:600,
        color:INK,
        opacity:0,
        animation:"frameFadeIn 0.6s ease 0.05s forwards",
      }}>Frame</div>
    </div>
  );
}

function EmailSheet({email,subject="",body="",onClose}){
  const gmailUrl=`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailtoUrl=`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const[copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard?.writeText(email).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  return(
    <div style={{position:"fixed",inset:0,zIndex:5000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{background:"rgba(0,0,0,0.4)",position:"absolute",inset:0}}/>
      <div style={{position:"relative",background:WHITE,borderRadius:"16px 16px 0 0",padding:"8px 16px 40px",maxWidth:430,margin:"0 auto",width:"100%"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,borderRadius:2,background:BORDER,margin:"8px auto 20px"}}/>
        <div style={{fontSize:13,color:MID,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingLeft:4}}>Send email via</div>
        {[
          {label:"Gmail",icon:"✉️",action:()=>{window.open(gmailUrl,"_blank");onClose();}},
          {label:"Mail app",icon:"📬",action:()=>{window.location.href=mailtoUrl;onClose();}},
          {label:copied?"Copied!":"Copy email address",icon:"📋",action:copy},
        ].map(({label,icon,action})=>(
          <button key={label} onClick={action} style={{width:"100%",display:"flex",alignItems:"center",gap:16,padding:"16px 12px",border:"none",background:"none",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:16,color:INK,fontWeight:500,textAlign:"left"}}>
            <span style={{fontSize:22}}>{icon}</span>{label}
          </button>
        ))}
        <button onClick={onClose} style={{width:"100%",padding:"16px",border:"none",background:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:MID,marginTop:4}}>Cancel</button>
      </div>
    </div>
  );
}

function PlanPill({saved,onToggle}){
  return(
    <button onClick={e=>{e.stopPropagation();onToggle();}} style={{
      padding:"4px 10px",borderRadius:20,border:"none",
      background:saved?BLUE:"rgba(0,0,0,0.15)",
      backdropFilter:!saved?"blur(6px)":"none",
      WebkitBackdropFilter:!saved?"blur(6px)":"none",
      color:WHITE,
      fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",
      cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",flexShrink:0,
      transition:"all 0.18s",
      boxShadow:!saved?"0 1px 4px rgba(0,0,0,0.12)":"none",
    }}>{saved?"✓ Plan":"+ Plan"}</button>
  );
}

function ImageCarousel({slides,height=220,onTap,directionsBottom=10,onFirstImageLoad}){
  const[idx,setIdx]=useState(0);
  const touchStartX=useRef(null);
  const touchStartY=useRef(null);
  const touchStartTime=useRef(null);
  const isHorizontal=useRef(false);
  const didSwipe=useRef(false);
  const mouseStartX=useRef(null);
  const mouseStartY=useRef(null);
  const isDragging=useRef(false);
  const didMouseSwipe=useRef(false);
  const firstImageLoaded=useRef(false);

  if(!slides||slides.length===0)return<div style={{height,background:CARD_PLACEHOLDER}}/>;

  const go=(n)=>setIdx(i=>Math.max(0,Math.min(slides.length-1,i+n)));

  const onTouchStart=(e)=>{
    touchStartX.current=e.touches[0].clientX;
    touchStartY.current=e.touches[0].clientY;
    touchStartTime.current=Date.now();
    isHorizontal.current=false;
    didSwipe.current=false;
  };

  const onTouchMove=(e)=>{
    if(touchStartX.current===null)return;
    const dx=e.touches[0].clientX-touchStartX.current;
    const dy=e.touches[0].clientY-touchStartY.current;
    if(!isHorizontal.current&&Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){
      isHorizontal.current=true;
    }
    if(isHorizontal.current){
      didSwipe.current=true;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onTouchEnd=(e)=>{
    if(touchStartX.current===null)return;
    const dx=e.changedTouches[0].clientX-touchStartX.current;
    const dt=Date.now()-touchStartTime.current;
    const dy=e.changedTouches[0].clientY-touchStartY.current;
    if(isHorizontal.current&&Math.abs(dx)>40){
      go(dx<0?1:-1);
    } else if(!didSwipe.current&&dt<250&&Math.abs(dy)<10&&Math.abs(dx)<10&&onTap){
      const target=e.changedTouches[0].target;
      const isLink=target.closest&&target.closest('a[href]');
      if(!isLink)onTap();
    }
    touchStartX.current=null;
    touchStartY.current=null;
    isHorizontal.current=false;
    didSwipe.current=false;
  };

  const onMouseDown=(e)=>{
    mouseStartX.current=e.clientX;
    mouseStartY.current=e.clientY;
    isDragging.current=true;
    didMouseSwipe.current=false;
  };

  const onMouseMove=(e)=>{
    if(!isDragging.current)return;
    const dx=e.clientX-mouseStartX.current;
    if(Math.abs(dx)>8)didMouseSwipe.current=true;
  };

  const onMouseUp=(e)=>{
    if(!isDragging.current)return;
    const dx=e.clientX-mouseStartX.current;
    const dy=e.clientY-mouseStartY.current;
    if(didMouseSwipe.current&&Math.abs(dx)>40){
      go(dx<0?1:-1);
    } else if(!didMouseSwipe.current&&Math.abs(dx)<8&&Math.abs(dy)<8&&onTap){
      const isLink=e.target.closest&&e.target.closest('a[href]');
      if(!isLink)onTap();
    }
    isDragging.current=false;
    didMouseSwipe.current=false;
    mouseStartX.current=null;
    mouseStartY.current=null;
  };

  const handleFirstLoad=()=>{
    if(!firstImageLoaded.current){
      firstImageLoaded.current=true;
      onFirstImageLoad&&onFirstImageLoad();
    }
  };

  const dirBtnStyle={
    position:"absolute",bottom:directionsBottom,left:12,zIndex:10,
    background:"rgba(15,14,12,0.65)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
    color:WHITE,fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",
    padding:"4px 10px",borderRadius:20,border:"1px solid rgba(255,255,255,0.20)",
    textDecoration:"none",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif",
    boxShadow:"0 1px 4px rgba(0,0,0,0.15)",pointerEvents:"auto",
  };

  return(
    <div style={{position:"relative",height,overflow:"hidden",userSelect:"none",touchAction:"pan-y",cursor:"pointer"}}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={()=>{isDragging.current=false;}}>
      <div style={{display:"flex",height:"100%",width:`${slides.length*100}%`,
        transform:`translateX(-${(idx/slides.length)*100}%)`,
        transition:"transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)",willChange:"transform"}}>
        {slides.map((slide,i)=>(
          <div key={i} style={{width:`${100/slides.length}%`,height:"100%",flexShrink:0,overflow:"hidden",position:"relative",background:CARD_PLACEHOLDER}}>
            {typeof slide==="string"?(
              <img src={slide} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",pointerEvents:"none"}}
                onLoad={i===0?handleFirstLoad:undefined}
                onError={e=>{e.target.style.display="none";if(i===0)handleFirstLoad();}}/>
            ):slide.mapUrl?(
              <>
                <img src={slide.mapUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",pointerEvents:"none"}}
                  onLoad={i===0?handleFirstLoad:undefined}
                  onError={e=>{e.target.style.display="none";if(i===0)handleFirstLoad();}}/>
                <a href={mapsUrl(slide.address)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={dirBtnStyle}>
                  {(window.__lvT&&window.__lvT.getDirections)||"Directions"}<svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{marginLeft:4,flexShrink:0}}><path d="M2 10L10 2M10 2H4M10 2V8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </>
            ):(
              <div style={{width:"100%",height:"100%",background:CARD_PLACEHOLDER,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,position:"relative"}}>
                <div style={{fontSize:28}}>📍</div>
                <div style={{fontSize:13,fontWeight:600,color:INK,textAlign:"center",padding:"0 20px",lineHeight:1.4}}>{slide.address}</div>
                <a href={mapsUrl(slide.address)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={dirBtnStyle}>
                  {(window.__lvT&&window.__lvT.getDirections)||"Directions"}<svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{marginLeft:4,flexShrink:0}}><path d="M2 10L10 2M10 2H4M10 2V8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      {slides.length>1&&(
        <div style={{position:"absolute",top:12,left:12,display:"flex",gap:5,alignItems:"center",zIndex:3}}>
          {slides.map((_,i)=>(
            <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{width:i===idx?18:6,height:6,borderRadius:3,background:i===idx?"rgba(255,255,255,1)":"rgba(255,255,255,0.5)",transition:"all 0.25s",cursor:"pointer"}}/>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedCard({s,onClick,saved,onToggleSave,t,onFirstImageLoad}){
  const badgeInfo=statusBadgeInfo(s,t);
  const images=getImages(s);
  const hasCoords=s.lat&&s.lng&&!isNaN(s.lat)&&!isNaN(s.lng);
  const mapSlide=hasCoords?{mapUrl:staticMapUrl(s.lat,s.lng),address:s.address||s.gallery}:{address:s.address||s.gallery};
  const slides=[...images,mapSlide];
  const displayArtist=artistDisplayName(s.artist);
  return(
    <div style={{cursor:"pointer",position:"relative",height:FEATURED_CARD_HEIGHT,overflow:"hidden",background:CARD_PLACEHOLDER,borderBottom:`0.25px solid ${BLUE}`}}>
      <div style={{position:"absolute",inset:0,zIndex:1}}>
        <ImageCarousel slides={slides} height={FEATURED_CARD_HEIGHT} onTap={onClick} directionsBottom={FEATURED_PILL_BOTTOM} onFirstImageLoad={onFirstImageLoad}/>
      </div>
      {badgeInfo&&(
        <div style={{position:"absolute",top:10,right:10,zIndex:5,background:badgeInfo.color,backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",color:WHITE,fontSize:9,fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase",padding:"4px 8px",borderRadius:3,border:"1px solid rgba(255,255,255,0.25)",pointerEvents:"none"}}>{badgeInfo.label}</div>
      )}
      <div style={{position:"absolute",bottom:FEATURED_PILL_BOTTOM,right:12,zIndex:6,pointerEvents:"auto"}} onClick={e=>{e.stopPropagation();onToggleSave();}}>
        <PlanPill saved={saved} onToggle={onToggleSave}/>
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.60)",padding:"5px 12px 6px",zIndex:4,pointerEvents:"none"}}>
        <div style={{fontSize:18,fontWeight:700,color:INK,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{displayArtist}</div>
        <div style={{fontSize:15,fontWeight:500,color:INK,lineHeight:1.25,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{s.gallery}{s.address?` · ${shortAddr(s.address)}`:""}</div>
      </div>
    </div>
  );
}

function TextCard({s,onClick,saved,onToggleSave,t}){
  const badgeInfo=statusBadgeInfo(s,t);
  const displayArtist=artistDisplayName(s.artist);
  return(
    <div onClick={onClick} style={{padding:"16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:5}}>{s.gallery}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",fontWeight:600,color:INK,lineHeight:1.2,marginBottom:4}}>{s.title}</div>
        <div style={{fontSize:15,color:MID,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayArtist}</div>
        <div style={{fontSize:13,color:MID}}>{s.hood}{s.dates?` · ${s.dates}`:""}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"space-evenly",alignSelf:"stretch",flexShrink:0}}>
        {badgeInfo&&<span style={{fontSize:10,padding:"3px 8px",background:badgeInfo.color,color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{badgeInfo.label}</span>}
        <PlanPill saved={saved} onToggle={onToggleSave}/>
      </div>
    </div>
  );
}

function ShowsSubPage({title,shows,onBack,onSelect,saved,toggleSave,t}){
  return(
    <div style={{position:"fixed",inset:0,background:WHITE,zIndex:1500,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",animation:"slideUp 0.28s cubic-bezier(0.16,1,0.3,1)"}}>
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",padding:"0 4px",flexShrink:0}}>
        <button onClick={onBack} style={{height:"100%",padding:"0 20px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",minWidth:44}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{fontSize:16,fontWeight:600,color:INK}}>{title}</span>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {shows.length===0&&<div style={{padding:"60px 20px",textAlign:"center",color:MID,fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic"}}>No shows in this section</div>}
        {shows.map(s=><TextCard key={s.id} s={s} onClick={()=>onSelect(s)} saved={saved.has(s.id)} onToggleSave={()=>toggleSave(s.id)} t={t}/>)}
      </div>
    </div>
  );
}

function VenuePage({show,onBack,t,onEmailSheet}){
  const hasCoords=show.lat&&show.lng&&!isNaN(show.lat)&&!isNaN(show.lng);
  const embedSrc=hasCoords
    ?`https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${show.lat},${show.lng}&zoom=15`
    :`https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${encodeURIComponent(show.address)}&zoom=15`;
  return(
    <div style={{position:"fixed",inset:0,background:WHITE,zIndex:2500,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",animation:"slideUp 0.28s cubic-bezier(0.16,1,0.3,1)",overflowY:"auto"}}>
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",padding:"0 4px",flexShrink:0,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{height:"100%",padding:"0 20px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",minWidth:44}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{fontSize:16,fontWeight:600,color:INK}}>{show.gallery}</span>
        </button>
      </div>
      <div style={{padding:"24px 20px 16px"}}>
        <div style={{fontSize:18,fontWeight:700,color:INK,marginBottom:4}}>{show.gallery}</div>
        <div style={{fontSize:15,color:MID,marginBottom:2}}>{shortAddr(show.address)}</div>
        {show.hours&&<div style={{fontSize:14,color:MID}}>{show.hours}</div>}
      </div>
      <div style={{height:200,position:"relative",flexShrink:0,overflow:"hidden"}}>
        <iframe title="map" width="100%" height="100%" style={{border:0,display:"block"}} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={embedSrc}/>
      </div>
      <div style={{borderTop:`1px solid ${BORDER}`}}>
        <a href={mapsUrl(show.address)} target="_blank" rel="noopener noreferrer" onClick={()=>capture("directions_tapped",{gallery:show.gallery,source:"venue"})} style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,textDecoration:"none",color:BLUE,fontSize:16,fontWeight:500}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          {t.getDirections}
        </a>
        {show.website_url&&<a href={show.website_url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,textDecoration:"none",color:BLUE,fontSize:16,fontWeight:500}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          {t.openWebsite}
        </a>}
        {show.instagram_url&&<a href={show.instagram_url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,textDecoration:"none",color:BLUE,fontSize:16,fontWeight:500}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          {t.openInstagram}
        </a>}
        {show.contact_email&&<div onClick={()=>onEmailSheet&&onEmailSheet()} style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",color:BLUE,fontSize:16,fontWeight:500}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          {t.contactGallery}
        </div>}
      </div>
    </div>
  );
}

function DetailPage({detail,sourceLabel,onBack,saved,toggleSave,showToast,toastId,toastVisible,t,onVenue,onApptEmail}){
  const images=getImages(detail);
  const hasCoords=detail.lat&&detail.lng&&!isNaN(detail.lat)&&!isNaN(detail.lng);
  const mapSlide=hasCoords?{mapUrl:staticMapUrl(detail.lat,detail.lng),address:detail.address||detail.gallery}:{address:detail.address||detail.gallery};
  const slides=[...images,mapSlide];
  const on=saved.has(detail.id);
  const staticRows=[
    [t.dates,detail.dates],
    [t.hours,detail.hours||"—"],
    [t.area,detail.hood],
  ];
  return(
    <div style={{position:"fixed",inset:0,background:WHITE,zIndex:2000,overflowY:"auto",animation:"slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",maxWidth:430,margin:"0 auto"}}>
      <div style={{position:"sticky",top:0,background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",padding:"0 4px",zIndex:10,flexShrink:0}}>
        <button onClick={onBack} style={{height:"100%",padding:"0 20px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",minWidth:44}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{fontSize:16,fontWeight:600,color:INK}}>{sourceLabel}</span>
        </button>
      </div>
      <ImageCarousel slides={slides} height={280}/>
      <div style={{padding:"24px 20px 0"}}>
        <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:8}}>{detail.gallery}</div>
        {!detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontStyle:"italic",fontWeight:500,lineHeight:1.15,marginBottom:6}}>{detail.title}</div>}
        {!detail.between&&detail.artist&&<div style={{fontSize:17,fontWeight:400,marginBottom:20,color:INK}}>{detail.artist}</div>}
        {!detail.between&&(
          <div style={{border:`1px solid ${BORDER}`,borderRadius:4,marginBottom:16,overflow:"hidden"}}>
            {staticRows.map(([label,val])=>(
              <div key={label} style={{padding:"12px 16px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{fontSize:10,letterSpacing:"0.10em",textTransform:"uppercase",color:MID,fontWeight:600,flexShrink:0}}>{label}</div>
                <div style={{fontSize:13,fontWeight:600,color:INK,textAlign:"right"}}>{val}</div>
              </div>
            ))}
            {detail.byAppointment&&(
              <div onClick={()=>onApptEmail&&onApptEmail()} style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,cursor:"pointer"}}>
                <div style={{fontSize:10,letterSpacing:"0.10em",textTransform:"uppercase",color:MID,fontWeight:600,flexShrink:0}}>{t.byAppointment}</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,fontWeight:600,color:BLUE}}>{t.requestAppt}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            )}
          </div>
        )}
        {!detail.between&&(
          <div style={{position:"relative",marginBottom:20}}>
            {toastId===detail.id&&toastVisible&&<div style={{position:"absolute",top:-36,left:"50%",transform:"translateX(-50%)",background:INK,color:WHITE,fontSize:11,fontWeight:600,whiteSpace:"nowrap",padding:"6px 10px",borderRadius:4,pointerEvents:"none",zIndex:10}}>{on?t.inPlan:"Removed from Plan"}</div>}
            <button onClick={e=>{e.stopPropagation();toggleSave(detail.id);showToast(detail.id);}} style={{width:"100%",padding:"13px 0",borderRadius:4,border:`1.5px solid ${on?BLUE:BORDER}`,background:on?`${BLUE}12`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all 0.2s"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={on?BLUE:MID}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:on?BLUE:MID}}>{on?t.inPlan:t.addToPlan}</span>
            </button>
          </div>
        )}
        {!detail.between&&(
          <div onClick={onVenue} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`,cursor:"pointer",marginBottom:24}}>
            <div>
              <div style={{fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:3}}>{t.venue}</div>
              <div style={{fontSize:15,fontWeight:600,color:INK,marginBottom:1}}>{detail.gallery}</div>
              <div style={{fontSize:13,color:MID}}>{shortAddr(detail.address)}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        )}
        {detail.desc&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,lineHeight:1.8,marginBottom:28,color:INK}}>{detail.desc}</div>}
        {detail.reviewed&&detail.quote&&(
          <div style={{background:"#EEF2FD",borderLeft:`3px solid ${BLUE}`,padding:"18px 16px",marginBottom:28,borderRadius:"0 4px 4px 0"}}>
            <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:10}}>{t.frameReview}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",lineHeight:1.8,marginBottom:10,color:INK}}>{detail.quote}</div>
            <div style={{fontSize:12,color:MID}}>{detail.by}</div>
          </div>
        )}
        <button onClick={()=>{
          capture("share_tapped",{gallery:detail.gallery,title:detail.title});
          if(navigator.share){navigator.share({title:`${detail.title} — ${detail.gallery}`,url:window.location.href});}
          else{navigator.clipboard?.writeText(window.location.href);}
        }} style={{width:"100%",padding:"14px 0",borderRadius:4,border:`1.5px solid ${BORDER}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",marginBottom:40,fontFamily:"'DM Sans',sans-serif"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:MID}}>{t.share}</span>
        </button>
      </div>
    </div>
  );
}

function AdminPage({onExit}){
  const[authed,setAuthed]=useState(false);
  const[pwInput,setPwInput]=useState("");
  const[pwError,setPwError]=useState(false);
  const[pendingShows,setPendingShows]=useState([]);
  const[liveShows,setLiveShows]=useState([]);
  const[loading,setLoading]=useState(false);
  const[featuredMap,setFeaturedMap]=useState({});
  const[actionStates,setActionStates]=useState({});

  const handleLogin=()=>{
    if(pwInput===ADMIN_PASSWORD){setAuthed(true);loadShows();}
    else{setPwError(true);setPwInput("");setTimeout(()=>setPwError(false),1500);}
  };

  const loadShows=async()=>{
    setLoading(true);
    try{
      const pending=await fetchPendingShows();
      setPendingShows(pending);
      const fm={};pending.forEach(s=>{fm[s.id]=s.featured||false;});setFeaturedMap(fm);
      const liveRes=await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.approved&order=gallery.asc`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
      if(liveRes.ok)setLiveShows(await liveRes.json());
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const handleAction=async(id,status)=>{
    setActionStates(prev=>({...prev,[id]:status==="approved"?"approving":"rejecting"}));
    const ok=await adminAction(status==="approved"?"approve":"reject",id,featuredMap[id]||false);
    if(ok){setPendingShows(prev=>prev.filter(s=>s.id!==id));setActionStates(prev=>({...prev,[id]:"done"}));}
    else{setActionStates(prev=>({...prev,[id]:"error"}));}
  };

  const handleRemove=async(e,id,title)=>{
    e.stopPropagation();
    const confirmed=window.confirm(`Remove "${title}"?`);
    if(!confirmed)return;
    setActionStates(prev=>({...prev,[id]:"removing"}));
    const ok=await adminAction("remove",id);
    if(ok){setLiveShows(prev=>prev.filter(s=>s.id!==id));setActionStates(prev=>({...prev,[id]:"done"}));}
    else{setActionStates(prev=>({...prev,[id]:"error"}));alert("Failed to remove.");}
  };

  if(!authed)return(
    <div style={{position:"fixed",inset:0,background:INK,zIndex:3000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,maxWidth:430,margin:"0 auto"}}>
      <div style={{marginBottom:8,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:MID,fontWeight:600}}>Frame</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontStyle:"italic",color:WHITE,marginBottom:40}}>Admin</div>
      <div style={{width:"100%",maxWidth:300}}>
        <input type="password" value={pwInput} onChange={e=>setPwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password" autoFocus style={{width:"100%",padding:"14px 16px",borderRadius:4,fontSize:15,border:`1.5px solid ${pwError?"#E8251A":"#333"}`,background:"#1A1A18",color:WHITE,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
        {pwError&&<div style={{color:"#E8251A",fontSize:12,marginTop:8,textAlign:"center"}}>Incorrect password</div>}
        <button onClick={handleLogin} style={{width:"100%",marginTop:12,padding:"14px 0",borderRadius:4,background:BLUE,color:WHITE,border:"none",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Enter</button>
        <button onClick={onExit} style={{width:"100%",marginTop:8,padding:"12px 0",borderRadius:4,background:"transparent",color:MID,border:"none",fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back to App</button>
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:LIGHT,zIndex:3000,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",overflowY:"auto"}}>
      <div style={{background:INK,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:2}}>Frame</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:WHITE}}>Admin</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:pendingShows.length>0?BLUE:"#333",color:WHITE,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700}}>{pendingShows.length} pending</div>
          <button onClick={onExit} style={{background:"transparent",border:`1px solid #333`,color:MID,padding:"6px 12px",borderRadius:3,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Exit</button>
        </div>
      </div>
      <div style={{flex:1,padding:"16px",display:"flex",flexDirection:"column",gap:32}}>
        <div>
          <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:MID,fontWeight:700,marginBottom:16,paddingBottom:8,borderBottom:`1px solid ${BORDER}`}}>Review Queue</div>
          {loading&&<div style={{textAlign:"center",padding:"40px 20px",color:MID}}>Loading…</div>}
          {!loading&&pendingShows.length===0&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",color:MID}}>All clear</div></div>}
          {!loading&&pendingShows.map((s,idx)=>(
            <div key={s.id} style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:14,background:INK,color:WHITE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{idx+1}</div>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:MID,fontWeight:600}}>Submission {idx+1} of {pendingShows.length}</div>
                <div style={{flex:1,height:1,background:BORDER}}/>
              </div>
              <div style={{background:WHITE,borderRadius:8,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.10)",border:`1px solid ${BORDER}`}}>
                <div style={{width:"100%",height:180,background:s.color||"#C8A882",position:"relative",overflow:"hidden"}}>
                  {s.image_url&&<img src={s.image_url} alt={s.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                  <div style={{position:"absolute",top:10,left:10,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",padding:"4px 10px",borderRadius:3,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:WHITE,fontWeight:700}}>Pending Review</div>
                </div>
                <div style={{padding:"16px 16px 0"}}>
                  <div style={{fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:4}}>{s.gallery}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",fontWeight:600,color:INK,marginBottom:2}}>{s.title}</div>
                  <div style={{fontSize:14,color:MID,marginBottom:12}}>{s.artist}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[["Dates",s.dates],["Neighbourhood",s.neighbourhood],["Address",s.address],["Hours",s.hours]].map(([label,val])=>(
                      <div key={label} style={{background:LIGHT,borderRadius:4,padding:"8px 10px"}}>
                        <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:3}}>{label}</div>
                        <div style={{fontSize:12,color:INK,fontWeight:500}}>{val||"—"}</div>
                      </div>
                    ))}
                  </div>
                  {s.payment_reference&&(
                    <div style={{background:"#FFF8EC",border:"1.5px solid #F5A623",borderRadius:4,padding:"10px 12px",marginBottom:12}}>
                      <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"#B07800",fontWeight:700,marginBottom:3}}>Payment Reference</div>
                      <div style={{fontSize:13,color:INK,fontWeight:600}}>{s.payment_reference}</div>
                    </div>
                  )}
                  {s.description&&<div style={{fontSize:13,color:MID,lineHeight:1.6,marginBottom:14,fontStyle:"italic"}}>{s.description.length>160?s.description.slice(0,160)+"…":s.description}</div>}
                </div>
                <div style={{margin:"0 16px 16px",borderRadius:6,border:`2.5px solid ${featuredMap[s.id]?FEATURED_COLOR:BORDER}`,background:featuredMap[s.id]?"#FFF8EC":LIGHT,padding:"14px 16px",transition:"all 0.2s",cursor:"pointer"}} onClick={()=>setFeaturedMap(prev=>({...prev,[s.id]:!prev[s.id]}))}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:featuredMap[s.id]?FEATURED_COLOR:MID,marginBottom:2}}>{featuredMap[s.id]?"⭐ Featured — Image Card":"Featured Placement"}</div>
                      <div style={{fontSize:11,color:featuredMap[s.id]?"#B07800":"#AAA"}}>{featuredMap[s.id]?"Will appear with image card in Featured tab":"OFF — text card in Shows list"}</div>
                    </div>
                    <div style={{width:52,height:30,borderRadius:15,flexShrink:0,background:featuredMap[s.id]?FEATURED_COLOR:"#CCC",position:"relative",transition:"background 0.2s"}}>
                      <div style={{position:"absolute",top:3,left:featuredMap[s.id]?25:3,width:24,height:24,borderRadius:12,background:WHITE,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:0,borderTop:`1px solid ${BORDER}`}}>
                  <button onClick={()=>handleAction(s.id,"rejected")} disabled={actionStates[s.id]==="rejecting"} style={{flex:1,padding:"14px 0",border:"none",borderRight:`1px solid ${BORDER}`,background:WHITE,color:"#E8251A",fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",borderRadius:"0 0 0 8px"}}>{actionStates[s.id]==="rejecting"?"Rejecting…":"✕ Reject"}</button>
                  <button onClick={()=>handleAction(s.id,"approved")} disabled={actionStates[s.id]==="approving"} style={{flex:1,padding:"14px 0",border:"none",background:actionStates[s.id]==="approving"?"#22A06B":INK,color:WHITE,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",borderRadius:"0 0 8px 0",transition:"background 0.2s"}}>{actionStates[s.id]==="approving"?"Approving…":"✓ Approve"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:MID,fontWeight:700,marginBottom:16,paddingBottom:8,borderBottom:`1px solid ${BORDER}`}}>Live Shows ({liveShows.length})</div>
          {liveShows.map(s=>(
            <div key={s.id} style={{background:WHITE,borderRadius:6,border:`1px solid ${BORDER}`,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:2}}>{s.gallery}</div>
                <div style={{fontSize:13,color:INK,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title||"Between exhibitions"}</div>
                {s.featured&&<div style={{fontSize:10,color:FEATURED_COLOR,fontWeight:700,marginTop:2}}>⭐ Featured</div>}
              </div>
              <button onClick={(e)=>handleRemove(e,s.id,s.title||"this show")} disabled={actionStates[s.id]==="removing"} style={{flexShrink:0,padding:"7px 14px",border:`1px solid #E8251A`,borderRadius:3,background:WHITE,color:"#E8251A",fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                {actionStates[s.id]==="removing"?"…":"Remove"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState("featured");
  const[detail,setDetail]=useState(null);
  const[detailSource,setDetailSource]=useState("featured");
  const[venuePage,setVenuePage]=useState(null);
  const[subPage,setSubPage]=useState(null);
  const[saved,setSaved]=useState(new Set());
  const[mapMode,setMapMode]=useState("all");
  const[lang,setLang]=useState("en");
  const[SHOWS,setSHOWS]=useState([]);
  const[loading,setLoading]=useState(true);
  const[loadError,setLoadError]=useState(false);
  const[showAdmin,setShowAdmin]=useState(false);
  const[tapCount,setTapCount]=useState(0);
  const[userLocation,setUserLocation]=useState(null);
  const[locationDenied,setLocationDenied]=useState(false);
  const[emailSheet,setEmailSheet]=useState(null);
  const[splashVisible,setSplashVisible]=useState(true);
  const[feedVisible,setFeedVisible]=useState(false);
  const[showPWA,setShowPWA]=useState(false);
  const initialLoadsRef=useRef(0);
  const feedRevealedRef=useRef(false);
  const tapTimer=useRef(null);
  const mapRef=useRef(null);
  const gMapRef=useRef(null);
  const markersRef=useRef([]);
  const clustererRef=useRef(null);
  const[toastId,setToastId]=useState(null);
  const[toastVisible,setToastVisible]=useState(false);
  const toastTimer=useRef(null);
  const pwaTimer=useRef(null);
  const t=T[lang];
  window.__lvT=t;

  const revealFeed=()=>{
    if(feedRevealedRef.current)return;
    feedRevealedRef.current=true;
    setFeedVisible(true);
    setTimeout(()=>setSplashVisible(false),600);
    pwaTimer.current=setTimeout(()=>setShowPWA(true),3000);
  };

  const onCardImageLoad=()=>{
    initialLoadsRef.current+=1;
    if(initialLoadsRef.current>=INITIAL_CARDS_TO_WAIT){
      revealFeed();
    }
  };

  const sortShows=(data)=>{
    const now=new Date();
    const diffDays=(s)=>{
      if(s.openDate&&new Date(s.openDate)>now)return(new Date(s.openDate)-now)/86400000;
      if(s.closeDate)return(new Date(s.closeDate)-now)/86400000;
      return 999;
    };
    const tier=(s)=>{
      if(!s.openDate&&!s.closeDate)return 3;
      const od=s.openDate?new Date(s.openDate):null;
      const cd=s.closeDate?new Date(s.closeDate):null;
      const daysToOpen=od?(od-now)/86400000:null;
      const daysToClose=cd?(cd-now)/86400000:null;
      if(daysToOpen!==null&&daysToOpen>=0&&daysToOpen<=3)return 1;
      if(daysToClose!==null&&daysToClose>=0&&daysToClose<=3)return 1;
      if(daysToOpen!==null&&daysToOpen>=0&&daysToOpen<=7)return 2;
      if(daysToClose!==null&&daysToClose>=0&&daysToClose<=7)return 2;
      if(od&&cd&&od<=now&&cd>=now)return 2;
      return 3;
    };
    return dailyShuffle(data).sort((a,b)=>{
      const ta=tier(a),tb=tier(b);
      if(ta!==tb)return ta-tb;
      if(ta<3)return diffDays(a)-diffDays(b);
      return 0;
    });
  };

  useEffect(()=>{
    const CACHE_KEY="frame_shows_cache";
    try{
      const cached=localStorage.getItem(CACHE_KEY);
      if(cached){const parsed=JSON.parse(cached);if(parsed?.length){setSHOWS(sortShows(parsed));setLoading(false);}}
    }catch(_){}
    fetchShows().then(data=>{
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(data));}catch(_){}
      setSHOWS(sortShows(data));setLoading(false);
    }).catch(()=>{setLoadError(true);setLoading(false);revealFeed();});
    window.addEventListener("appinstalled",()=>capture("pwa_installed"));
    const fallback=setTimeout(()=>revealFeed(),4000);
    return()=>{clearTimeout(fallback);clearTimeout(pwaTimer.current);};
  },[]);

  useEffect(()=>{
    if(!loading&&!loadError){
      const featured=SHOWS.filter(s=>s.featured&&!s.between);
      if(featured.length===0)revealFeed();
      else if(featured.length<INITIAL_CARDS_TO_WAIT){
        initialLoadsRef.current+=INITIAL_CARDS_TO_WAIT-featured.length;
      }
    }
  },[loading,loadError,SHOWS]);

  const toggleSave=(id)=>setSaved(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const showToast=(id)=>{setToastId(id);setToastVisible(true);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToastVisible(false),2000);};

  const requestLocation=()=>{
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(
      pos=>setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}),
      ()=>setLocationDenied(true),
      {timeout:8000}
    );
  };

  useEffect(()=>{
    window.__lvOpen=(id)=>{const s=SHOWS.find(x=>x.id===id);if(s){setDetail(s);setDetailSource(tab);}};
    markersRef.current.forEach(m=>{
      if(m.iw.getMap()&&m.getInfoContent){m.iw.setContent(m.getInfoContent());}
    });
    return()=>{delete window.__lvOpen;};
  },[SHOWS,tab,t]);

  const handleHeaderTap=()=>{
    setTapCount(prev=>{
      const next=prev+1;clearTimeout(tapTimer.current);
      if(next>=5){setShowAdmin(true);return 0;}
      tapTimer.current=setTimeout(()=>setTapCount(0),2000);return next;
    });
  };

  const handleTabSwitch=(key)=>{
    capture("tab_switched",{tab:key,from:tab});
    setTab(key);
  };

  useEffect(()=>{
    if(tab!=="map")return;
    if(gMapRef.current)return;
    let activePulse=null;
    let PulseOverlay=null;

    const buildMarker=(google,map,s,position)=>{
      const icon={url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(pinSVG(s.featured,s.id)),scaledSize:new google.maps.Size(34,48),anchor:new google.maps.Point(17,48)};
      const marker=new google.maps.Marker({position,icon,title:s.gallery});
      const sa=shortAddr(s.address);
      const getInfoContent=()=>{
        const lv=window.__lvT||{};
        const dir=lv.getDirections||"Directions";
        const details=lv.details||"Details";
        return `<div style="width:220px;font-family:'DM Sans',sans-serif;background:#fff;border-radius:6px;overflow:hidden;"><div style="height:5px;background:${s.color};"></div><div style="padding:14px 15px;"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#2B5BE8;font-weight:700;margin-bottom:6px;">${s.gallery}</div><div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:600;color:#0F0E0C;line-height:1.2;margin-bottom:3px;">${s.title}</div><div style="font-size:12px;color:#6B6560;margin-bottom:10px;">${s.artist}</div><div style="font-size:11px;color:#9B9590;margin-bottom:13px;">📍 ${sa}</div><div style="display:flex;gap:6px;"><a href="${mapsUrl(s.address)}" target="_blank" style="flex:1;background:rgba(15,14,12,0.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,0.20);border-radius:20px;padding:4px 8px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;">${dir}<svg width="9" height="9" viewBox="0 0 12 12" fill="none" style="flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a><button onclick="window.__lvOpen('${s.id}')" ontouchend="event.preventDefault();window.__lvOpen('${s.id}')" style="flex:1;background:rgba(15,14,12,0.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,0.20);border-radius:20px;padding:4px 8px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;">${details}</button></div></div></div>`;
      };
      const infoWindow=new google.maps.InfoWindow({content:getInfoContent(),disableAutoPan:false});
      marker.addListener("click",()=>{
        markersRef.current.forEach(m=>m.iw.close());
        infoWindow.setContent(getInfoContent());
        infoWindow.open({anchor:marker,map});
        if(activePulse){activePulse.setMap(null);}
        const pulse=new PulseOverlay(marker.getPosition());
        pulse.setMap(map);
        activePulse=pulse;
        map.panTo(marker.getPosition());
        if(map.getZoom()<15)map.setZoom(15);
      });
      markersRef.current.push({id:s.id,marker,iw:infoWindow,getInfoContent});
      return marker;
    };
    const initMap=async()=>{
      if(!mapRef.current||gMapRef.current)return;
      const google=window.google;
      const map=new google.maps.Map(mapRef.current,{center:{lat:45.5080,lng:-73.5750},zoom:13,disableDefaultUI:true,zoomControl:true,clickableIcons:false,styles:[{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"transit",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#d4e4f0"}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#f5f4f0"}]}]});
      gMapRef.current=map;
      PulseOverlay=class extends google.maps.OverlayView {
        constructor(position){super();this.position=position;this.div=null;}
        onAdd(){
          const div=document.createElement("div");
          div.style.cssText="position:absolute;width:40px;height:40px;margin-left:-20px;margin-top:-20px;border-radius:50%;border:2.5px solid #2B5BE8;opacity:0;pointer-events:none;animation:mapPulse 1.8s ease-out infinite;";
          if(!document.getElementById("mapPulseStyle")){
            const s=document.createElement("style");s.id="mapPulseStyle";
            s.textContent="@keyframes mapPulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.4);opacity:0}}";
            document.head.appendChild(s);
          }
          this.div=div;
          this.getPanes().overlayMouseTarget.appendChild(div);
        }
        draw(){
          const proj=this.getProjection();
          const pt=proj.fromLatLngToDivPixel(this.position);
          if(pt&&this.div){this.div.style.left=pt.x+"px";this.div.style.top=(pt.y-14)+"px";}
        }
        onRemove(){if(this.div){this.div.parentNode?.removeChild(this.div);this.div=null;}}
      };
      map.addListener("click",()=>{markersRef.current.forEach(m=>m.iw.close());if(activePulse){activePulse.setMap(null);activePulse=null;}});
      const geocoder=new google.maps.Geocoder();
      const seenPositions={};
      const markers=await Promise.all(SHOWS.map(s=>new Promise(resolve=>{
        geocoder.geocode({address:s.address},(results,status)=>{
          let lat,lng;
          if(status==="OK"&&results[0]){lat=results[0].geometry.location.lat();lng=results[0].geometry.location.lng();}
          else{lat=s.lat||45.5080;lng=s.lng||-73.5750;}
          const key=lat.toFixed(5)+","+lng.toFixed(5);
          const count=seenPositions[key]=(seenPositions[key]||0)+1;
          if(count>1){const angle=(count-1)*(2*Math.PI/8);lat+=0.00008*Math.cos(angle);lng+=0.00008*Math.sin(angle);}
          resolve(buildMarker(google,map,s,{lat,lng}));
        });
      })));
      if(!window.markerClusterer){await new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});}
      const cl=new window.markerClusterer.MarkerClusterer({map,markers});
      clustererRef.current=cl;
      markersRef.current.forEach(m=>m.marker.setMap(map));
    };
    if(window.google&&window.google.maps){initMap();}
    else{const scriptId="gmap-script";if(!document.getElementById(scriptId)){window.__initGMap=initMap;const sc=document.createElement("script");sc.id=scriptId;sc.src=`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=__initGMap`;sc.async=true;document.head.appendChild(sc);}}
  },[tab,SHOWS]);

  useEffect(()=>{
    if(!gMapRef.current||!clustererRef.current)return;
    clustererRef.current.clearMarkers();
    markersRef.current.forEach(m=>m.marker.setMap(null));
    const toShow=mapMode==="plan"?markersRef.current.filter(m=>saved.has(m.id)):markersRef.current;
    toShow.forEach(m=>m.marker.setMap(gMapRef.current));
    clustererRef.current.addMarkers(toShow.map(m=>m.marker));
  },[mapMode,saved]);

  const allCurrent=SHOWS.filter(s=>!s.between&&(isOnNow(s)||isClosingToday(s)));
  const openingThisWeek=SHOWS.filter(s=>!s.between&&(isOpeningToday(s)||isOpeningThisWeek(s)));
  const closingThisWeek=SHOWS.filter(s=>!s.between&&(isClosingToday(s)||isClosingThisWeek(s)));
  const editorsPicks=SHOWS.filter(s=>!s.between&&s.editors_pick);
  const activeHoods=[...new Set(SHOWS.filter(s=>!s.between&&(isOnNow(s)||isClosingToday(s)||isOpeningToday(s)||isOpeningThisWeek(s))).map(s=>s.hood).filter(Boolean))].sort();
  const nearbyShows=userLocation
    ?SHOWS.filter(s=>!s.between&&(isOnNow(s)||isClosingToday(s)||isOpeningToday(s)||isOpeningThisWeek(s))&&s.lat&&s.lng&&distanceKm(userLocation.lat,userLocation.lng,s.lat,s.lng)<=NEARBY_RADIUS_KM)
      .sort((a,b)=>distanceKm(userLocation.lat,userLocation.lng,a.lat,a.lng)-distanceKm(userLocation.lat,userLocation.lng,b.lat,b.lng))
    :[];

  const openDetail=(s,source)=>{
    capture("show_tapped",{gallery:s.gallery,title:s.title,source,featured:s.featured});
    setDetail(s);setDetailSource(source);
  };
  const sourceLabel=detailSource==="featured"?t.featured:detailSource==="shows"?t.shows:t.map;

  const featuredSorted=(()=>{
    const featuredShows=SHOWS.filter(s=>s.featured&&!s.between);
    const tier=(s)=>{
      if(isClosingToday(s))return 1;
      if(isOpeningToday(s))return 2;
      if(isOpeningThisWeek(s))return 3;
      if(isClosingThisWeek(s))return 4;
      if(isOnNow(s))return 5;
      return 6;
    };
    const diffDays=(s)=>{
      if(s.openDate&&dayDiff(s.openDate)>0)return dayDiff(s.openDate);
      if(s.closeDate)return dayDiff(s.closeDate);
      return 999;
    };
    return dailyShuffle(featuredShows).sort((a,b)=>{
      const ta=tier(a),tb=tier(b);
      if(ta!==tb)return ta-tb;
      if(ta===3||ta===4)return diffDays(a)-diffDays(b);
      return 0;
    });
  })();

  const SectionRow=({title,onClick})=>(
    <div onClick={onClick} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{fontSize:18,fontWeight:600,color:INK}}>{title}</div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </div>
  );

  const tabs=[
    {key:"featured",label:t.featured,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 26 28" fill="none" strokeLinecap="round" strokeLinejoin="round"><defs><clipPath id="fc"><path d="M9 5 L17 5 L22 11 L13 26 L4 11 Z"/></clipPath></defs><path d="M9 5 L17 5 L22 11 L13 26 L4 11 Z" stroke={active?BLUE:MID} strokeWidth="1.5"/><line x1="4" y1="11" x2="22" y2="11" stroke={active?BLUE:MID} strokeWidth="1.5"/><line x1="9" y1="5" x2="4" y2="11" stroke={active?BLUE:MID} strokeWidth="0.6"/><line x1="17" y1="5" x2="22" y2="11" stroke={active?BLUE:MID} strokeWidth="0.6"/><line x1="9" y1="5" x2="13" y2="11" stroke={active?BLUE:MID} strokeWidth="0.6"/><line x1="17" y1="5" x2="13" y2="11" stroke={active?BLUE:MID} strokeWidth="0.6"/><line x1="4" y1="11" x2="13" y2="26" stroke={active?BLUE:MID} strokeWidth="0.6"/><line x1="22" y1="11" x2="13" y2="26" stroke={active?BLUE:MID} strokeWidth="0.6"/><g clipPath="url(#fc)"><line x1="4" y1="11" x2="22" y2="26" stroke={active?BLUE:MID} strokeWidth="0.5"/><line x1="22" y1="11" x2="4" y2="26" stroke={active?BLUE:MID} strokeWidth="0.5"/></g></svg>
    )},
    {key:"shows",label:t.shows,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round"><line x1="3" y1="6" x2="6" y2="6" stroke={active?BLUE:MID} strokeWidth="2.5"/><line x1="10" y1="6" x2="21" y2="6" stroke={active?BLUE:MID} strokeWidth="1"/><line x1="3" y1="12" x2="6" y2="12" stroke={active?BLUE:MID} strokeWidth="2.5"/><line x1="10" y1="12" x2="21" y2="12" stroke={active?BLUE:MID} strokeWidth="1"/><line x1="3" y1="18" x2="6" y2="18" stroke={active?BLUE:MID} strokeWidth="2.5"/><line x1="10" y1="18" x2="21" y2="18" stroke={active?BLUE:MID} strokeWidth="1"/></svg>
    )},
    {key:"map",label:t.map,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 22 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2C8.2 2 6 4.2 6 7c0 4 5 13 5 13s5-9 5-13c0-2.8-2.2-5-5-5z" stroke={active?BLUE:MID} strokeWidth="1.5"/><path d="M11 3.5 L11.3 6.7 L14.5 7 L11.3 7.3 L11 10.5 L10.7 7.3 L7.5 7 L10.7 6.7 Z" fill={active?BLUE:MID} stroke="none"/></svg>
    )},
    ...(FEATURES.reviews?[{key:"reviews",label:t.reviews,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )}]:[]),
  ];

  if(showAdmin)return<AdminPage onExit={()=>setShowAdmin(false)}/>;

  return(
    <div style={{background:"#1A1A18",width:"100vw",height:"100vh",display:"flex",justifyContent:"center"}}>
    <div style={{fontFamily:"'DM Sans',sans-serif",background:WHITE,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",width:"100%",maxWidth:430,position:"relative",boxShadow:"0 0 80px rgba(0,0,0,0.5)"}}>

      <SplashScreen visible={splashVisible}/>

      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,zIndex:10}}>
        <div onClick={handleHeaderTap} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",fontWeight:600,color:INK,cursor:"default",userSelect:"none"}}>{t.city}</div>
        <div style={{display:"flex",gap:4}}>
          {["en","fr"].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${lang===l?INK:BORDER}`,background:lang===l?INK:WHITE,color:lang===l?WHITE:MID,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflow:"hidden",position:"relative",background:WHITE,display:"flex",flexDirection:"column"}}>

        {tab==="featured"&&(
          <div style={{height:"100%",overflowY:"auto"}}>
            {loadError&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.error}</div>}
            {!loadError&&(()=>{
              if(featuredSorted.length===0)return(
                <div style={{padding:"60px 20px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",color:MID}}>No featured shows yet</div>
                </div>
              );
              return featuredSorted.map((s,i)=>(
                <FeaturedCard key={s.id} s={s} t={t} onClick={()=>openDetail(s,"featured")} saved={saved.has(s.id)}
                  onFirstImageLoad={i<INITIAL_CARDS_TO_WAIT?onCardImageLoad:undefined}
                  onToggleSave={()=>{toggleSave(s.id);showToast(s.id);capture("plan_toggled",{gallery:s.gallery,action:saved.has(s.id)?"removed":"added"});}}/>
              ));
            })()}
            <div style={{height:20}}/>
          </div>
        )}

        {tab==="shows"&&(
          <div style={{height:"100%",overflowY:"auto"}}>
            {loading&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.loading}</div>}
            {loadError&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.error}</div>}
            {!loading&&!loadError&&(<>
              {allCurrent.length>0&&<SectionRow title={t.allShows} onClick={()=>setSubPage({title:t.allShows,shows:allCurrent})}/>}
              {editorsPicks.length>0&&<SectionRow title={t.editorsPicks} onClick={()=>setSubPage({title:t.editorsPicks,shows:editorsPicks})}/>}
              {openingThisWeek.length>0&&<SectionRow title={t.openingThisWeek} onClick={()=>setSubPage({title:t.openingThisWeek,shows:openingThisWeek})}/>}
              {closingThisWeek.length>0&&<SectionRow title={t.closingThisWeek} onClick={()=>setSubPage({title:t.closingThisWeek,shows:closingThisWeek})}/>}
              {!userLocation&&!locationDenied&&(
                <div onClick={requestLocation} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    <span style={{fontSize:15,color:MID,fontWeight:500}}>{t.enableLocation}</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BORDER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              )}
              {userLocation&&nearbyShows.length>0&&<SectionRow title={t.nearby} onClick={()=>setSubPage({title:t.nearby,shows:nearbyShows})}/>}
              {activeHoods.map(hood=>{
                const hs=SHOWS.filter(s=>!s.between&&s.hood===hood&&(isOnNow(s)||isClosingToday(s)||isOpeningToday(s)||isOpeningThisWeek(s)));
                return hs.length>0?<SectionRow key={hood} title={hood} onClick={()=>setSubPage({title:hood,shows:hs})}/>:null;
              })}
              <div style={{padding:"32px 16px 48px",background:LIGHT,marginTop:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/></svg>,label:t.listYourShow,subtitle:t.listingSubtitle,action:()=>window.open("https://tally.so/r/D4Je7b","_blank")},
                    {icon:<svg width="24" height="24" viewBox="0 0 26 28" fill="none" strokeLinecap="round" strokeLinejoin="round"><defs><clipPath id="ctafc"><path d="M9 5 L17 5 L22 11 L13 26 L4 11 Z"/></clipPath></defs><path d="M9 5 L17 5 L22 11 L13 26 L4 11 Z" stroke={INK} strokeWidth="1.5"/><line x1="4" y1="11" x2="22" y2="11" stroke={INK} strokeWidth="1.5"/><line x1="9" y1="5" x2="4" y2="11" stroke={INK} strokeWidth="0.6"/><line x1="17" y1="5" x2="22" y2="11" stroke={INK} strokeWidth="0.6"/><line x1="9" y1="5" x2="13" y2="11" stroke={INK} strokeWidth="0.6"/><line x1="17" y1="5" x2="13" y2="11" stroke={INK} strokeWidth="0.6"/><line x1="4" y1="11" x2="13" y2="26" stroke={INK} strokeWidth="0.6"/><line x1="22" y1="11" x2="13" y2="26" stroke={INK} strokeWidth="0.6"/><g clipPath="url(#ctafc)"><line x1="4" y1="11" x2="22" y2="26" stroke={INK} strokeWidth="0.5"/><line x1="22" y1="11" x2="4" y2="26" stroke={INK} strokeWidth="0.5"/></g></svg>,label:t.featureYourShow,subtitle:t.featureSubtitle,action:()=>{capture("feature_tapped");window.open("https://tally.so/r/44Nz2o","_blank");}},
                    {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>,label:t.getInTouch,subtitle:null,action:()=>setEmailSheet({subject:"Hello from Frame",body:""})},
                    {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1C3.5 1 1 3.5 1 7c0 5 6 11 6 11s6-6 6-11c0-3.5-2.5-6-6-6z"/><circle cx="7" cy="7" r="2.5" fill="none" stroke={INK} strokeWidth="1.5"/><path d="M19 6C17 6 15.5 7.5 15.5 9.5c0 3 3.5 7 3.5 7s3.5-4 3.5-7c0-2-1.5-3.5-3.5-3.5z"/><circle cx="19" cy="9.5" r="1.8" fill="none" stroke={INK} strokeWidth="1.5"/><path d="M7 18 Q13 23 19 16" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3"/></svg>,label:t.comeToMyCity,subtitle:null,action:()=>window.open("https://tally.so/r/ja9zeJ","_blank")},
                  ].map(({icon,label,subtitle,action})=>(
                    <button key={label} onClick={action} style={{padding:"20px 16px",background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      {icon}
                      <span style={{fontSize:13,fontWeight:600,color:INK,textAlign:"center"}}>{label}</span>
                      {subtitle&&<span style={{fontSize:11,fontWeight:400,color:MID,textAlign:"center"}}>{subtitle}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>)}
          </div>
        )}

        <div style={{display:tab==="map"?"flex":"none",flexDirection:"column",height:"100%",position:"relative"}}>
          <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:1000,display:"flex",background:"rgba(255,255,255,0.35)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.5)",borderRadius:6,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            {[["all",t.allShows],["plan",t.myPlan]].map(([mode,label])=>(<button key={mode} onClick={()=>setMapMode(mode)} style={{padding:"9px 20px",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:mapMode===mode?"rgba(43,91,232,0.90)":"transparent",color:mapMode===mode?WHITE:"rgba(15,14,12,0.75)",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>{label}</button>))}
          </div>
          {mapMode==="plan"&&saved.size===0&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:999,textAlign:"center",pointerEvents:"none",padding:"0 40px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:MID,marginBottom:8}}>{t.noShowsInPlan}</div><div style={{fontSize:13,color:BORDER,lineHeight:1.6}}>{t.addFromShows}</div></div>)}
          <div ref={mapRef} style={{flex:1,width:"100%"}}/>
        </div>

        {FEATURES.reviews&&tab==="reviews"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{textAlign:"center",color:MID,fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic"}}>Reviews coming soon.</div>
          </div>
        )}
      </div>

      <div style={{background:WHITE,borderTop:`1px solid ${BORDER}`,display:"flex",flexShrink:0,paddingBottom:"max(env(safe-area-inset-bottom), 20px)",zIndex:10}}>
        {tabs.map(({key,label,icon})=>{
          const active=tab===key;
          return(
            <button key={key} onClick={()=>handleTabSwitch(key)} style={{flex:1,paddingTop:14,paddingBottom:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
              {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:2,borderRadius:2,background:BLUE}}/>}
              {icon(active)}
              <span style={{fontSize:10,fontWeight:active?700:500,letterSpacing:"0.06em",textTransform:"uppercase",color:active?BLUE:MID}}>{label}</span>
            </button>
          );
        })}
      </div>

      {subPage&&<ShowsSubPage title={subPage.title} shows={subPage.shows} onBack={()=>setSubPage(null)} onSelect={s=>{setSubPage(null);openDetail(s,"shows");}} saved={saved} toggleSave={toggleSave} t={t}/>}
      {detail&&<DetailPage detail={detail} sourceLabel={sourceLabel} onBack={()=>setDetail(null)} saved={saved} toggleSave={(id)=>{capture("plan_toggled",{gallery:detail.gallery,action:saved.has(id)?"removed":"added"});toggleSave(id);}} showToast={showToast} toastId={toastId} toastVisible={toastVisible} t={t} onVenue={()=>setVenuePage(detail)} onApptEmail={detail.contact_email?()=>setEmailSheet({email:detail.contact_email,subject:`Appointment request — ${detail.title}`,body:`Hi,\n\nI'd like to request a visit for "${detail.title}" by ${detail.artist}.\n\nThank you!`}):undefined}/>}
      {venuePage&&<VenuePage show={venuePage} onBack={()=>setVenuePage(null)} t={t} onEmailSheet={venuePage.contact_email?()=>setEmailSheet({email:venuePage.contact_email,subject:'Visit enquiry — '+venuePage.gallery,body:'Hi,\n\nI\'d like to get in touch regarding '+venuePage.gallery+'.\n\nThank you!'}):undefined}/>}
      {emailSheet&&<EmailSheet email={emailSheet.email||CONTACT_EMAIL} subject={emailSheet.subject} body={emailSheet.body} onClose={()=>setEmailSheet(null)}/>}
      {showPWA&&<PWAPrompt t={t} onDismiss={()=>setShowPWA(false)}/>}

      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @keyframes frameFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pwaFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pwaSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        *{-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{display:none;}
        .gm-style-iw{padding:0!important;border-radius:6px!important;overflow:hidden!important;}
        .gm-style-iw-d{overflow:hidden!important;padding:0!important;}
        .gm-style-iw-c{padding:0!important;border-radius:6px!important;box-shadow:0 12px 40px rgba(0,0,0,0.16)!important;}
        .gm-ui-hover-effect{top:4px!important;right:4px!important;}
        .gm-style-iw-tc{display:none!important;}
      `}</style>
    </div>
    </div>
  );
}
