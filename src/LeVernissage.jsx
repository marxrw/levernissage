import { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";

// ─── Feature flags ────────────────────────────────────────────────────────────
const FEATURES = {
  reviews: false, // Hidden for stealth launch. Planned re-enable ~3 months out.
};

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const SHOWS = [
  { id:"blouin", gallery:"Blouin Division", title:"Corps de mémoire", artist:"Marie-Claire Leblanc", dates:"Mar 15 – Apr 26", openDate:"2026-03-15", closeDate:"2026-04-26", hood:"Griffintown", color:"#C8A882", reviewed:true, featured:false, between:false, quote:'"This is painting that understands its own slowness. Leblanc isn\'t working against the speed of the contemporary image — she\'s simply uninterested in it. That refusal feels quietly radical."', by:"Sophie Tran · April 8, 2026", desc:"Leblanc's paintings arrive quietly. Layered in beeswax and pigment, each surface holds time the way skin does — recording pressure, warmth, and the slow work of forgetting.", address:"2020 rue William, Montréal, QC", lat:45.4887, lng:-73.5658 },
  { id:"bradley", gallery:"Bradley Ertaskiran", title:"Still Frequency", artist:"James Nizam", dates:"Mar 28 – May 3", openDate:"2026-03-28", closeDate:"2026-05-03", hood:"Saint-Henri", color:"#8BAEC4", reviewed:true, featured:false, between:false, quote:'"Nizam makes you aware of how much light is happening in any given room, unnoticed. These are arguments for a different quality of attention."', by:"Marc Durand · April 2, 2026", desc:"Nizam's photographs treat light as a sculptural material, capturing moments where beams, reflections and shadows form geometries too fleeting for the unaided eye.", address:"3550 rue Saint-Antoine Ouest, Montréal, QC", lat:45.4748, lng:-73.5831 },
  { id:"charbonneau", gallery:"Hugues Charbonneau", title:"Lisières", artist:"Dominique Blain", dates:"Mar 6 – Apr 19", openDate:"2026-03-06", closeDate:"2026-04-19", hood:"Downtown", color:"#8DAA88", reviewed:false, featured:true, between:false, desc:"Blain's practice occupies the space between document and testimony. Works on paper and installation navigating the edges of political memory.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"mcbride", gallery:"McBride Contemporain", title:"Terrain vague", artist:"Nadia Myre", dates:"Apr 4 – May 10", openDate:"2026-04-04", closeDate:"2026-05-10", hood:"Downtown", color:"#6A6058", reviewed:false, featured:true, between:false, desc:"Myre's work sits at the intersection of language, land and Anishinaabe knowledge systems. New textile and mixed-media works.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"ellephant", gallery:"ELLEPHANT", title:"Soft Infrastructure", artist:"Group Show", dates:"Mar 20 – Apr 30", openDate:"2026-03-20", closeDate:"2026-04-30", hood:"Quartier des spectacles", color:"#B86040", reviewed:false, featured:true, between:false, desc:"Five artists consider the systems of care — emotional, domestic, civic — that make collective life possible.", address:"1201 rue Saint-Dominique, Montréal, QC", lat:45.5124, lng:-73.5591 },
  { id:"blais", gallery:"Galerie Simon Blais", title:"Feux pâles", artist:"Robert Wolfe", dates:"Apr 3 – May 17", openDate:"2026-04-03", closeDate:"2026-05-17", hood:"Mile-End", color:"#7888A0", reviewed:false, featured:true, between:false, desc:"A career retrospective of one of Quebec's most distinctive abstract painters. Large-scale canvases between restraint and eruption.", address:"5420 boulevard Saint-Laurent, Montréal, QC", lat:45.5276, lng:-73.5987 },
  { id:"artmur", gallery:"Art Mûr", title:"Double Bind", artist:"Gwenaël Bélanger", dates:"Mar 21 – May 2", openDate:"2026-03-21", closeDate:"2026-05-02", hood:"Rosemont", color:"#C4907A", reviewed:false, featured:true, between:false, desc:"Bélanger's photographs stage impossible perceptual situations — images that look documentary but couldn't be.", address:"5826 rue Saint-Hubert, Montréal, QC", lat:45.5383, lng:-73.5849 },
  { id:"pangee", gallery:"Pangée", title:"Matière première", artist:"Sébastien Cliche", dates:"Apr 2 – May 8", openDate:"2026-04-02", closeDate:"2026-05-08", hood:"Mile-End", color:"#A89070", reviewed:false, featured:true, between:false, desc:"Cliche's sculptural practice excavates industrial materials, finding tenderness in concrete, rust, and reclaimed steel.", address:"1305 avenue des Pins Ouest, Montréal, QC", lat:45.5092, lng:-73.5932 },
  { id:"duran", gallery:"Duran Contemporain", title:"How to Hold Hands", artist:"Holly MacKinnon", dates:"Mar 26 – Apr 18", openDate:"2026-03-26", closeDate:"2026-04-18", hood:"Downtown", color:"#B0A090", reviewed:false, featured:true, between:false, desc:"MacKinnon's paintings explore the quiet language of touch and proximity — gestures of care rendered in soft, luminous fields of colour.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"nicolasrobert", gallery:"Galerie Nicolas Robert", title:"Chambres d'écho", artist:"Maude Corriveau", dates:"Mar – Apr 2026", openDate:"2026-03-01", closeDate:"2026-04-30", hood:"Griffintown", color:"#9AA8B0", reviewed:false, featured:true, between:false, desc:"Corriveau's practice investigates resonance and repetition — spaces where image and memory fold back on themselves.", address:"201 rue Bartlett, Montréal, QC", lat:45.4892, lng:-73.5669 },
  { id:"chiguer", gallery:"Chiguer Art Contemporain", title:"Façades", artist:"Various Artists", dates:"Mar – Apr 2026", openDate:"2026-03-01", closeDate:"2026-04-30", hood:"Downtown", color:"#C0B8A8", reviewed:false, featured:false, between:false, desc:"An exhibition exploring the relationship between architectural surfaces and pictorial representation — what is presented as visible, and what lies beneath.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"elikerr", gallery:"Galerie Eli Kerr", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Mile-End", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Galerie Eli Kerr is currently between exhibitions. The gallery represents an intergenerational program of artists working across sculpture, drawing, video, photography, and installation.", address:"4647 boulevard Saint-Laurent, Montréal, QC", lat:45.5201, lng:-73.5983 },
  { id:"patrickmikhail", gallery:"Patrick Mikhail Gallery", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Mile-End", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Patrick Mikhail Gallery is currently between exhibitions. The gallery represents emerging and mid-career women artists working across painting, photography, installation, and new media.", address:"4815 boulevard Saint-Laurent, Montréal, QC", lat:45.5218, lng:-73.5979 },
  { id:"robertsonares", gallery:"Galerie Robertson Arès", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Downtown", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Galerie Robertson Arès is currently between exhibitions. The gallery focuses on bold contemporary work by international and Canadian artists.", address:"1350 rue Sherbrooke Ouest, Montréal, QC", lat:45.4983, lng:-73.5793 },
  { id:"robertpoulin", gallery:"Galerie Robert Poulin", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Mile-End", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Galerie Robert Poulin is currently between exhibitions. The gallery specializes in art brut, underground art, and narrative figuration.", address:"6341 boulevard Saint-Laurent, Montréal, QC", lat:45.5341, lng:-73.5973 },
  { id:"patelbrownmtl", gallery:"Patel Brown", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Downtown", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Patel Brown's Montreal location is currently between exhibitions. The gallery represents emerging and established Canadian artists.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"pfoac", gallery:"Pierre-François Ouellette art contemporain", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Plateau", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"PFOAC is currently between exhibitions. One of Montreal's most respected galleries, located on Rachel Street near Parc La Fontaine.", address:"4402 boulevard Saint-Laurent, Montréal, QC", lat:45.5189, lng:-73.5863 },
  { id:"tian", gallery:"TIAN Contemporain", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Downtown", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"TIAN Contemporain is currently between exhibitions. The gallery presents contemporary art with a focus on emerging voices.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"galcoa", gallery:"Galerie C.O.A", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Downtown", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Galerie C.O.A is currently between exhibitions. A dynamic space in the Belgo Building presenting contemporary Quebec and Canadian art.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"bellemarelambert", gallery:"Galeries Bellemare Lambert", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Downtown", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Galeries Bellemare Lambert is currently between exhibitions. The gallery presents historical modern and contemporary Quebec art.", address:"372 rue Sainte-Catherine Ouest, Montréal, QC", lat:45.5011, lng:-73.5694 },
  { id:"yves", gallery:"Yves Laroche Galerie d'art", title:"Between Exhibitions", artist:"", dates:"", openDate:"2026-04-08", closeDate:"2026-04-08", hood:"Mile-End", color:"#D8D4CC", reviewed:false, featured:false, between:true, desc:"Yves Laroche Galerie d'art is currently between exhibitions. The gallery specializes in street art, pop art, and urban contemporary art.", address:"4 rue de Castelnau E, Montréal, QC", lat:45.5323, lng:-73.6015 },
];

const T={en:{exhibitions:"Exhibitions",map:"Map",reviews:"Reviews",allShows:"All Shows",myPlan:"My Plan",all:"All",featured:"Featured",reviewed:"Reviewed",closing:"Closing This Week",opening:"Opening This Week",nearby:"Nearby",mileEnd:"Mile-End",downtown:"Downtown",rosemont:"Rosemont",griffintown:"Griffintown",saintHenri:"Saint-Henri",plateau:"Plateau",featuredReview:"Featured Review",moreReviews:"More Reviews",getDirections:"Get Directions",share:"Share",back:"Back",dates:"Dates",hours:"Hours",area:"Area",noShowsInPlan:"No shows in your plan yet",addFromShows:"Star shows in the Exhibitions tab",locationDenied:"Location access denied. Please enable in settings.",gettingLocation:"Getting your location…",vernissageReview:"Vernissage Review",closingSoon:"Closing",openingSoon:"Opening",away:"away",betweenShows:"Between exhibitions"},fr:{exhibitions:"Expositions",map:"Carte",reviews:"Critiques",allShows:"Toutes",myPlan:"Mon Plan",all:"Tout",featured:"En vedette",reviewed:"Critiquées",closing:"Ferme cette semaine",opening:"Ouvre cette semaine",nearby:"À proximité",mileEnd:"Mile-End",downtown:"Centre-ville",rosemont:"Rosemont",griffintown:"Griffintown",saintHenri:"Saint-Henri",plateau:"Plateau",featuredReview:"Critique en vedette",moreReviews:"Plus de critiques",getDirections:"Itinéraire",share:"Partager",back:"Retour",dates:"Dates",hours:"Heures",area:"Quartier",noShowsInPlan:"Aucune exposition dans votre plan",addFromShows:"Ajoutez des expositions depuis Expositions",locationDenied:"Accès à la localisation refusé.",gettingLocation:"Localisation en cours…",vernissageReview:"Critique du Vernissage",closingSoon:"Ferme bientôt",openingSoon:"Ouvre bientôt",away:"de vous",betweenShows:"Entre expositions"}};

const INK="#0F0E0C",BLUE="#2B5BE8",WHITE="#FFFFFF",BORDER="#E8E5E0",MID="#6B6560",LIGHT="#F4F4F4";
const TODAY=new Date("2026-04-08");
const MAP_CENTER={lat:45.5080,lng:-73.5750};
const LIBRARIES=["places"];

const MAP_STYLE=[
  {featureType:"all",elementType:"labels.text.fill",stylers:[{color:"#4a4a4a"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#d4e4f0"}]},
  {featureType:"landscape",elementType:"geometry",stylers:[{color:"#f5f4f0"}]},
  {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#ffffff"},{weight:1.5}]},
  {featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#ffffff"},{weight:1}]},
  {featureType:"road.local",elementType:"geometry",stylers:[{color:"#ffffff"},{weight:0.8}]},
  {featureType:"poi.park",elementType:"geometry",stylers:[{color:"#e8f0e0"}]},
  {featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},
  {featureType:"transit",elementType:"labels",stylers:[{visibility:"off"}]},
];

function isClosingThisWeek(s){const d=(new Date(s.closeDate)-TODAY)/86400000;return d>=0&&d<=7;}
function isOpeningThisWeek(s){const d=(new Date(s.openDate)-TODAY)/86400000;return d>=-7&&d<=7;}
function distanceKm(lat1,lng1,lat2,lng2){const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function mapsUrl(addr){return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;}
function badgeSVG(){return`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#7BA7D4" stroke="white" stroke-width="2"/><text x="14" y="19" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}

// ─── Pin rendered as React OverlayView ────────────────────────────────────────
function MapPin({show, isActive, onClick}){
  const size=isActive?42:34;
  const headR=isActive?14:11;
  const totalH=size+12;
  return(
    <button
      onClick={e=>{e.stopPropagation();onClick(show);}}
      style={{position:"relative",width:size,height:totalH,cursor:"pointer",transform:"translate(-50%, -100%)",transition:"all 0.15s",background:"none",border:"none",padding:0,display:"block"}}
    >
      <svg width={size} height={totalH} viewBox={`0 0 ${size} ${totalH}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`sh-${show.id}`} x="-60%" y="-20%" width="220%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="rgba(0,0,0,0.28)"/>
          </filter>
        </defs>
        <ellipse cx={size/2} cy={totalH-1} rx={3.5} ry={1.5} fill="rgba(0,0,0,0.13)"/>
        <line x1={size/2} y1={headR+3} x2={size/2} y2={totalH-3} stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx={size/2} cy={headR+1} r={headR+2} fill="white" filter={`url(#sh-${show.id})`}/>
        <circle cx={size/2} cy={headR+1} r={headR} fill={show.featured?"#7BA7D4":"#E8251A"}/>
        <circle cx={size/2} cy={headR+1} r={headR} fill="none" stroke="white" strokeWidth="2"/>
        {show.featured&&<text x={size/2} y={headR+6} fontFamily="sans-serif" fontSize="12" fill="white" textAnchor="middle">✦</text>}
      </svg>
    </button>
  );
}

// ─── Info card — pure React, zero DOM hacks ───────────────────────────────────
function MapInfoCard({show, onView, onClose}){
  const shortAddr=show.address.replace(", Montréal, QC","");
  return(
    <div
      onClick={e=>e.stopPropagation()}
      style={{
        width:230,background:WHITE,borderRadius:6,overflow:"hidden",
        boxShadow:"0 12px 40px rgba(0,0,0,0.16),0 2px 8px rgba(0,0,0,0.06)",
        border:`1px solid ${BORDER}`,
        transform:"translate(-50%, calc(-100% - 58px))",
        fontFamily:"'DM Sans',system-ui,sans-serif",
        position:"relative",
      }}
    >
      <button
        onClick={onClose}
        style={{position:"absolute",top:8,right:8,width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.06)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:MID,lineHeight:1,padding:0,zIndex:1}}
      >×</button>
      <div style={{height:5,background:show.between?"#D8D4CC":show.color}}/>
      <div style={{padding:"14px 16px 14px"}}>
        <p style={{margin:"0 0 7px",fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:BLUE,fontWeight:700,paddingRight:20}}>{show.gallery}</p>
        {show.between?(
          <p style={{margin:"0 0 12px",fontSize:13,color:MID,fontStyle:"italic"}}>Between exhibitions</p>
        ):(
          <>
            <p style={{margin:"0 0 3px",fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:17,fontStyle:"italic",fontWeight:600,color:INK,lineHeight:1.25}}>{show.title}</p>
            <p style={{margin:"0 0 12px",fontSize:12,color:MID}}>{show.artist}</p>
          </>
        )}
        <p style={{margin:"0 0 14px",fontSize:11,color:"#9B9590",display:"flex",alignItems:"center",gap:4}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#9B9590"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          {shortAddr}
        </p>
        <button
          onClick={()=>onView(show)}
          style={{width:"100%",background:INK,color:WHITE,border:"none",padding:"11px 0",borderRadius:3,fontSize:10,letterSpacing:".12em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
        >
          View exhibition <span style={{fontSize:13}}>→</span>
        </button>
      </div>
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState("exhibitions");
  const[detail,setDetail]=useState(null);
  const[saved,setSaved]=useState(new Set(["blouin","bradley","ellephant"]));
  const[filter,setFilter]=useState("featured");
  const[mapMode,setMapMode]=useState("all");
  const[userLoc,setUserLoc]=useState(null);
  const[locError,setLocError]=useState(false);
  const[lang,setLang]=useState("en");
  const[showLangBanner,setShowLangBanner]=useState(false);
  const[activePin,setActivePin]=useState(null);
  const t=T[lang];

  const{isLoaded}=useJsApiLoader({googleMapsApiKey:GMAPS_KEY,libraries:LIBRARIES});
  const onMapLoad=useCallback(()=>{},[]);
  const handleMapClick=useCallback(()=>setActivePin(null),[]);

  const toggleSave=(id)=>setSaved(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  const filtered=SHOWS.filter(s=>{
    if(filter==="all")return!s.between;
    if(filter==="featured")return s.featured&&!s.between;
    if(filter==="reviewed")return s.reviewed;
    if(filter==="closing")return isClosingThisWeek(s)&&!s.between;
    if(filter==="opening")return isOpeningThisWeek(s)&&!s.between;
    if(filter==="nearby")return true;
    if(filter==="mile-end")return s.hood==="Mile-End";
    if(filter==="downtown")return s.hood==="Downtown";
    if(filter==="rosemont")return s.hood==="Rosemont";
    if(filter==="griffintown")return s.hood==="Griffintown";
    if(filter==="saint-henri")return s.hood==="Saint-Henri";
    if(filter==="plateau")return s.hood==="Plateau";
    return true;
  }).sort((a,b)=>{
    if(filter==="nearby"&&userLoc)return distanceKm(userLoc.lat,userLoc.lng,a.lat,a.lng)-distanceKm(userLoc.lat,userLoc.lng,b.lat,b.lng);
    return 0;
  });

  const PinButton=({id,size=42})=>{const on=saved.has(id);return(<button onClick={e=>{e.stopPropagation();toggleSave(id);}} style={{width:size,height:size,borderRadius:4,border:`1.5px solid ${on?BLUE:BORDER}`,background:on?BLUE:WHITE,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}><svg width="20" height="20" viewBox="0 0 24 24" fill={on?WHITE:"#C0BBB5"} xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></button>);};

  const FILTERS=[["featured",t.featured],["all",t.all],["closing",t.closing],["opening",t.opening],["nearby",t.nearby],["mile-end",t.mileEnd],["downtown",t.downtown],["rosemont",t.rosemont],["griffintown",t.griffintown],["saint-henri",t.saintHenri],["plateau",t.plateau]];
  const shortAddr=a=>a.replace(", Montréal, QC","");
  const tabs=[["exhibitions",t.exhibitions],["map",t.map],...(FEATURES.reviews?[["reviews",t.reviews]]:[])];
  const showsForMap=mapMode==="plan"?SHOWS.filter(s=>saved.has(s.id)):SHOWS;
  const activePinShow=activePin?SHOWS.find(s=>s.id===activePin):null;

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:WHITE,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",maxWidth:430,margin:"0 auto",position:"relative",boxShadow:"0 0 60px rgba(0,0,0,0.08)"}}>
      {/* Header */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,zIndex:10}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,letterSpacing:"0.04em"}}>Le Vernissage<span style={{color:BLUE}}>.</span></div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>{["en","fr"].map(l=>(<button key={l} onClick={()=>{setLang(l);if(l==="fr")setShowLangBanner(true);}} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${lang===l?INK:BORDER}`,background:lang===l?INK:WHITE,color:lang===l?WHITE:MID,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>))}</div>
      </div>
      {showLangBanner&&lang==="fr"&&(<div style={{background:BLUE,color:WHITE,fontSize:12,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}><span>Version française bientôt disponible</span><button onClick={()=>setShowLangBanner(false)} style={{background:"none",border:"none",color:WHITE,fontSize:20,cursor:"pointer",lineHeight:1,padding:0}}>×</button></div>)}

      {/* Tabs */}
      <div style={{background:LIGHT,borderBottom:`1px solid ${BORDER}`,display:"flex",flexShrink:0,zIndex:10,padding:"6px 6px 0"}}>
        {tabs.map(([key,label])=>(<button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"11px 6px 12px",fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:tab===key?INK:MID,background:tab===key?WHITE:"transparent",border:`1px solid ${tab===key?BORDER:"transparent"}`,borderBottom:tab===key?`1px solid ${WHITE}`:"none",borderRadius:"4px 4px 0 0",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginBottom:tab===key?-1:0,zIndex:tab===key?2:1,position:"relative"}}>{label}</button>))}
      </div>

      <div style={{flex:1,overflow:"hidden",position:"relative",background:WHITE}}>

        {/* Exhibitions */}
        {tab==="exhibitions"&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:"12px 0 12px 16px",flexShrink:0}}>
              <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingRight:16}}>
                {FILTERS.map(([val,label])=>(<button key={val} onClick={()=>{setFilter(val);if(val==="nearby"&&!userLoc&&!locError){navigator.geolocation?.getCurrentPosition(pos=>setUserLoc({lat:pos.coords.latitude,lng:pos.coords.longitude}),()=>setLocError(true));}}} style={{flexShrink:0,padding:"7px 15px",borderRadius:20,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,border:`1.5px solid ${filter===val?BLUE:BORDER}`,background:filter===val?BLUE:WHITE,color:filter===val?WHITE:MID,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{label}</button>))}
              </div>
            </div>
            {filter==="nearby"&&locError&&<div style={{padding:"24px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.locationDenied}</div>}
            {filter==="nearby"&&!userLoc&&!locError&&<div style={{padding:"24px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.gettingLocation}</div>}
            <div style={{flex:1,overflowY:"auto"}}>
              {filtered.map(s=>{
                const dist=userLoc?distanceKm(userLoc.lat,userLoc.lng,s.lat,s.lng):null;
                const closing=isClosingThisWeek(s),opening=isOpeningThisWeek(s);
                return(
                  <div key={s.id} onClick={()=>setDetail(s)} style={{position:"relative",cursor:"pointer",borderBottom:`1px solid ${BORDER}`}}>
                    <div style={{width:"100%",height:s.between?110:220,background:s.between?LIGHT:s.color,position:"relative",overflow:"hidden"}}>
                      {!s.between&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:"70%",background:"linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0) 100%)"}}/>}
                      {s.featured&&!s.between&&<div style={{position:"absolute",top:12,left:12}} dangerouslySetInnerHTML={{__html:badgeSVG()}}/>}
                      {!s.between&&(
                        <div style={{position:"absolute",top:12,right:12,display:"flex",gap:6,flexDirection:"column",alignItems:"flex-end"}}>
                          {s.reviewed&&<span style={{fontSize:10,padding:"3px 8px",background:INK,color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Reviewed</span>}
                          {closing&&<span style={{fontSize:10,padding:"3px 8px",background:BLUE,color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.closingSoon}</span>}
                          {opening&&!closing&&<span style={{fontSize:10,padding:"3px 8px",background:"#22A06B",color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.openingSoon}</span>}
                        </div>
                      )}
                      {s.between?(
                        <div style={{height:"100%",display:"flex",alignItems:"center",padding:"0 20px"}}>
                          <div><div style={{fontSize:11,letterSpacing:"0.10em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:6}}>{s.gallery}</div><div style={{fontSize:13,color:MID,fontStyle:"italic"}}>{t.betweenShows}</div></div>
                        </div>
                      ):(
                        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 16px"}}>
                          <div style={{fontSize:11,letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(255,255,255,0.75)",fontWeight:600,marginBottom:4}}>{s.gallery}</div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",fontWeight:600,color:WHITE,lineHeight:1.15,marginBottom:2}}>{s.title}</div>
                          <div style={{fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:400}}>{s.artist}</div>
                        </div>
                      )}
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:WHITE}}>
                      <div>
                        <div style={{fontSize:13,color:INK,fontWeight:500,marginBottom:2}}>{shortAddr(s.address)} · {s.hood}</div>
                        <div style={{fontSize:12,color:MID}}>{dist?`${dist.toFixed(1)} km ${t.away} · `:""}{s.between?"":s.dates}</div>
                      </div>
                      <PinButton id={s.id} size={40}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Map */}
        {tab==="map"&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative"}}>
            <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:10,display:"flex",background:"rgba(255,255,255,0.35)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.5)",borderRadius:6,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
              {[["all",t.allShows],["plan",t.myPlan]].map(([mode,label])=>(<button key={mode} onClick={()=>setMapMode(mode)} style={{padding:"9px 20px",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:mapMode===mode?"rgba(43,91,232,0.90)":"transparent",color:mapMode===mode?WHITE:"rgba(15,14,12,0.75)",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>{label}</button>))}
            </div>
            {mapMode==="plan"&&saved.size===0&&(
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:9,textAlign:"center",pointerEvents:"none",padding:"0 40px"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:MID,marginBottom:8}}>{t.noShowsInPlan}</div>
                <div style={{fontSize:13,color:BORDER,lineHeight:1.6}}>{t.addFromShows}</div>
              </div>
            )}
            {!isLoaded?(
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:MID,fontSize:14}}>Loading map…</div>
            ):(
              <GoogleMap
                mapContainerStyle={{flex:1,width:"100%"}}
                center={MAP_CENTER}
                zoom={13}
                options={{styles:MAP_STYLE,disableDefaultUI:true,zoomControl:true,clickableIcons:false}}
                onLoad={onMapLoad}
                onClick={handleMapClick}
              >
                {showsForMap.map(s=>(
                  <OverlayView key={s.id} position={{lat:s.lat,lng:s.lng}} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <MapPin show={s} isActive={activePin===s.id} onClick={show=>setActivePin(activePin===show.id?null:show.id)}/>
                  </OverlayView>
                ))}
                {activePinShow&&(
                  <OverlayView position={{lat:activePinShow.lat,lng:activePinShow.lng}} mapPaneName={OverlayView.FLOAT_PANE}>
                    <MapInfoCard
                      show={activePinShow}
                      onView={show=>{setActivePin(null);setDetail(show);}}
                      onClose={()=>setActivePin(null)}
                    />
                  </OverlayView>
                )}
              </GoogleMap>
            )}
          </div>
        )}

        {/* Reviews — preserved, gated */}
        {FEATURES.reviews&&tab==="reviews"&&(
          <div style={{height:"100%",overflowY:"auto"}}>
            <div onClick={()=>setDetail(SHOWS[0])} style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,cursor:"pointer",paddingBottom:20}}>
              <div style={{width:"100%",height:240,background:SHOWS[0].color,marginBottom:18,position:"relative"}}><div style={{position:"absolute",top:16,left:18}}><span style={{fontSize:10,padding:"4px 10px",background:BLUE,color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase"}}>{t.featuredReview}</span></div></div>
              <div style={{padding:"0 20px"}}>
                <div style={{fontSize:11,letterSpacing:"0.10em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:10}}>{SHOWS[0].gallery}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:500,lineHeight:1.2,color:INK,marginBottom:10}}>On looking slowly: Marie-Claire Leblanc at Blouin Division</div>
                <div style={{fontSize:15,color:MID,lineHeight:1.6,marginBottom:14}}>A show that demands patience, and rewards it completely.</div>
                <div style={{fontSize:12,color:MID,display:"flex",alignItems:"center",gap:8}}><span>Sophie Tran</span><span style={{width:3,height:3,background:BORDER,borderRadius:"50%",display:"inline-block"}}/><span>April 8, 2026</span><span style={{width:3,height:3,background:BORDER,borderRadius:"50%",display:"inline-block"}}/><span>5 min read</span></div>
              </div>
            </div>
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:MID,fontWeight:700,padding:"18px 20px 12px",borderBottom:`1px solid ${BORDER}`}}>{t.moreReviews}</div>
            {[{s:SHOWS[1],title:"James Nizam's light as material",author:"Marc Durand · Apr 2 · 4 min"},{s:SHOWS[2],title:"Lisières and the edges of memory",author:"Isabelle Fleury · Mar 28 · 6 min"},{s:SHOWS[4],title:"Soft Infrastructure and the question of care",author:"Yasmine Hamdan · Mar 21 · 5 min"}].map((r,i)=>(<div key={i} onClick={()=>setDetail(r.s)} style={{display:"flex",gap:14,padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,background:WHITE,cursor:"pointer"}}><div style={{width:86,height:86,borderRadius:4,background:r.s.color,flexShrink:0,border:`1px solid ${BORDER}`}}/><div style={{flex:1}}><div style={{fontSize:11,letterSpacing:"0.10em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:6}}>{r.s.gallery}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:500,lineHeight:1.3,marginBottom:6}}>{r.title}</div><div style={{fontSize:12,color:MID}}>{r.author}</div></div></div>))}
          </div>
        )}
      </div>

      {/* Detail overlay — fixed, covers full screen */}
      {detail&&(
        <div style={{position:"fixed",inset:0,background:WHITE,zIndex:200,overflowY:"auto",animation:"slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",maxWidth:430,margin:"0 auto"}}>
          <div style={{position:"sticky",top:0,background:WHITE,borderBottom:`1px solid ${BORDER}`,height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",zIndex:10}}>
            <button onClick={()=>setDetail(null)} style={{fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,color:MID,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:18,color:INK,lineHeight:1}}>←</span>{t.back}</button>
            <PinButton id={detail.id} size={40}/>
          </div>
          <div style={{width:"100%",height:detail.between?140:260,background:detail.between?LIGHT:detail.color,display:"flex",alignItems:"center",justifyContent:"center"}}>{detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:MID}}>{t.betweenShows}</div>}</div>
          <div style={{padding:"24px 20px"}}>
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:8}}>{detail.gallery}</div>
            {!detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontStyle:"italic",fontWeight:500,lineHeight:1.15,marginBottom:6}}>{detail.title}</div>}
            {!detail.between&&detail.artist&&<div style={{fontSize:17,fontWeight:400,marginBottom:22,color:INK}}>{detail.artist}</div>}
            {!detail.between&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",border:`1px solid ${BORDER}`,borderRadius:4,marginBottom:24,overflow:"hidden"}}>{[[t.dates,detail.dates],[t.hours,"Tue–Sat 11–18h"],[t.area,detail.hood]].map(([label,val],i)=>(<div key={label} style={{padding:"13px 10px",textAlign:"center",borderRight:i<2?`1px solid ${BORDER}`:"none"}}><div style={{fontSize:10,letterSpacing:"0.10em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:5}}>{label}</div><div style={{fontSize:13,fontWeight:600,lineHeight:1.3,color:INK}}>{val}</div></div>))}</div>)}
            <div style={{fontSize:14,color:MID,marginBottom:16}}>📍 {shortAddr(detail.address)}, {detail.hood}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,lineHeight:1.8,marginBottom:26,color:INK}}>{detail.desc}</div>
            {detail.reviewed&&(<div style={{background:"#EEF2FD",borderLeft:`3px solid ${BLUE}`,padding:"18px 16px",marginBottom:24,borderRadius:"0 4px 4px 0"}}><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:10}}>{t.vernissageReview}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",lineHeight:1.8,marginBottom:10,color:INK}}>{detail.quote}</div><div style={{fontSize:12,color:MID}}>{detail.by}</div></div>)}
            <div style={{display:"flex",gap:12,paddingBottom:40}}>
              <a href={mapsUrl(detail.address)} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:15,background:INK,color:WHITE,border:"none",borderRadius:4,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.getDirections}</a>
              <button onClick={()=>{if(navigator.share){navigator.share({title:`${detail.title} — ${detail.gallery}`,url:window.location.href});}else{navigator.clipboard?.writeText(window.location.href);}}} style={{flex:1,padding:15,background:WHITE,color:INK,border:`1.5px solid ${INK}`,borderRadius:4,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.share}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}*{-webkit-font-smoothing:antialiased;}::-webkit-scrollbar{display:none;}`}</style>
    </div>
  );
}
