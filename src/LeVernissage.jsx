import { useState, useEffect, useRef } from "react";

const FEATURES = { reviews: false };

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ADMIN_PASSWORD = "FrameReview26";

async function fetchShows() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.approved&order=gallery.asc`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch shows");
  const data = await res.json();
  return data.map(s => ({
    id: s.id,
    gallery: s.gallery,
    title: s.title || "",
    artist: s.artist || "",
    dates: s.dates || "",
    openDate: s.open_date || "",
    closeDate: s.close_date || "",
    hood: s.neighbourhood || "",
    color: s.color || "#C8A882",
    reviewed: s.reviewed || false,
    featured: s.featured || false,
    between: s.between || false,
    quote: s.quote || "",
    by: s.quote_by || "",
    desc: s.description || "",
    address: s.address || "",
    hours: s.hours || "",
    image_url: s.image_url || null,
    lat: parseFloat(s.lat) || 45.5080,
    lng: parseFloat(s.lng) || -73.5750,
  }));
}

async function fetchPendingShows() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shows?status=eq.cleaned&order=created_at.desc`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch pending shows");
  return res.json();
}

async function updateShowStatus(id, status, featured) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shows?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status, featured }),
  });
  return res.ok;
}

const T={en:{exhibitions:"Exhibitions",map:"Map",reviews:"Reviews",allShows:"All Shows",myPlan:"My Plan",all:"All",featured:"Featured",reviewed:"Reviewed",closing:"Closing This Week",opening:"Opening This Week",nearby:"Nearby",mileEnd:"Mile-End",downtown:"Downtown",rosemont:"Rosemont",griffintown:"Griffintown",saintHenri:"Saint-Henri",plateau:"Plateau",getDirections:"Get Directions",share:"Share",back:"Back",dates:"Dates",hours:"Hours",area:"Area",noShowsInPlan:"No shows in your plan yet",addFromShows:"Star shows in the Exhibitions tab",locationDenied:"Location access denied.",gettingLocation:"Getting your location…",vernissageReview:"Vernissage Review",closingSoon:"Closing",openingSoon:"Opening",away:"away",betweenShows:"Between exhibitions",featuredReview:"Featured Review",moreReviews:"More Reviews",loading:"Loading exhibitions…",error:"Could not load exhibitions."},fr:{exhibitions:"Expositions",map:"Carte",reviews:"Critiques",allShows:"Toutes",myPlan:"Mon Plan",all:"Tout",featured:"En vedette",reviewed:"Critiquées",closing:"Ferme cette semaine",opening:"Ouvre cette semaine",nearby:"À proximité",mileEnd:"Mile-End",downtown:"Centre-ville",rosemont:"Rosemont",griffintown:"Griffintown",saintHenri:"Saint-Henri",plateau:"Plateau",getDirections:"Itinéraire",share:"Partager",back:"Retour",dates:"Dates",hours:"Heures",area:"Quartier",noShowsInPlan:"Aucune exposition dans votre plan",addFromShows:"Ajoutez des expositions depuis Expositions",locationDenied:"Accès refusé.",gettingLocation:"Localisation…",vernissageReview:"Critique du Vernissage",closingSoon:"Ferme bientôt",openingSoon:"Ouvre bientôt",away:"de vous",betweenShows:"Entre expositions",featuredReview:"Critique en vedette",moreReviews:"Plus de critiques",loading:"Chargement…",error:"Impossible de charger les expositions."}};

const INK="#0F0E0C",BLUE="#2B5BE8",WHITE="#FFFFFF",BORDER="#E8E5E0",MID="#6B6560",LIGHT="#F4F4F4";
const FEATURED_COLOR="#F5A623";
const TODAY=new Date();

