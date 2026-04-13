import { useState, useEffect, useRef } from "react";

const FEATURES = { reviews: false };

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = "FrameReview26";

// ── Daily seed randomizer ─────────────────────────────────────────────────────
function getDailySeed(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function seededRandom(seed){let s=seed;return()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff;};}
function dailyShuffle(arr){const a=[...arr];const rand=seededRandom(getDailySeed());for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// ── Supabase ──────────────────────────────────────────────────────────────────
async function fetchShows(){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.approved&order=gallery.asc`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
  if(!res.ok)throw new Error("Failed to fetch shows");
  const data=await res.json();
  return data.map(s=>({
    id:s.id,gallery:s.gallery,title:s.title||"",artist:s.artist||"",
    dates:s.dates||"",openDate:s.open_date||"",closeDate:s.close_date||"",
    hood:s.neighbourhood||"",color:s.color||"#C8A882",
    reviewed:s.reviewed||false,featured:s.featured||false,
    editors_pick:s.editors_pick||false,between:s.between||false,
    quote:s.quote||"",by:s.quote_by||"",desc:s.description||"",
    address:s.address||"",hours:s.hours||"",
    image_url:s.image_url||null,image_url_2:s.image_url_2||null,
    image_url_3:s.image_url_3||null,image_url_4:s.image_url_4||null,
    image_url_5:s.image_url_5||null,
    website_url:s.website_url||null,instagram_url:s.instagram_url||null,
    lat:parseFloat(s.lat)||null,lng:parseFloat(s.lng)||null,
  }));
}

async function fetchPendingShows(){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.cleaned&order=created_at.desc`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
  if(!res.ok)throw new Error("Failed");
  return res.json();
}

async function updateShowStatus(id,status,featured){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?id=eq.${id}`,{method:"PATCH",headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({status,featured})});
  return res.ok;
}

// ── Translations ──────────────────────────────────────────────────────────────
const T={
  en:{
    city:"Montreal",featured:"Featured",shows:"Shows",map:"Map",reviews:"Reviews",
    allShows:"All Current Shows",neighbourhoods:"Neighbourhoods",editorsPicks:"Editor's Picks",
    openingThisWeek:"Opening This Week",closingThisWeek:"Closing This Week",
    myPlan:"My Plan",getDirections:"Directions to venue",openWebsite:"Open website",
    openInstagram:"Instagram",share:"Share",dates:"Dates",hours:"Hours",area:"Area",
    noShowsInPlan:"No shows in your plan yet",addFromShows:"Add shows from the Shows tab",
    frameReview:"Frame Review",onNow:"On Now",loading:"Loading…",error:"Could not load shows.",
    addToPlan:"Add to My Plan",inPlan:"In My Plan ✓",venue:"Venue",
    listYourShow:"List your show",featureYourShow:"Feature your show",
    sayHello:"Say hello",followUs:"Instagram",
  },
  fr:{
    city:"Montréal",featured:"En vedette",shows:"Expositions",map:"Carte",reviews:"Critiques",
    allShows:"Toutes les expositions",neighbourhoods:"Quartiers",editorsPicks:"Sélection",
    openingThisWeek:"Ouvertures cette semaine",closingThisWeek:"Fermetures cette semaine",
    myPlan:"Mon plan",getDirections:"Itinéraire",openWebsite:"Site web",
    openInstagram:"Instagram",share:"Partager",dates:"Dates",hours:"Heures",area:"Quartier",
    noShowsInPlan:"Aucune exposition dans votre plan",addFromShows:"Ajoutez des expositions depuis Expositions",
    frameReview:"Critique Frame",onNow:"En cours",loading:"Chargement…",error:"Impossible de charger.",
    addToPlan:"Ajouter à mon plan",inPlan:"Dans mon plan ✓",venue:"Lieu",
    listYourShow:"Soumettre une expo",featureYourShow:"Mettre en vedette",
    sayHello:"Nous écrire",followUs:"Instagram",
  }
};

const INK="#0F0E0C",BLUE="#2B5BE8",WHITE="#FFFFFF",BORDER="#E8E5E0",MID="#6B6560",LIGHT="#F4F4F4";
const FEATURED_COLOR="#F5A623";
const TODAY=new Date();

// ── Badge colors (FIX #4 — status badge colors) ───────────────────────────────
const BADGE_GREEN="rgba(26,122,74,0.85)";   // On Now
const BADGE_BLUE="rgba(26,74,138,0.85)";    // Opening Soon / Opening [day]
const BADGE_RED="rgba(204,26,26,0.85)";     // Closing Soon / Last Day

// ── Helpers ───────────────────────────────────────────────────────────────────
function isClosingThisWeek(s){if(!s.closeDate)return false;const d=(new Date(s.closeDate)-TODAY)/86400000;return d>=0&&d<=7;}
function isLastDay(s){if(!s.closeDate)return false;const d=(new Date(s.closeDate)-TODAY)/86400000;return d>=0&&d<1;}
function isOpeningThisWeek(s){if(!s.openDate)return false;const d=(new Date(s.openDate)-TODAY)/86400000;return d>=-1&&d<=7;}
function isOnNow(s){if(!s.openDate||!s.closeDate)return false;return new Date(s.openDate)<=TODAY&&new Date(s.closeDate)>=TODAY;}

// Returns {label, color} for the status badge
function statusBadgeInfo(s){
  // Closing states take priority if on now
  if(isOnNow(s)){
    if(isLastDay(s))return{label:"Last Day",color:BADGE_RED};
    if(isClosingThisWeek(s))return{label:"Closing Soon",color:BADGE_RED};
    return{label:"On Now",color:BADGE_GREEN};
  }
  // Opening states
  if(isOpeningThisWeek(s)&&!isOnNow(s)){
    const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const openDay=new Date(s.openDate);
    const diffDays=Math.round((openDay-TODAY)/86400000);
    const label=diffDays<=1?"Opening Soon":`Opening ${days[openDay.getDay()]}`;
    return{label,color:BADGE_BLUE};
  }
  return null;
}

function mapsUrl(addr){return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;}
function staticMapUrl(lat,lng){return`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&scale=2&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${GMAPS_KEY}&style=feature:poi|visibility:off`;}
function shortAddr(a){return a?a.replace(", Montréal, QC","").replace(", Montreal, QC",""):"";}
function getImages(s){return[s.image_url,s.image_url_2,s.image_url_3,s.image_url_4,s.image_url_5].filter(Boolean);}

function pinSVG(featured,id){
  const fid=id||"x";
  if(featured){return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pf${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pf${fid})"/><circle cx="17" cy="15" r="12" fill="#7BA7D4"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/><text x="17" y="20" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}
  return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pn${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pn${fid})"/><circle cx="17" cy="15" r="12" fill="#E8251A"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/></svg>`;
}

// ── Image Carousel (FIX #1 — full swipe rewrite with refs) ────────────────────
function ImageCarousel({slides,height=220}){
  const[idx,setIdx]=useState(0);
  const startX=useRef(null);
  const startY=useRef(null);
  const dragging=useRef(false);

  if(!slides||slides.length===0)return<div style={{height,background:LIGHT}}/>;
  if(slides.length===1)return(
    <div style={{height,overflow:"hidden"}}>
      <img src={slides[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
    </div>
  );

  const go=(n)=>setIdx(i=>Math.max(0,Math.min(slides.length-1,i+n)));

  return(
    <div
      style={{position:"relative",height,overflow:"hidden",touchAction:"pan-y"}}
      onTouchStart={e=>{
        startX.current=e.touches[0].clientX;
        startY.current=e.touches[0].clientY;
        dragging.current=false;
      }}
      onTouchMove={e=>{
        if(startX.current===null)return;
        const dx=Math.abs(e.touches[0].clientX-startX.current);
        const dy=Math.abs(e.touches[0].clientY-startY.current);
        if(dx>dy&&dx>8){
          dragging.current=true;
          e.preventDefault();
        }
      }}
      onTouchEnd={e=>{
        if(startX.current===null)return;
        const dx=e.changedTouches[0].clientX-startX.current;
        if(dragging.current&&Math.abs(dx)>40)go(dx<0?1:-1);
        startX.current=null;
        startY.current=null;
        dragging.current=false;
      }}
    >
      <div style={{display:"flex",height:"100%",transition:"transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)",transform:`translateX(-${idx*100}%)`}}>
        {slides.map((src,i)=>(
          <div key={i} style={{minWidth:"100%",height:"100%",flexShrink:0,overflow:"hidden"}}>
            <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,pointerEvents:"none"}}>
        {slides.map((_,i)=>(
          <div key={i} style={{width:i===idx?16:5,height:5,borderRadius:3,background:i===idx?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.4)",transition:"all 0.25s"}}/>
        ))}
      </div>
    </div>
  );
}

// ── Map Slide (FIX #2 — embed iframe instead of static map image) ─────────────
function MapSlide({show,height=220}){
  const hasCoords=show.lat&&show.lng&&!isNaN(show.lat)&&!isNaN(show.lng);
  const embedSrc=hasCoords
    ?`https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${show.lat},${show.lng}&zoom=15`
    :`https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${encodeURIComponent(show.address)}&zoom=15`;

  // Fallback if no key — show address tile
  if(!GMAPS_KEY){
    return(
      <div style={{height,background:"#f0ede8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,flexShrink:0}}>
        <div style={{fontSize:28}}>📍</div>
        <div style={{fontSize:14,fontWeight:600,color:INK,textAlign:"center",padding:"0 24px",lineHeight:1.4}}>{shortAddr(show.address)}</div>
        <a href={mapsUrl(show.address)} target="_blank" rel="noopener noreferrer"
          style={{background:INK,color:WHITE,borderRadius:6,padding:"9px 18px",fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",textDecoration:"none",marginTop:4}}>
          Open in Maps ↗
        </a>
      </div>
    );
  }

  return(
    <div style={{height,position:"relative",flexShrink:0,overflow:"hidden"}}>
      <iframe
        title="Exhibition location"
        width="100%"
        height="100%"
        style={{border:0,display:"block",pointerEvents:"none"}}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedSrc}
      />
      {/* Tap overlay — opens maps app */}
      <a
        href={mapsUrl(show.address)}
        target="_blank"
        rel="noopener noreferrer"
        style={{position:"absolute",inset:0,zIndex:2,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:12,textDecoration:"none"}}
      >
        <div style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(6px)",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:700,color:INK,boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
          Directions ↗
        </div>
      </a>
    </div>
  );
}

// ── Featured Card (FIX #3 — full-bleed image + gradient overlay, 220px height) ─
function FeaturedCard({s,onClick}){
  const badgeInfo=statusBadgeInfo(s);
  const images=getImages(s);

  return(
    <div onClick={onClick} style={{cursor:"pointer",marginBottom:12,borderRadius:12,overflow:"hidden",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
      {/* Full-bleed image */}
      <div style={{position:"relative",height:220,overflow:"hidden",background:s.color||LIGHT}}>
        {images.length>0?(
          <ImageCarousel slides={images} height={220}/>
        ):(
          <div style={{width:"100%",height:"100%",background:s.color||LIGHT}}/>
        )}

        {/* Dark gradient over bottom 45% */}
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.38) 42%, transparent 68%)",
          pointerEvents:"none",zIndex:1
        }}/>

        {/* Text overlay */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"16px 16px 14px",zIndex:2}}>
          <div style={{fontSize:10,letterSpacing:"0.13em",textTransform:"uppercase",color:"rgba(255,255,255,0.75)",fontWeight:700,marginBottom:4}}>{s.gallery}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontStyle:"italic",fontWeight:600,color:WHITE,lineHeight:1.2,marginBottom:3}}>{s.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.80)"}}>{s.artist}{s.hood?` · ${s.hood}`:""}</div>
        </div>

        {/* Status badge top-right */}
        {badgeInfo&&(
          <div style={{
            position:"absolute",top:12,right:12,
            background:badgeInfo.color,
            backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
            color:WHITE,fontSize:10,fontWeight:700,
            letterSpacing:"0.10em",textTransform:"uppercase",
            padding:"5px 10px",borderRadius:4,zIndex:3,
            border:"1px solid rgba(255,255,255,0.20)"
          }}>{badgeInfo.label}</div>
        )}
      </div>
    </div>
  );
}

// ── Text Card ─────────────────────────────────────────────────────────────────
function TextCard({s,onClick}){
  const badgeInfo=statusBadgeInfo(s);
  return(
    <div onClick={onClick} style={{padding:"16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:5}}>{s.gallery}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",fontWeight:600,color:INK,lineHeight:1.2,marginBottom:4}}>{s.title}</div>
        <div style={{fontSize:15,color:MID,marginBottom:4}}>{s.artist}</div>
        <div style={{fontSize:13,color:MID}}>{s.hood}{s.dates?` · ${s.dates}`:""}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
        {badgeInfo&&(
          <span style={{
            fontSize:10,padding:"3px 8px",
            background:badgeInfo.color,
            color:WHITE,borderRadius:3,fontWeight:700,
            letterSpacing:"0.08em",textTransform:"uppercase"
          }}>{badgeInfo.label}</span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BORDER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>
  );
}

// ── Shows Sub Page ────────────────────────────────────────────────────────────
function ShowsSubPage({title,shows,onBack,onSelect}){
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
        {shows.map(s=><TextCard key={s.id} s={s} onClick={()=>onSelect(s)}/>)}
      </div>
    </div>
  );
}

// ── Venue Page ────────────────────────────────────────────────────────────────
function VenuePage({show,onBack,t}){
  const hasCoords=show.lat&&show.lng&&!isNaN(show.lat)&&!isNaN(show.lng);
  return(
    <div style={{position:"fixed",inset:0,background:WHITE,zIndex:2500,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",animation:"slideUp 0.28s cubic-bezier(0.16,1,0.3,1)"}}>
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

      {/* FIX #2 — use MapSlide component for venue page map too */}
      <MapSlide show={show} height={200}/>

      <div style={{borderTop:`1px solid ${BORDER}`}}>
        <a href={mapsUrl(show.address)} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,textDecoration:"none",color:BLUE,fontSize:16,fontWeight:500}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          {t.getDirections}
        </a>
        {show.website_url&&(
          <a href={show.website_url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,textDecoration:"none",color:BLUE,fontSize:16,fontWeight:500}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {t.openWebsite}
          </a>
        )}
        {show.instagram_url&&(
          <a href={show.instagram_url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,textDecoration:"none",color:BLUE,fontSize:16,fontWeight:500}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            {t.openInstagram}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Detail Page ───────────────────────────────────────────────────────────────
function DetailPage({detail,sourceLabel,onBack,saved,toggleSave,showToast,toastId,toastVisible,t,onVenue}){
  const images=getImages(detail);
  const slides=detail.featured?images:images; // map slide removed from detail carousel, lives in venue page
  const on=saved.has(detail.id);

  return(
    <div style={{position:"fixed",inset:0,background:WHITE,zIndex:2000,overflowY:"auto",animation:"slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",maxWidth:430,margin:"0 auto"}}>
      <div style={{position:"sticky",top:0,background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",padding:"0 4px",zIndex:10,flexShrink:0}}>
        <button onClick={onBack} style={{height:"100%",padding:"0 20px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",minWidth:44}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{fontSize:16,fontWeight:600,color:INK}}>{sourceLabel}</span>
        </button>
      </div>

      {/* Image */}
      {slides.length>1?(
        <ImageCarousel slides={slides} height={280}/>
      ):(
        <div style={{width:"100%",height:240,background:detail.color,position:"relative",overflow:"hidden"}}>
          {detail.image_url&&<img src={detail.image_url} alt={detail.title} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>}
        </div>
      )}

      <div style={{padding:"24px 20px 0"}}>
        <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:8}}>{detail.gallery}</div>
        {!detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontStyle:"italic",fontWeight:500,lineHeight:1.15,marginBottom:6}}>{detail.title}</div>}
        {!detail.between&&detail.artist&&<div style={{fontSize:17,fontWeight:400,marginBottom:20,color:INK}}>{detail.artist}</div>}

        {!detail.between&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",border:`1px solid ${BORDER}`,borderRadius:4,marginBottom:16,overflow:"hidden"}}>
            {[[t.dates,detail.dates],[t.hours,detail.hours||"—"],[t.area,detail.hood]].map(([label,val],i)=>(
              <div key={label} style={{padding:"13px 10px",textAlign:"center",borderRight:i<2?`1px solid ${BORDER}`:"none"}}>
                <div style={{fontSize:10,letterSpacing:"0.10em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:5}}>{label}</div>
                <div style={{fontSize:13,fontWeight:600,lineHeight:1.3,color:INK}}>{val}</div>
              </div>
            ))}
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

        <button onClick={()=>{if(navigator.share){navigator.share({title:`${detail.title} — ${detail.gallery}`,url:window.location.href});}else{navigator.clipboard?.writeText(window.location.href);}}} style={{width:"100%",padding:"14px 0",borderRadius:4,border:`1.5px solid ${BORDER}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",marginBottom:40,fontFamily:"'DM Sans',sans-serif"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:MID}}>{t.share}</span>
        </button>
      </div>
    </div>
  );
}

// ── Admin Page (FIX #5 — Remove button fixed with stopPropagation + explicit id) ─
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
    const featured=featuredMap[id]||false;
    const ok=await updateShowStatus(id,status,featured);
    if(ok){setPendingShows(prev=>prev.filter(s=>s.id!==id));setActionStates(prev=>({...prev,[id]:"done"}));}
    else{setActionStates(prev=>({...prev,[id]:"error"}));}
  };

  // FIX #5 — explicit id parameter, stopPropagation, confirmation, optimistic filter
  const handleRemove=async(e,id,title)=>{
    e.stopPropagation();
    const confirmed=window.confirm(`Remove "${title}"?`);
    if(!confirmed)return;
    setActionStates(prev=>({...prev,[id]:"removing"}));
    const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?id=eq.${id}`,{
      method:"PATCH",
      headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",Prefer:"return=minimal"},
      body:JSON.stringify({status:"rejected"})
    });
    if(res.ok){
      setLiveShows(prev=>prev.filter(s=>s.id!==id));
      setActionStates(prev=>({...prev,[id]:"done"}));
    }else{
      setActionStates(prev=>({...prev,[id]:"error"}));
      alert("Failed to remove. Check console.");
    }
  };

  if(!authed)return(
    <div style={{position:"fixed",inset:0,background:INK,zIndex:3000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,maxWidth:430,margin:"0 auto"}}>
      <div style={{marginBottom:8,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:MID,fontWeight:600}}>Frame</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontStyle:"italic",color:WHITE,marginBottom:40}}>Admin</div>
      <div style={{width:"100%",maxWidth:300}}>
        <input type="password" value={pwInput} onChange={e=>setPwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password" autoFocus style={{width:"100%",padding:"14px 16px",borderRadius:4,fontSize:15,border:`1.5px solid ${pwError?"#E8251A":"#333"}`,background:"#1A1A18",color:WHITE,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",animation:pwError?"shake 0.3s ease":"none"}}/>
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
              {/* FIX #5 — pass e and explicit id + title to handleRemove */}
              <button
                onClick={(e)=>handleRemove(e,s.id,s.title||"this show")}
                disabled={actionStates[s.id]==="removing"}
                style={{flexShrink:0,padding:"7px 14px",border:`1px solid #E8251A`,borderRadius:3,background:WHITE,color:"#E8251A",fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}
              >
                {actionStates[s.id]==="removing"?"…":"Remove"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
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
  const tapTimer=useRef(null);
  const mapRef=useRef(null);
  const gMapRef=useRef(null);
  const markersRef=useRef([]);
  const clustererRef=useRef(null);
  const[toastId,setToastId]=useState(null);
  const[toastVisible,setToastVisible]=useState(false);
  const toastTimer=useRef(null);
  const t=T[lang];

  useEffect(()=>{
    fetchShows().then(data=>{setSHOWS(dailyShuffle(data));setLoading(false);}).catch(()=>{setLoadError(true);setLoading(false);});
  },[]);

  const toggleSave=(id)=>setSaved(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const showToast=(id)=>{setToastId(id);setToastVisible(true);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToastVisible(false),2000);};

  useEffect(()=>{
    window.__lvOpen=(id)=>{const s=SHOWS.find(x=>x.id===id);if(s){setDetail(s);setDetailSource(tab);}};
    return()=>{delete window.__lvOpen;};
  },[SHOWS,tab]);

  const handleHeaderTap=()=>{
    setTapCount(prev=>{
      const next=prev+1;clearTimeout(tapTimer.current);
      if(next>=5){setShowAdmin(true);return 0;}
      tapTimer.current=setTimeout(()=>setTapCount(0),2000);return next;
    });
  };

  useEffect(()=>{
    if(tab!=="map")return;
    if(gMapRef.current)return;
    const buildMarker=(google,map,s,position)=>{
      const icon={url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(pinSVG(s.featured,s.id)),scaledSize:new google.maps.Size(34,48),anchor:new google.maps.Point(17,48)};
      const marker=new google.maps.Marker({position,icon,title:s.gallery});
      const sa=shortAddr(s.address);
      const infoContent=`<div style="width:220px;font-family:'DM Sans',sans-serif;background:#fff;border-radius:6px;overflow:hidden;"><div style="height:5px;background:${s.color};"></div><div style="padding:14px 15px;"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#2B5BE8;font-weight:700;margin-bottom:6px;">${s.gallery}</div><div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:600;color:#0F0E0C;line-height:1.2;margin-bottom:3px;">${s.title}</div><div style="font-size:12px;color:#6B6560;margin-bottom:10px;">${s.artist}</div><div style="font-size:11px;color:#9B9590;margin-bottom:13px;">📍 ${sa}</div><div style="display:flex;gap:8px;"><a href="${mapsUrl(s.address)}" target="_blank" style="flex:1;background:#F4F4F4;color:#0F0E0C;border:none;padding:10px 0;border-radius:3px;font-size:9px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;display:flex;align-items:center;justify-content:center;">Directions</a><button onclick="window.__lvOpen('${s.id}')" ontouchend="event.preventDefault();window.__lvOpen('${s.id}')" style="flex:1;background:#0F0E0C;color:#fff;border:none;padding:10px 0;border-radius:3px;font-size:9px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">View →</button></div></div></div>`;
      const infoWindow=new google.maps.InfoWindow({content:infoContent,disableAutoPan:false});
      marker.addListener("click",()=>{markersRef.current.forEach(m=>m.iw.close());infoWindow.open({anchor:marker,map});});
      markersRef.current.push({id:s.id,marker,iw:infoWindow});
      return marker;
    };
    const initMap=async()=>{
      if(!mapRef.current||gMapRef.current)return;
      const google=window.google;
      const map=new google.maps.Map(mapRef.current,{center:{lat:45.5080,lng:-73.5750},zoom:13,disableDefaultUI:true,zoomControl:true,clickableIcons:false,styles:[{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"transit",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#d4e4f0"}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#f5f4f0"}]}]});
      gMapRef.current=map;
      map.addListener("click",()=>{markersRef.current.forEach(m=>m.iw.close());});
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

  // ── FIX #6 — Shows tab data (correct order: All → Opening → Closing → Nearby → Hoods)
  const allCurrent=SHOWS.filter(s=>!s.between&&isOnNow(s));
  const openingThisWeek=SHOWS.filter(s=>!s.between&&isOpeningThisWeek(s)&&!isOnNow(s));
  const closingThisWeek=SHOWS.filter(s=>!s.between&&isClosingThisWeek(s));
  const editorsPicks=SHOWS.filter(s=>!s.between&&s.editors_pick);
  const activeHoods=[...new Set(SHOWS.filter(s=>!s.between&&(isOnNow(s)||isOpeningThisWeek(s))).map(s=>s.hood).filter(Boolean))].sort();

  const openDetail=(s,source)=>{setDetail(s);setDetailSource(source);};
  const sourceLabel=detailSource==="featured"?"Featured":detailSource==="shows"?"Shows":"Map";

  const tabs=[
    {key:"featured",label:t.featured,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )},
    {key:"shows",label:t.shows,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    )},
    {key:"map",label:t.map,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    )},
    ...(FEATURES.reviews?[{key:"reviews",label:t.reviews,icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )}]:[]),
  ];

  if(showAdmin)return<AdminPage onExit={()=>setShowAdmin(false)}/>;

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:WHITE,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",maxWidth:430,margin:"0 auto",position:"relative",boxShadow:"0 0 60px rgba(0,0,0,0.08)"}}>

      {/* Header */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,zIndex:10}}>
        <div onClick={handleHeaderTap} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",fontWeight:600,color:INK,cursor:"default",userSelect:"none"}}>{t.city}</div>
        <div style={{display:"flex",gap:4}}>
          {["en","fr"].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${lang===l?INK:BORDER}`,background:lang===l?INK:WHITE,color:lang===l?WHITE:MID,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"hidden",position:"relative",background:WHITE,display:"flex",flexDirection:"column"}}>

        {/* FEATURED — FIX #3: 12px padding + rounded cards, 220px height shows 3 on screen */}
        {tab==="featured"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"12px 12px 0"}}>
            {loading&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.loading}</div>}
            {loadError&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.error}</div>}
            {!loading&&!loadError&&SHOWS.filter(s=>s.featured&&!s.between).length===0&&(
              <div style={{padding:"60px 20px",textAlign:"center"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",color:MID}}>No featured shows yet</div>
              </div>
            )}
            {!loading&&!loadError&&SHOWS.filter(s=>s.featured&&!s.between).map(s=>(
              <FeaturedCard key={s.id} s={s} onClick={()=>openDetail(s,"featured")}/>
            ))}
            <div style={{height:20}}/>
          </div>
        )}

        {/* SHOWS — FIX #6: correct section order */}
        {tab==="shows"&&(
          <div style={{height:"100%",overflowY:"auto"}}>
            {loading&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.loading}</div>}
            {loadError&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.error}</div>}
            {!loading&&!loadError&&(<>

              {/* 1. All Current Shows */}
              {allCurrent.length>0&&(
                <div onClick={()=>setSubPage({title:t.allShows,shows:allCurrent})} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:600,color:INK,marginBottom:3}}>{t.allShows}</div>
                    <div style={{fontSize:14,color:MID}}>{allCurrent.length} exhibitions</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              )}

              {/* 2. Opening This Week */}
              {openingThisWeek.length>0&&(
                <div onClick={()=>setSubPage({title:t.openingThisWeek,shows:openingThisWeek})} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:600,color:INK,marginBottom:3}}>{t.openingThisWeek}</div>
                    <div style={{fontSize:14,color:MID}}>{openingThisWeek.length} exhibitions</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              )}

              {/* 3. Closing This Week */}
              {closingThisWeek.length>0&&(
                <div onClick={()=>setSubPage({title:t.closingThisWeek,shows:closingThisWeek})} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:600,color:INK,marginBottom:3}}>{t.closingThisWeek}</div>
                    <div style={{fontSize:14,color:MID}}>{closingThisWeek.length} exhibitions</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              )}

              {/* 4. Nearby — placeholder until geolocation is built */}

              {/* 5. Neighbourhoods */}
              {activeHoods.map(hood=>{
                const hs=SHOWS.filter(s=>!s.between&&s.hood===hood&&(isOnNow(s)||isOpeningThisWeek(s)));
                return hs.length>0?(
                  <div key={hood} onClick={()=>setSubPage({title:hood,shows:hs})} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:600,color:INK,marginBottom:3}}>{hood}</div>
                      <div style={{fontSize:14,color:MID}}>{hs.length} {hs.length===1?"exhibition":"exhibitions"}</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                ):null;
              })}

              {/* Editor's Picks — after neighbourhoods */}
              {editorsPicks.length>0&&(
                <div onClick={()=>setSubPage({title:t.editorsPicks,shows:editorsPicks})} style={{padding:"20px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:600,color:INK,marginBottom:3}}>{t.editorsPicks}</div>
                    <div style={{fontSize:14,color:MID}}>{editorsPicks.length} exhibitions</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              )}

              {/* 2×2 CTA Grid — unchanged */}
              <div style={{padding:"32px 16px 48px",background:LIGHT,marginTop:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {icon:"📋",label:t.listYourShow,action:()=>window.open("https://tally.so/r/D4Je7b","_blank")},
                    {icon:"⭐",label:t.featureYourShow,action:()=>window.open("mailto:hello@useframe.ca","_blank")},
                    {icon:"✉",label:t.sayHello,action:()=>window.open("mailto:hello@useframe.ca","_blank")},
                    {icon:"📷",label:t.followUs,action:()=>window.open("https://instagram.com/useframe.ca","_blank")},
                  ].map(({icon,label,action})=>(
                    <button key={label} onClick={action} style={{padding:"20px 16px",background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      <span style={{fontSize:24}}>{icon}</span>
                      <span style={{fontSize:13,fontWeight:600,color:INK,textAlign:"center"}}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* MAP */}
        <div style={{display:tab==="map"?"flex":"none",flexDirection:"column",height:"100%",position:"relative"}}>
          <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:1000,display:"flex",background:"rgba(255,255,255,0.35)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.5)",borderRadius:6,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            {[["all","All Shows"],["plan",t.myPlan]].map(([mode,label])=>(<button key={mode} onClick={()=>setMapMode(mode)} style={{padding:"9px 20px",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:mapMode===mode?"rgba(43,91,232,0.90)":"transparent",color:mapMode===mode?WHITE:"rgba(15,14,12,0.75)",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>{label}</button>))}
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

      {/* Bottom Tab Bar */}
      <div style={{background:WHITE,borderTop:`1px solid ${BORDER}`,display:"flex",flexShrink:0,paddingBottom:"max(env(safe-area-inset-bottom), 20px)",zIndex:10}}>
        {tabs.map(({key,label,icon})=>{
          const active=tab===key;
          return(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,paddingTop:14,paddingBottom:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
              {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:2,borderRadius:2,background:BLUE}}/>}
              {icon(active)}
              <span style={{fontSize:10,fontWeight:active?700:500,letterSpacing:"0.06em",textTransform:"uppercase",color:active?BLUE:MID}}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Shows Sub Page */}
      {subPage&&(
        <ShowsSubPage
          title={subPage.title}
          shows={subPage.shows}
          onBack={()=>setSubPage(null)}
          onSelect={s=>{setSubPage(null);openDetail(s,"shows");}}
        />
      )}

      {/* Detail Page */}
      {detail&&(
        <DetailPage
          detail={detail}
          sourceLabel={sourceLabel}
          onBack={()=>setDetail(null)}
          saved={saved}
          toggleSave={toggleSave}
          showToast={showToast}
          toastId={toastId}
          toastVisible={toastVisible}
          t={t}
          onVenue={()=>setVenuePage(detail)}
        />
      )}

      {/* Venue Page */}
      {venuePage&&(
        <VenuePage
          show={venuePage}
          onBack={()=>setVenuePage(null)}
          t={t}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        *{-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{display:none;}
        .gm-style-iw{padding:0!important;border-radius:6px!important;overflow:hidden!important;}
        .gm-style-iw-d{overflow:hidden!important;padding:0!important;}
        .gm-style-iw-c{padding:0!important;border-radius:6px!important;box-shadow:0 12px 40px rgba(0,0,0,0.16)!important;}
        .gm-ui-hover-effect{top:4px!important;right:4px!important;}
        .gm-style-iw-tc{display:none!important;}
      `}</style>
    </div>
  );
}
