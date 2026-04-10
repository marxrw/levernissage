import { useState, useEffect, useRef } from "react";

const FEATURES = { reviews: false };

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const T={en:{exhibitions:"Exhibitions",map:"Map",reviews:"Reviews",allShows:"All Shows",myPlan:"My Plan",all:"All",featured:"Featured",reviewed:"Reviewed",closing:"Closing This Week",opening:"Opening This Week",nearby:"Nearby",mileEnd:"Mile-End",downtown:"Downtown",rosemont:"Rosemont",griffintown:"Griffintown",saintHenri:"Saint-Henri",plateau:"Plateau",getDirections:"Get Directions",share:"Share",back:"Back",dates:"Dates",hours:"Hours",area:"Area",noShowsInPlan:"No shows in your plan yet",addFromShows:"Star shows in the Exhibitions tab",locationDenied:"Location access denied.",gettingLocation:"Getting your location…",vernissageReview:"Vernissage Review",closingSoon:"Closing",openingSoon:"Opening",away:"away",betweenShows:"Between exhibitions",featuredReview:"Featured Review",moreReviews:"More Reviews",loading:"Loading exhibitions…"},fr:{exhibitions:"Expositions",map:"Carte",reviews:"Critiques",allShows:"Toutes",myPlan:"Mon Plan",all:"Tout",featured:"En vedette",reviewed:"Critiquées",closing:"Ferme cette semaine",opening:"Ouvre cette semaine",nearby:"À proximité",mileEnd:"Mile-End",downtown:"Centre-ville",rosemont:"Rosemont",griffintown:"Griffintown",saintHenri:"Saint-Henri",plateau:"Plateau",getDirections:"Itinéraire",share:"Partager",back:"Retour",dates:"Dates",hours:"Heures",area:"Quartier",noShowsInPlan:"Aucune exposition dans votre plan",addFromShows:"Ajoutez des expositions depuis Expositions",locationDenied:"Accès refusé.",gettingLocation:"Localisation…",vernissageReview:"Critique du Vernissage",closingSoon:"Ferme bientôt",openingSoon:"Ouvre bientôt",away:"de vous",betweenShows:"Entre expositions",featuredReview:"Critique en vedette",moreReviews:"Plus de critiques",loading:"Chargement…"}};

const INK="#0F0E0C",BLUE="#2B5BE8",WHITE="#FFFFFF",BORDER="#E8E5E0",MID="#6B6560",LIGHT="#F4F4F4";
const TODAY=new Date();