function isClosingThisWeek(s){if(!s.closeDate)return false;const d=(new Date(s.closeDate)-TODAY)/86400000;return d>=0&&d<=7;}
function isOpeningThisWeek(s){if(!s.openDate)return false;const d=(new Date(s.openDate)-TODAY)/86400000;return d>=-7&&d<=7;}
function distanceKm(lat1,lng1,lat2,lng2){const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function mapsUrl(addr){return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;}
function badgeSVG(){return`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#7BA7D4" stroke="white" stroke-width="2"/><text x="14" y="19" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}

function pinSVG(featured,id){
  const fid=id||"x";
  if(featured){return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pf${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pf${fid})"/><circle cx="17" cy="15" r="12" fill="#7BA7D4"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/><text x="17" y="20" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle">✦</text></svg>`;}
  return`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48"><defs><filter id="pn${fid}"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/></filter></defs><ellipse cx="17" cy="46.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.14)"/><line x1="17" y1="18" x2="17" y2="44" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="15" r="14" fill="white" filter="url(#pn${fid})"/><circle cx="17" cy="15" r="12" fill="#E8251A"/><circle cx="17" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/></svg>`;
}

// ── Admin Page ────────────────────────────────────────────────────────────────
function AdminPage({ onExit }) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [featuredMap, setFeaturedMap] = useState({});
  const [actionStates, setActionStates] = useState({});

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      loadShows();
    } else {
      setPwError(true);
      setPwInput("");
      setTimeout(() => setPwError(false), 1500);
    }
  };

  const loadShows = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingShows();
      setShows(data);
      const fm = {};
      data.forEach(s => { fm[s.id] = s.featured || false; });
      setFeaturedMap(fm);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    setActionStates(prev => ({ ...prev, [id]: status === "approved" ? "approving" : "rejecting" }));
    const featured = featuredMap[id] || false;
    const ok = await updateShowStatus(id, status, featured);
    if (ok) {
      setShows(prev => prev.filter(s => s.id !== id));
      setActionStates(prev => ({ ...prev, [id]: "done" }));
    } else {
      setActionStates(prev => ({ ...prev, [id]: "error" }));
    }
  };

  // Login screen
  if (!authed) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: INK, zIndex: 3000,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: 32, maxWidth: 430, margin: "0 auto"
      }}>
        <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: MID, fontWeight: 600 }}>Frame</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontStyle: "italic", color: WHITE, marginBottom: 40 }}>Admin</div>

        <div style={{ width: "100%", maxWidth: 300 }}>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 4, fontSize: 15,
              border: `1.5px solid ${pwError ? "#E8251A" : "#333"}`,
              background: "#1A1A18", color: WHITE, fontFamily: "'DM Sans',sans-serif",
              outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s",
              animation: pwError ? "shake 0.3s ease" : "none"
            }}
          />
          {pwError && <div style={{ color: "#E8251A", fontSize: 12, marginTop: 8, textAlign: "center" }}>Incorrect password</div>}
          <button
            onClick={handleLogin}
            style={{
              width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 4,
              background: BLUE, color: WHITE, border: "none", fontSize: 12,
              letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif"
            }}
          >Enter</button>
          <button
            onClick={onExit}
            style={{
              width: "100%", marginTop: 8, padding: "12px 0", borderRadius: 4,
              background: "transparent", color: MID, border: "none", fontSize: 12,
              letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif"
            }}
          >← Back to App</button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div style={{
      position: "fixed", inset: 0, background: LIGHT, zIndex: 3000,
      display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto",
      overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{
        background: INK, padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, position: "sticky", top: 0, zIndex: 10
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: MID, fontWeight: 600, marginBottom: 2 }}>Frame</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: "italic", color: WHITE }}>Review Queue</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: shows.length > 0 ? BLUE : "#333",
            color: WHITE, borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 700
          }}>{shows.length} pending</div>
          <button onClick={onExit} style={{
            background: "transparent", border: `1px solid #333`, color: MID,
            padding: "6px 12px", borderRadius: 3, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif"
          }}>Exit</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: MID, fontSize: 14 }}>
            Loading submissions…
          </div>
        )}
        {!loading && shows.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontStyle: "italic", color: MID, marginBottom: 8 }}>All clear</div>
            <div style={{ fontSize: 13, color: "#AAA" }}>No submissions waiting for review</div>
          </div>
        )}

        {!loading && shows.map(s => (
          <div key={s.id} style={{
            background: WHITE, borderRadius: 8, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${BORDER}`
          }}>
            {/* Image */}
            <div style={{
              width: "100%", height: 180, background: s.color || "#C8A882",
              position: "relative", overflow: "hidden"
            }}>
              {s.image_url && (
                <img src={s.image_url} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div style={{
                position: "absolute", top: 10, left: 10,
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                padding: "4px 10px", borderRadius: 3,
                fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                color: WHITE, fontWeight: 700
              }}>Pending Review</div>
            </div>

            {/* Info */}
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, fontWeight: 700, marginBottom: 4 }}>{s.gallery}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: "italic", fontWeight: 600, color: INK, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: MID, marginBottom: 12 }}>{s.artist}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  ["Dates", s.dates],
                  ["Neighbourhood", s.neighbourhood],
                  ["Address", s.address],
                  ["Hours", s.hours],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: LIGHT, borderRadius: 4, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: MID, fontWeight: 600, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, color: INK, fontWeight: 500 }}>{val || "—"}</div>
                  </div>
                ))}
              </div>

              {s.description && (
                <div style={{ fontSize: 13, color: MID, lineHeight: 1.6, marginBottom: 14, fontStyle: "italic" }}>
                  {s.description.length > 160 ? s.description.slice(0, 160) + "…" : s.description}
                </div>
              )}
            </div>

            {/* ── FEATURED TOGGLE — hard to miss ── */}
            <div style={{
              margin: "0 16px 16px",
              borderRadius: 6,
              border: `2.5px solid ${featuredMap[s.id] ? FEATURED_COLOR : BORDER}`,
              background: featuredMap[s.id] ? "#FFF8EC" : LIGHT,
              padding: "14px 16px",
              transition: "all 0.2s",
              cursor: "pointer",
            }} onClick={() => setFeaturedMap(prev => ({ ...prev, [s.id]: !prev[s.id] }))}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    fontSize: 12, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: featuredMap[s.id] ? FEATURED_COLOR : MID,
                    marginBottom: 2
                  }}>
                    {featuredMap[s.id] ? "⭐ Featured — Image Card" : "Featured Placement"}
                  </div>
                  <div style={{ fontSize: 11, color: featuredMap[s.id] ? "#B07800" : "#AAA" }}>
                    {featuredMap[s.id]
                      ? "Will appear with image card in Featured tab"
                      : "OFF — will appear as text card in Shows list"}
                  </div>
                </div>
                {/* Toggle switch */}
                <div style={{
                  width: 52, height: 30, borderRadius: 15, flexShrink: 0,
                  background: featuredMap[s.id] ? FEATURED_COLOR : "#CCC",
                  position: "relative", transition: "background 0.2s",
                  boxShadow: featuredMap[s.id] ? `0 0 0 3px ${FEATURED_COLOR}44` : "none"
                }}>
                  <div style={{
                    position: "absolute", top: 3,
                    left: featuredMap[s.id] ? 25 : 3,
                    width: 24, height: 24, borderRadius: 12,
                    background: WHITE, transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                  }} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${BORDER}` }}>
              <button
                onClick={() => handleAction(s.id, "rejected")}
                disabled={actionStates[s.id] === "rejecting"}
                style={{
                  flex: 1, padding: "14px 0", border: "none", borderRight: `1px solid ${BORDER}`,
                  background: WHITE, color: "#E8251A", fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  borderRadius: "0 0 0 8px"
                }}
              >
                {actionStates[s.id] === "rejecting" ? "Rejecting…" : "✕ Reject"}
              </button>
              <button
                onClick={() => handleAction(s.id, "approved")}
                disabled={actionStates[s.id] === "approving"}
                style={{
                  flex: 1, padding: "14px 0", border: "none",
                  background: actionStates[s.id] === "approving" ? "#22A06B" : INK,
                  color: WHITE, fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  borderRadius: "0 0 8px 0", transition: "background 0.2s"
                }}
              >
                {actionStates[s.id] === "approving" ? "Approving…" : "✓ Approve"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("exhibitions");
  const[detail,setDetail]=useState(null);
  const[detailSource,setDetailSource]=useState("exhibitions");
  const[saved,setSaved]=useState(new Set());
  const[filter,setFilter]=useState("featured");
  const[mapMode,setMapMode]=useState("all");
  const[userLoc,setUserLoc]=useState(null);
  const[locError,setLocError]=useState(false);
  const[lang,setLang]=useState("en");
  const[showLangBanner,setShowLangBanner]=useState(false);
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
  const geocodedPositions=useRef({});
  const t=T[lang];

  useEffect(()=>{
    fetchShows()
      .then(data=>{setSHOWS(data);setLoading(false);})
      .catch(()=>{setLoadError(true);setLoading(false);});
  },[]);

  const toggleSave=(id)=>setSaved(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  useEffect(()=>{
    window.__lvOpen=(id)=>{
      const s=SHOWS.find(x=>x.id===id);
      if(s){setDetail(s);setDetailSource(tab);}
    };
    return()=>{delete window.__lvOpen;};
  },[SHOWS,tab]);

  useEffect(()=>{if(filter==="nearby"&&!userLoc&&!locError){navigator.geolocation?.getCurrentPosition(pos=>setUserLoc({lat:pos.coords.latitude,lng:pos.coords.longitude}),()=>setLocError(true));}},[filter]);

  // Secret admin tap: tap the header title 5 times
  const handleHeaderTap = () => {
    setTapCount(prev => {
      const next = prev + 1;
      clearTimeout(tapTimer.current);
      if (next >= 5) {
        setShowAdmin(true);
        return 0;
      }
      tapTimer.current = setTimeout(() => setTapCount(0), 2000);
      return next;
    });
  };

  const filtered=SHOWS.filter(s=>{
    if(filter==="all")return!s.between;
    if(filter==="featured")return s.featured&&!s.between;
    if(filter==="reviewed")return s.reviewed;
    if(filter==="closing")return isClosingThisWeek(s)&&!s.between;
    if(filter==="opening")return isOpeningThisWeek(s)&&!s.between;
    if(filter==="nearby")return!s.between;
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

  useEffect(()=>{
    if(tab!=="map")return;
    if(gMapRef.current){return;}
    const buildMarker=(google,map,s,position)=>{
      const icon={url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(pinSVG(s.featured,s.id)),scaledSize:new google.maps.Size(34,48),anchor:new google.maps.Point(17,48)};
      const marker=new google.maps.Marker({position,icon,title:s.gallery});
      const shortAddr=s.address.replace(", Montréal, QC","");
      const infoContent=`<div style="width:220px;font-family:'DM Sans',sans-serif;background:#fff;border-radius:6px;overflow:hidden;"><div style="height:5px;background:${s.between?"#D8D4CC":s.color};"></div><div style="padding:14px 15px;"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#2B5BE8;font-weight:700;margin-bottom:6px;">${s.gallery}</div>${s.between?`<div style="font-size:13px;color:#6B6560;font-style:italic;margin-bottom:10px;">Between exhibitions</div>`:`<div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:600;color:#0F0E0C;line-height:1.2;margin-bottom:3px;">${s.title}</div><div style="font-size:12px;color:#6B6560;margin-bottom:10px;">${s.artist}</div>`}<div style="font-size:11px;color:#9B9590;margin-bottom:13px;">📍 ${shortAddr}</div><div style="display:flex;gap:8px;"><a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}" target="_blank" style="flex:1;background:#F4F4F4;color:#0F0E0C;border:none;padding:10px 0;border-radius:3px;font-size:9px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;display:flex;align-items:center;justify-content:center;text-align:center;">Directions</a><button onclick="window.__lvOpen('${s.id}')" ontouchend="event.preventDefault();window.__lvOpen('${s.id}')" style="flex:1;background:#0F0E0C;color:#fff;border:none;padding:10px 0;border-radius:3px;font-size:9px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">View →</button></div></div></div>`;
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
          else{lat=s.lat;lng=s.lng;}
          const key=lat.toFixed(5)+","+lng.toFixed(5);
          const count=seenPositions[key]=(seenPositions[key]||0)+1;
          if(count>1){const angle=(count-1)*(2*Math.PI/8);lat+=0.00008*Math.cos(angle);lng+=0.00008*Math.sin(angle);}
          resolve(buildMarker(google,map,s,{lat,lng}));
        });
      })));
      if(!window.markerClusterer){await new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});}
      SHOWS.forEach((s,i)=>{geocodedPositions.current[s.id]=markers[i].getPosition();});
      const cl=new window.markerClusterer.MarkerClusterer({map,markers});
      clustererRef.current=cl;
      markersRef.current.forEach(m=>m.marker.setMap(map));
    };
    if(window.google&&window.google.maps){initMap();}
    else{const scriptId="gmap-script";if(!document.getElementById(scriptId)){window.__initGMap=initMap;const sc=document.createElement("script");sc.id=scriptId;sc.src=`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=__initGMap`;sc.async=true;document.head.appendChild(sc);}}
  },[tab,SHOWS]);

  const[toastId,setToastId]=useState(null);
  const[toastVisible,setToastVisible]=useState(false);
  const toastTimer=useRef(null);
  const[showGuide,setShowGuide]=useState(()=>!localStorage.getItem("lv_guide_seen"));
  useEffect(()=>{
    if(showGuide){const t=setTimeout(()=>{setShowGuide(false);localStorage.setItem("lv_guide_seen","1");},4000);return()=>clearTimeout(t);}
  },[showGuide]);
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
        {toastId===id&&toastVisible&&(<div style={{position:"absolute",bottom:"calc(100% + 6px)",right:0,background:INK,color:WHITE,fontSize:11,fontWeight:600,letterSpacing:"0.06em",whiteSpace:"nowrap",padding:"6px 10px",borderRadius:4,pointerEvents:"none",animation:"fadeIn 0.15s ease",zIndex:10}}>{on?"Added to My Plan ✓":"Removed from Plan"}</div>)}
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
        {toastId===id&&toastVisible&&(<div style={{position:"absolute",top:-36,left:"50%",transform:"translateX(-50%)",background:INK,color:WHITE,fontSize:11,fontWeight:600,letterSpacing:"0.06em",whiteSpace:"nowrap",padding:"6px 10px",borderRadius:4,pointerEvents:"none",animation:"fadeIn 0.15s ease",zIndex:10}}>{on?"Added to My Plan ✓":"Removed from Plan"}</div>)}
        <button onClick={e=>{e.stopPropagation();toggleSave(id);showToast(id);}} style={{width:"100%",padding:"13px 0",borderRadius:4,border:`1.5px solid ${on?BLUE:BORDER}`,background:on?`${BLUE}12`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all 0.2s",marginBottom:24}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={on?BLUE:MID}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:on?BLUE:MID}}>{on?"In My Plan ✓":"Add to My Plan"}</span>
        </button>
      </div>
    );
  };

  const FILTERS=[["featured",t.featured],["all",t.all],["closing",t.closing],["opening",t.opening],["nearby",t.nearby],["mile-end",t.mileEnd],["downtown",t.downtown],["rosemont",t.rosemont],["griffintown",t.griffintown],["saint-henri",t.saintHenri],["plateau",t.plateau]];
  const shortAddr=a=>a?a.replace(", Montréal, QC",""):"";

  // Tab bar config — bottom nav
  const tabs=[
    { key:"exhibitions", label:"Exhibitions", icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    )},
    { key:"map", label:"Map", icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    )},
    ...(FEATURES.reviews?[{ key:"reviews", label:"Reviews", icon:(active)=>(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?BLUE:MID} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )}]:[]),
  ];

  const sourceLabel = detailSource === "exhibitions" ? "Exhibitions" : detailSource === "map" ? "Map" : "Reviews";

  if (showAdmin) return <AdminPage onExit={() => setShowAdmin(false)} />;

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:WHITE,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",maxWidth:430,margin:"0 auto",position:"relative",boxShadow:"0 0 60px rgba(0,0,0,0.08)"}}>

      {/* Top header — language + secret admin tap */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,zIndex:10}}>
        <div
          onClick={handleHeaderTap}
          style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",fontWeight:600,color:INK,cursor:"default",userSelect:"none"}}
        >
          Frame
        </div>
        <div style={{display:"flex",gap:4}}>
          {["en","fr"].map(l=>(
            <button key={l} onClick={()=>{setLang(l);if(l==="fr")setShowLangBanner(true);}} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${lang===l?INK:BORDER}`,background:lang===l?INK:WHITE,color:lang===l?WHITE:MID,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
          ))}
        </div>
      </div>

      {showLangBanner&&lang==="fr"&&(<div style={{background:BLUE,color:WHITE,fontSize:12,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}><span>Version française bientôt disponible</span><button onClick={()=>setShowLangBanner(false)} style={{background:"none",border:"none",color:WHITE,fontSize:20,cursor:"pointer",lineHeight:1,padding:0}}>×</button></div>)}

      {/* Main content area */}
      <div style={{flex:1,overflow:"hidden",position:"relative",background:WHITE,display:"flex",flexDirection:"column"}}>

        {tab==="exhibitions"&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:"12px 0 12px 16px",flexShrink:0}}>
              <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingRight:16}}>
                {FILTERS.map(([val,label])=>(<button key={val} onClick={()=>setFilter(val)} style={{flexShrink:0,padding:"7px 15px",borderRadius:20,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,border:`1.5px solid ${filter===val?BLUE:BORDER}`,background:filter===val?BLUE:WHITE,color:filter===val?WHITE:MID,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{label}</button>))}
              </div>
            </div>
            {loading&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.loading}</div>}
            {loadError&&<div style={{padding:"40px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.error}</div>}
            {filter==="nearby"&&locError&&<div style={{padding:"24px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.locationDenied}</div>}
            {filter==="nearby"&&!userLoc&&!locError&&<div style={{padding:"24px 20px",textAlign:"center",color:MID,fontSize:14}}>{t.gettingLocation}</div>}
            <div style={{flex:1,overflowY:"auto"}}>
              {!loading&&!loadError&&filtered.map(s=>{
                const dist=userLoc?distanceKm(userLoc.lat,userLoc.lng,s.lat,s.lng):null;
                const closing=isClosingThisWeek(s),opening=isOpeningThisWeek(s);
                return(
                  <div key={s.id} onClick={()=>{setDetail(s);setDetailSource("exhibitions");}} style={{position:"relative",cursor:"pointer",borderBottom:`1px solid ${BORDER}`}}>
                    <div style={{width:"100%",height:s.between?110:220,background:s.between?LIGHT:s.color,position:"relative",overflow:"hidden"}}>
                      {s.image_url&&!s.between&&<img src={s.image_url} alt={s.title} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>}
                      {!s.between&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:"70%",background:"linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0) 100%)"}}/>}
                      {s.featured&&!s.between&&<div style={{position:"absolute",top:12,left:12}} dangerouslySetInnerHTML={{__html:badgeSVG()}}/>}
                      {!s.between&&(<div style={{position:"absolute",top:12,right:12,display:"flex",gap:6,flexDirection:"column",alignItems:"flex-end"}}>{s.reviewed&&<span style={{fontSize:10,padding:"3px 8px",background:INK,color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Reviewed</span>}{closing&&<span style={{fontSize:10,padding:"3px 8px",background:BLUE,color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.closingSoon}</span>}{opening&&!closing&&<span style={{fontSize:10,padding:"3px 8px",background:"#22A06B",color:WHITE,borderRadius:3,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.openingSoon}</span>}</div>)}
                      {s.between?(<div style={{height:"100%",display:"flex",alignItems:"center",padding:"0 20px"}}><div><div style={{fontSize:11,letterSpacing:"0.10em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:6}}>{s.gallery}</div><div style={{fontSize:13,color:MID,fontStyle:"italic"}}>{t.betweenShows}</div></div></div>):(<div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 16px"}}><div style={{fontSize:11,letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(255,255,255,0.75)",fontWeight:600,marginBottom:4}}>{s.gallery}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",fontWeight:600,color:WHITE,lineHeight:1.15,marginBottom:2}}>{s.title}</div><div style={{fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:400}}>{s.artist}</div></div>)}
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:WHITE}}>
                      <div><div style={{fontSize:13,color:INK,fontWeight:500,marginBottom:2}}>{shortAddr(s.address)} · {s.hood}</div><div style={{fontSize:12,color:MID}}>{dist?`${dist.toFixed(1)} km ${t.away} · `:""}{s.between?"":s.dates}</div></div>
                      <div style={{position:"relative"}}><PinButton id={s.id}/>{showGuide&&filtered.indexOf(s)===0&&(<div style={{position:"absolute",bottom:"calc(100% + 10px)",right:0,background:INK,color:WHITE,fontSize:11,fontWeight:600,padding:"8px 12px",borderRadius:4,whiteSpace:"nowrap",zIndex:100,animation:"fadeIn 0.3s ease",pointerEvents:"none",lineHeight:1.5}}>Tap to save to your plan<div style={{position:"absolute",bottom:-5,right:14,width:10,height:10,background:INK,transform:"rotate(45deg)"}}/></div>)}</div>
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

        {FEATURES.reviews&&tab==="reviews"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{textAlign:"center",color:MID,fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic"}}>Reviews coming soon.</div>
          </div>
        )}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div style={{
        background: WHITE,
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 10,
      }}>
        {tabs.map(({key, label, icon}) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "10px 0 8px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                position: "relative",
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 32, height: 2, borderRadius: 2,
                  background: BLUE,
                }} />
              )}
              {icon(active)}
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: active ? BLUE : MID,
              }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Detail Page ── */}
      {detail&&(
        <div style={{position:"fixed",inset:0,background:WHITE,zIndex:2000,overflowY:"auto",animation:"slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",maxWidth:430,margin:"0 auto"}}>
          {/* Improved back button — full header bar */}
          <div style={{
            position:"sticky",top:0,background:WHITE,borderBottom:`1px solid ${BORDER}`,
            height:52,display:"flex",alignItems:"center",padding:"0 4px 0 0",zIndex:10,
          }}>
            <button
              onClick={()=>setDetail(null)}
              style={{
                height:"100%", padding:"0 20px",
                display:"flex",alignItems:"center",gap:6,
                background:"none",border:"none",cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                minWidth:44,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              <span style={{fontSize:13,fontWeight:600,color:INK,letterSpacing:"0.02em"}}>{sourceLabel}</span>
            </button>
          </div>

          <div style={{width:"100%",height:detail.between?140:260,background:detail.between?LIGHT:detail.color,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
            {detail.image_url&&!detail.between&&<img src={detail.image_url} alt={detail.title} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>}
            {detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:MID}}>{t.betweenShows}</div>}
          </div>
          <div style={{padding:"24px 20px"}}>
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:8}}>{detail.gallery}</div>
            {!detail.between&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontStyle:"italic",fontWeight:500,lineHeight:1.15,marginBottom:6}}>{detail.title}</div>}
            {!detail.between&&detail.artist&&<div style={{fontSize:17,fontWeight:400,marginBottom:22,color:INK}}>{detail.artist}</div>}
            {!detail.between&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",border:`1px solid ${BORDER}`,borderRadius:4,marginBottom:16,overflow:"hidden"}}>{[[t.dates,detail.dates],[t.hours,detail.hours||"—"],[t.area,detail.hood]].map(([label,val],i)=>(<div key={label} style={{padding:"13px 10px",textAlign:"center",borderRight:i<2?`1px solid ${BORDER}`:"none"}}><div style={{fontSize:10,letterSpacing:"0.10em",textTransform:"uppercase",color:MID,fontWeight:600,marginBottom:5}}>{label}</div><div style={{fontSize:13,fontWeight:600,lineHeight:1.3,color:INK}}>{val}</div></div>))}</div>)}
            {!detail.between&&<PlanToggle id={detail.id}/>}
            <div style={{fontSize:14,color:MID,marginBottom:16}}>📍 {shortAddr(detail.address)}, {detail.hood}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,lineHeight:1.8,marginBottom:26,color:INK}}>{detail.desc}</div>
            {detail.reviewed&&detail.quote&&(<div style={{background:"#EEF2FD",borderLeft:`3px solid ${BLUE}`,padding:"18px 16px",marginBottom:24,borderRadius:"0 4px 4px 0"}}><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:BLUE,fontWeight:700,marginBottom:10}}>{t.vernissageReview}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",lineHeight:1.8,marginBottom:10,color:INK}}>{detail.quote}</div><div style={{fontSize:12,color:MID}}>{detail.by}</div></div>)}
            <div style={{display:"flex",gap:12,paddingBottom:40}}>
              <a href={mapsUrl(detail.address)} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:15,background:INK,color:WHITE,border:"none",borderRadius:4,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.getDirections}</a>
              <button onClick={()=>{if(navigator.share){navigator.share({title:`${detail.title} — ${detail.gallery}`,url:window.location.href});}else{navigator.clipboard?.writeText(window.location.href);}}} style={{flex:1,padding:15,background:WHITE,color:INK,border:`1.5px solid ${INK}`,borderRadius:4,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.share}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        *{-webkit-font-smoothing:antialiased;}
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