function isClosingThisWeek(s){const d=(new Date(s.close_date)-TODAY)/86400000;return d>=0&&d<=7;}
function isOpeningThisWeek(s){const d=(new Date(s.open_date)-TODAY)/86400000;return d>=-7&&d<=7;}
function distanceKm(lat1,lng1,lat2,lng2){const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function mapsUrl(addr){return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;}
function badgeSVG(){return`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#7BA7D4" stroke="white" stroke-width="2"/><text x="14" y="19" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}

function pinSVG(featured,id){
  const fid=id||"x";
  if(featured){return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pf${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pf${fid})"/><circle cx="17" cy="15" r="12" fill="#7BA7D4"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/><text x="17" y="20" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}
  return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pn${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pn${fid})"/><circle cx="17" cy="15" r="12" fill="#E8251A"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/></svg>`;
}

async function fetchShows(){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.approved&order=created_at.desc`,{
    headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}
  });
  if(!res.ok)throw new Error("Failed to fetch shows");
  return res.json();
}

export default function App(){
  const[tab,setTab]=useState("exhibitions");
  const[detail,setDetail]=useState(null);
  const[saved,setSaved]=useState(new Set());
  const[filter,setFilter]=useState("featured");
  const[mapMode,setMapMode]=useState("all");
  const[userLoc,setUserLoc]=useState(null);
  const[locError,setLocError]=useState(false);
  const[lang,setLang]=useState("en");
  const[showLangBanner,setShowLangBanner]=useState(false);
  const[shows,setShows]=useState([]);
  const[loading,setLoading]=useState(true);
  const mapRef=useRef(null);
  const gMapRef=useRef(null);
  const markersRef=useRef([]);
  const clustererRef=useRef(null);
  const geocodedPositions=useRef({});
  const t=T[lang];

  useEffect(()=>{
    fetchShows().then(data=>{setShows(data);setLoading(false);}).catch(()=>setLoading(false));
  },[]);

  const toggleSave=(id)=>setSaved(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  useEffect(()=>{
    window.__lvOpen=(id)=>{const s=shows.find(x=>x.id===id);if(s)setDetail(s);};
    return()=>{delete window.__lvOpen;};
  },[shows]);

  useEffect(()=>{if(filter==="nearby"&&!userLoc&&!locError){navigator.geolocation?.getCurrentPosition(pos=>setUserLoc({lat:pos.coords.latitude,lng:pos.coords.longitude}),()=>setLocError(true));}},[filter]);

  const filtered=shows.filter(s=>{
    if(filter==="all")return!s.between;
    if(filter==="featured")return s.featured&&!s.between;
    if(filter==="reviewed")return s.reviewed;
    if(filter==="closing")return isClosingThisWeek(s)&&!s.between;
    if(filter==="opening")return isOpeningThisWeek(s)&&!s.between;
    if(filter==="nearby")return true;
    if(filter==="mile-end")return s.neighbourhood==="Mile-End";
    if(filter==="downtown")return s.neighbourhood==="Downtown";
    if(filter==="rosemont")return s.neighbourhood==="Rosemont";
    if(filter==="griffintown")return s.neighbourhood==="Griffintown";
    if(filter==="saint-henri")return s.neighbourhood==="Saint-Henri";
    if(filter==="plateau")return s.neighbourhood==="Plateau";
    return true;
  }).sort((a,b)=>{
    if(filter==="nearby"&&userLoc)return distanceKm(userLoc.lat,userLoc.lng,a.lat,a.lng)-distanceKm(userLoc.lat,userLoc.lng,b.lat,b.lng);
    return 0;
  });

  useEffect(()=>{
    if(tab!=="map")return;
    if(gMapRef.current)return;

    const buildMarker=(google,map,s,position)=>{
      const icon={url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(pinSVG(s.featured,s.id)),scaledSize:new google.maps.Size(34,48),anchor:new google.maps.Point(17,48)};
      const marker=new google.maps.Marker({position,icon,title:s.gallery});
      const shortAddr=s.address.replace(", Montréal, QC","");
      const infoContent=`<div style="width:220px;font-family:'DM Sans',sans-serif;background:#fff;border-radius:6px;overflow:hidden;"><div style="height:5px;background:${s.between?"#D8D4CC":s.color};"></div><div style="padding:14px 15px;"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#2B5BE8;font-weight:700;margin-bottom:6px;">${s.gallery}</div>${s.between?`<div style="font-size:13px;color:#6B6560;font-style:italic;margin-bottom:10px;">Between exhibitions</div>`:`<div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:600;color:#0F0E0C;line-height:1.2;margin-bottom:3px;">${s.title}</div><div style="font-size:12px;color:#6B6560;margin-bottom:10px;">${s.artist}</div>`}<div style="font-size:11px;color:#9B9590;margin-bottom:13px;">📍 ${shortAddr}</div><div style="display:flex;gap:8px;"><a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}" target="_blank" style="flex:1;background:#F4F4F4;color:#0F0E0C;border:none;padding:10px 0;border-radius:3px;font-size:9px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;display:flex;align-items:center;justify-content:center;">Directions</a><button onclick="window.__lvOpen('${s.id}')" ontouchend="event.preventDefault();window.__lvOpen('${s.id}')" style="flex:1;background:#0F0E0C;color:#fff;border:none;padding:10px 0;border-radius:3px;font-size:9px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">View →</button></div></div></div>`;
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
      const markers=await Promise.all(shows.map(s=>new Promise(resolve=>{
        geocoder.geocode({address:s.address},(results,status)=>{
          let lat,lng;
          if(status==="OK"&&results[0]){lat=results[0].geometry.location.lat();lng=results[0].geometry.location.lng();}
          else{lat=s.lat;lng=s.lng;}
          const key=lat.toFixed(5)+","+lng.toFixed(5);
          const count=seenPositions[key]=(seenPositions[key]||0)+1;
          if(count>1){const angle=(count-1)*(2*Math.PI/8);lat+=0.00008*Math.cos(angle);lng+=0.00008*Math.sin(angle);}
          resolve(buildMarker(google,map,s,{lat,lng}));
        });
      })));

      if(!window.markerClusterer){
        await new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});
      }
      shows.forEach((s,i)=>{geocodedPositions.current[s.id]=markers[i].getPosition();});
      const cl=new window.markerClusterer.MarkerClusterer({map,markers});
      clustererRef.current=cl;
      markersRef.current.forEach(m=>m.marker.setMap(map));
    };

    if(window.google&&window.google.maps){initMap();}
    else{
      const scriptId="gmap-script";
      if(!document.getElementById(scriptId)){
        window.__initGMap=initMap;
        const sc=document.createElement("script");
        sc.id=scriptId;
        sc.src=`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=__initGMap`;
        sc.async=true;
        document.head.appendChild(sc);
      }
    }
  },[tab,shows]);

  const[toastId,setToastId]=useState(null);
  const[toastVisible,setToastVisible]=useState(false);
  const toastTimer=useRef(null);
  const[showGuide,setShowGuide]=useState(()=>!localStorage.getItem("lv_guide_seen"));
  useEffect(()=>{if(showGuide){const t=setTimeout(()=>{setShowGuide(false);localStorage.setItem("lv_guide_seen","1");},4000);return()=>clearTimeout(t);}},[showGuide]);
  const showToast=(id)=>{setToastId(id);setToastVisible(true);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToastVisible(false),2000);};

  useEffect(()=>{
    if(!gMapRef.current||!clustererRef.current)return;
    clustererRef.current.clearMarkers();
    markersRef.current.forEach(m=>m.marker.setMap(null));
    const toShow=mapMode==="plan"?markersRef.current.filter(m=>saved.has(m.id)):markersRef.current;
    toShow.forEach(m=>m.marker.setMap(gMapRef.current));
    clustererRef.current.addMarkers(toShow.map(m=>m.marker));
  },[mapMode,saved]);

  const PinButton=({id})=>{
    const on=saved.has(id);
    return(
      <div style={{position:"relative",flexShrink:0}}>
        {toastId===id&&toastVisible&&(<div style={{position:"absolute",bottom:"calc(100% + 6px)",right:0,background:INK,color:WHITE,fontSize:11,fontWeight:600,letterSpacing:"0.06em",whiteSpace:"nowrap",padding:"6px 10px",borderRadius:4,pointerEvents:"none",zIndex:10}}>{on?"Added to My Plan ✓":"Removed from Plan"}</div>)}
        <button onClick={e=>{e.stopPropagation();toggleSave(id);showToast(id);}} style={{height:34,padding:"0 12px",borderRadius:20,border:`1.5px solid ${on?BLUE:BORDER}`,background:on?BLUE:"transparent",display:"flex",alignItems:"center",gap:6,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>
          {on?(<><svg width="14" height="14" viewBox="0 0 24 24" fill={WHITE}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:WHITE}}>My Plan</span></>):(<span style={{fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:MID}}>+ My Plan</span>)}
        </button>
      </div>
    );
  };

  const PlanToggle=({id})=>{
    const on=saved.has(id);
    return(
      <div style={{position:"relative"}}>
        {toastId===id&&toastVisible&&(<div style={{position:"absolute",top:-36,left:"50%",transform:"translateX(-50%)",background:INK,color:WHITE,fontSize:11,fontWeight:600,letterSpacing:"0.06em",whiteSpace:"nowrap",padding:"6px 10px",borderRadius:4,pointerEvents:"none",zIndex:10}}>{on?"Added to My Plan ✓":"Removed from Plan"}</div>)}
        <button onClick={e=>{e.stopPropagation();toggleSave(id);showToast(id);}} style={{width:"100%",padding:"13px 0",borderRadius:4,border:`1.5px solid ${on?BLUE:BORDER}`,background:on?`${BLUE}12`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all 0.2s",marginBottom:24}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={on?BLUE:MID}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:on?BLUE:MID}}>{on?"In My Plan ✓":"Add to My Plan"}</span>
        </button>
      </div>
    );
  };

  const FILTERS=[["featured",t.featured],["all",t.all],["closing",t.closing],["opening",t.opening],["nearby",t.nearby],["mile-end",t.mileEnd],["downtown",t.downtown],["rosemont",t.rosemont],["griffintown",t.griffintown],["saint-henri",t.saintHenri],["plateau",t.plateau]];
  const shortAddr=a=>a?.replace(", Montréal, QC","");
  const tabs=[["exhibitions",t.exhibitions],["map",t.map],...(FEATURES.reviews?[["reviews",t.reviews]]:[])];

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:WHITE,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",maxWidth:430,margin:"0 auto",position:"relative",boxShadow:"0 0 60px rgba(0,0,0,0.08)"}}>
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:56,display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"0 20px",flexShrink:0,zIndex:10}}>
        <div style={{display:"flex",gap:4}}>{["en","fr"].map(l=>(<button key={l} onClick={()=>{setLang(l);if(l==="fr")setShowLangBanner(true);}} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${lang===l?INK:BORDER}`,background:lang===l?INK:WHITE,color:lang===l?WHITE:MID,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>))}</div>
      </div>
      {showLangBanner&&lang==="fr"&&(<div style={{background:BLUE,color:WHITE,fontSize:12,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}><span>Version française bientôt disponible</span><button onClick={()=>setShowLangBanner(false)} style={{background:"none",border:"none",color:WHITE,fontSize:20,cursor:"pointer",lineHeight:1,padding:0}}>×</button></div>)}
      <div style={{background:LIGHT,borderBottom:`1px solid ${BORDER}`,display:"flex",flexShrink:0,zIndex:10,padding:"6px 6px 0"}}>
        {tabs.map(([key,label])=>(<button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"11px 6px 12px",fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:tab===key?INK:MID,background:tab===key?WHITE:"transparent",border:`1px solid ${tab===key?BORDER:"transparent"}`,borderBottom:tab===key?`1px solid ${WHITE}`:"none",borderRadius:"4px 4px 0 0",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginBottom:tab===key?-1:0,zIndex:tab===key?2:1,position:"relative"}}>{label}</button>))}
      </div>

      <div style={{flex:1,overflow:"hidden",position:"relative",background:WHITE}}>
        {tab==="exhibitions"&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:"12px 0 12px 16px",flexShrink:0}}>
              <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingRight:16}}>
                {FILTERS.map(([val,label])=>(<button key={val} onClick={()=>setFilter(val)} style={{flexShrink:0,padding:"7px 15px",borderRadius:20,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,border:`1.5px solid ${filter===val?BLUE:BORDER}`,background:filter===val?BLUE:WHITE,color:filter===val?WHITE:MID,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{label}</button>))}
              </div>
            </div>
            {loading&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.loading}</div>}
            {!loading&&filter==="nearby"&&locError&&<div style={{padding:"24px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.locationDenied}</div>}
            {!loading&&filter==="nearby"&&!userLoc&&!locError&&<div style={{padding:"24px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.gettingLocation}</div>}
            <div style={{flex:1,overflowY:"auto"}}>
              {filtered.map(s=>{
                const dist=userLoc?distanceKm(userLoc.lat,userLoc.lng,s.lat,s.lng):null;
                const closing=isClosingThisWeek(s),opening=isOpeningThisWeek(s);
                return(
                  <div key={s.id} onClick={()=>setDetail(s)} style={{position:"relative",cursor:"pointer",borderBottom:`1px solid ${BORDER}`}}>
                    <div style={{width:"100%",height:s.between?110:220,background:s.between?LIGHT:s.color,position:"relative",overflow:"hidden"}}>
                      {s.image_url&&!s.between&&<img src={s.image_url} alt={s.title} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>}
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
                        <div style={{fontSize:13,color:INK,fontWeight:500,marginBottom:2}}>{shortAddr(s.address)} · {s.neighbourhood}</div>
                        <div style={{fontSize:12,color:MID}}>{dist?`${dist.toFixed(1)} km ${t.away} · `:""}{s.between?"":s.dates}</div>
                      </div>
                      <PinButton id={s.id}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{display:tab==="map"?"flex":"none",flexDirection:"column",height:"100%",position:"relative"}}>
          <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:1000,display:"flex",background:"rgba(255,255,255,0.35)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.5)",borderRadius:6,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            {[["all",t.allShows],["plan",t.myPlan]].map(([mode,label])=>(<button key={mode} onClick={()=>setMapMode(mode)} style={{padding:"9px 20px",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:mapMode===mode?"rgba(43,91,232,0.90)":"transparent",color:mapMode===mode?WHITE:"rgba(15,14,12,0.75)",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>{label}</button>))}
          </div>
          {mapMode==="plan"&&saved.size===0&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:999,textAlign:"center",pointerEvents:"none",padding:"0 40px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:MID,marginBottom:8}}>{t.noShowsInPlan}</div><div style={{fontSize:13,color:BORDER,lineHeight:1.6}}>{t.addFromShows}</div></div>)}
          <div ref={mapRef} style={{flex:1,width:"100%"}}/>
        </div>
      </div>

      {detail&&(
        <div style={{position:"fixed",inset:0,background:WHITE,zIndex:2000,overflowY:"auto",animation:"slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",maxWidth:430,margin:"0 auto"}}>
          <div style={{position:"sticky",top:0,background:WHITE,borderBottom:`1px solid ${BORDER}`,height:54,display:"flex",alignItems:"center",padding:"0 20px",zIndex:10}}>
            <button onClick={()=>setDetail(null)} style={{fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,color:MID,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:18,color:INK,lineHeight:1}}>←</span>{t.back}</button>
          </div>
          <div style={{width:"100%",height:detail.between?140:260,background:detail.between?LIGHT:detail.color,position:"relative",overflow:"hidden"}}>
            {detail.image_url&&!detail.between&&<img src={detail.image_url} alt={detail.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            {detail.between&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:MID}}>{t.betweenShows}</div></div>}
          </div>
          <div style={{padding:"24px 20px"}}>
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:8}}>{detail.gallery}</div>
            {!detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontStyle:"italic",fontWeight:500,lineHeight:1.15,marginBottom:6}}>{detail.title}</div>}
            {!detail.between&&detail.artist&&<div style={{fontSize:17,fontWeight:400,marginBottom:22,color:INK}}>{detail.artist}</div>}
            {!detail.between&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",border:`1px solid ${BORDER}`,borderRadius:4,marginBottom:16,overflow:"hidden"}}>{[[t.dates,detail.dates],[t.hours,"Tue–Sat 11–18h"],[t.area,detail.neighbourhood]].map(([label,val],i)=>(<div key={label} style={{padding:"13px 10px",textAlign:"center",borderRight:i<2?`1px solid ${BORDER}`:"none"}}><div style={{fontSize:10,letterSpacing:"0.10em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:5}}>{label}</div><div style={{fontSize:13,fontWeight:600,lineHeight:1.3,color:INK}}>{val}</div></div>))}</div>)}
            {!detail.between&&<PlanToggle id={detail.id}/>}
            <div style={{fontSize:14,color:MID,marginBottom:16}}>📍 {shortAddr(detail.address)}, {detail.neighbourhood}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,lineHeight:1.8,marginBottom:26,color:INK}}>{detail.description}</div>
            {detail.reviewed&&detail.quote&&(<div style={{background:"#EEF2FD",borderLeft:`3px solid ${BLUE}`,padding:"18px 16px",marginBottom:24,borderRadius:"0 4px 4px 0"}}><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:10}}>{t.vernissageReview}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",lineHeight:1.8,marginBottom:10,color:INK}}>{detail.quote}</div><div style={{fontSize:12,color:MID}}>{detail.quote_by}</div></div>)}
            <div style={{display:"flex",gap:12,paddingBottom:40}}>
              <a href={mapsUrl(detail.address)} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:15,background:INK,color:WHITE,border:"none",borderRadius:4,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.getDirections}</a>
              <button onClick={()=>{if(navigator.share){navigator.share({title:`${detail.title} — ${detail.gallery}`,url:window.location.href});}else{navigator.clipboard?.writeText(window.location.href);}}} style={{flex:1,padding:15,background:WHITE,color:INK,border:`1.5px solid ${INK}`,borderRadius:4,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.share}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}*{-webkit-font-smoothing:antialiased;}::-webkit-scrollbar{display:none;}.gm-style-iw{padding:0!important;border-radius:6px!important;overflow:hidden!important;}.gm-style-iw-d{overflow:hidden!important;padding:0!important;}.gm-style-iw-c{padding:0!important;border-radius:6px!important;box-shadow:0 12px 40px rgba(0,0,0,0.16)!important;}.gm-ui-hover-effect{top:4px!important;right:4px!important;}.gm-style-iw-tc{display:none!important;}`}</style>
    </div>
  );
}
