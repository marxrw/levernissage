import { useState, useEffect, useRef } from "react";

const SHOWS = [
  {
    id: "blouin", gallery: "Blouin Division", title: "Corps de mémoire", artist: "Marie-Claire Leblanc",
    dates: "Mar 15 – Apr 26", openDate: "2026-03-15", closeDate: "2026-04-26",
    hood: "Griffintown", color: "#C8A882", reviewed: true, featured: false,
    quote: '"This is painting that understands its own slowness. Leblanc isn\'t working against the speed of the contemporary image — she\'s simply uninterested in it. That refusal feels quietly radical."',
    by: "Sophie Tran · April 8, 2026",
    desc: "Leblanc's paintings arrive quietly. Layered in beeswax and pigment, each surface holds time the way skin does — recording pressure, warmth, and the slow work of forgetting.",
    address: "2020 rue William", lat: 45.4925, lng: -73.5618
  },
  {
    id: "bradley", gallery: "Bradley Ertaskiran", title: "Still Frequency", artist: "James Nizam",
    dates: "Mar 28 – May 3", openDate: "2026-03-28", closeDate: "2026-05-03",
    hood: "Saint-Henri", color: "#8BAEC4", reviewed: true, featured: false,
    quote: '"Nizam makes you aware of how much light is happening in any given room, unnoticed. These are arguments for a different quality of attention."',
    by: "Marc Durand · April 2, 2026",
    desc: "Nizam's photographs treat light as a sculptural material, capturing moments where beams, reflections and shadows form geometries too fleeting for the unaided eye.",
    address: "3550 rue Saint-Antoine O", lat: 45.4777, lng: -73.5760
  },
  {
    id: "charbonneau", gallery: "Hugues Charbonneau", title: "Lisières", artist: "Dominique Blain",
    dates: "Mar 6 – Apr 19", openDate: "2026-03-06", closeDate: "2026-04-19",
    hood: "Downtown", color: "#8DAA88", reviewed: false, featured: true,
    desc: "Blain's practice occupies the space between document and testimony. Works on paper and installation navigating the edges of political memory.",
    address: "372 Ste-Catherine O, espace 508", lat: 45.5016, lng: -73.5726
  },
  {
    id: "mcbride", gallery: "McBride Contemporain", title: "Terrain vague", artist: "Nadia Myre",
    dates: "Apr 4 – May 10", openDate: "2026-04-04", closeDate: "2026-05-10",
    hood: "Downtown", color: "#6A6058", reviewed: false, featured: true,
    desc: "Myre's work sits at the intersection of language, land and Anishinaabe knowledge systems. New textile and mixed-media works.",
    address: "372 Ste-Catherine O, Suite 414", lat: 45.5018, lng: -73.5724
  },
  {
    id: "ellephant", gallery: "ELLEPHANT", title: "Soft Infrastructure", artist: "Group Show",
    dates: "Mar 20 – Apr 30", openDate: "2026-03-20", closeDate: "2026-04-30",
    hood: "Quartier des spectacles", color: "#B86040", reviewed: false, featured: true,
    desc: "Five artists consider the systems of care — emotional, domestic, civic — that make collective life possible.",
    address: "1201 rue Saint-Dominique", lat: 45.5098, lng: -73.5623
  },
  {
    id: "blais", gallery: "Galerie Simon Blais", title: "Feux pâles", artist: "Robert Wolfe",
    dates: "Apr 3 – May 17", openDate: "2026-04-03", closeDate: "2026-05-17",
    hood: "Mile-End", color: "#7888A0", reviewed: false, featured: true,
    desc: "A career retrospective of one of Quebec's most distinctive abstract painters. Large-scale canvases between restraint and eruption.",
    address: "5420 boul. Saint-Laurent", lat: 45.5243, lng: -73.5972
  },
  {
    id: "artmur", gallery: "Art Mûr", title: "Double Bind", artist: "Gwenaël Bélanger",
    dates: "Mar 21 – May 2", openDate: "2026-03-21", closeDate: "2026-05-02",
    hood: "Rosemont", color: "#C4907A", reviewed: false, featured: true,
    desc: "Bélanger's photographs stage impossible perceptual situations — images that look documentary but couldn't be.",
    address: "5826 rue Saint-Hubert", lat: 45.5338, lng: -73.5851
  },
  {
    id: "pangee", gallery: "Pangée", title: "Matière première", artist: "Sébastien Cliche",
    dates: "Apr 2 – May 8", openDate: "2026-04-02", closeDate: "2026-05-08",
    hood: "Mile-End", color: "#A89070", reviewed: false, featured: true,
    desc: "Cliche's sculptural practice excavates industrial materials, finding tenderness in concrete, rust, and reclaimed steel.",
    address: "1305 avenue des Pins O", lat: 45.5089, lng: -73.5882
  },
];

const INK = "#0F0E0C";
const BLUE = "#2B5BE8";
const WHITE = "#FFFFFF";
const BORDER = "#E0DDD8";
const MID = "#6B6560";
const LIGHT = "#F7F7F7";
const PIN_RED = "#E8251A";

const TODAY = new Date("2026-04-08");
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

function daysUntil(dateStr) {
  return (new Date(dateStr) - TODAY) / (24 * 60 * 60 * 1000);
}

function isClosingThisWeek(s) {
  const d = daysUntil(s.closeDate);
  return d >= 0 && d <= 7;
}

function isOpeningThisWeek(s) {
  const d = daysUntil(s.openDate);
  return d >= -7 && d <= 7;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Classic red map pin SVG
function pinSVG(reviewed) {
  const color = PIN_RED;
  const highlight = reviewed ? BLUE : PIN_RED;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <defs>
      <filter id="shadow" x="-40%" y="-10%" width="180%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
    </defs>
    <ellipse cx="12" cy="34" rx="4" ry="2" fill="rgba(0,0,0,0.18)"/>
    <line x1="12" y1="13" x2="12" y2="32" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="12" cy="11" r="10" fill="${color}" filter="url(#shadow)"/>
    <circle cx="9" cy="8" r="3" fill="white" opacity="0.35"/>
    ${reviewed ? `<circle cx="12" cy="11" r="4" fill="${BLUE}" opacity="0.85"/>` : ''}
  </svg>`;
}

export default function App() {
  const [tab, setTab] = useState("map");
  const [detail, setDetail] = useState(null);
  const [saved, setSaved] = useState(new Set(["blouin", "bradley", "ellephant"]));
  const [filter, setFilter] = useState("all");
  const [mapMode, setMapMode] = useState("all");
  const [userLoc, setUserLoc] = useState(null);
  const [locError, setLocError] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Geolocation
  useEffect(() => {
    if (filter === "nearby" && !userLoc) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocError(true)
      );
    }
  }, [filter]);

  const filtered = SHOWS.filter(s => {
    if (filter === "all") return true;
    if (filter === "featured") return s.featured;
    if (filter === "reviewed") return s.reviewed;
    if (filter === "closing") return isClosingThisWeek(s);
    if (filter === "opening") return isOpeningThisWeek(s);
    if (filter === "griffintown") return s.hood === "Griffintown";
    if (filter === "mile-end") return s.hood === "Mile-End";
    if (filter === "downtown") return s.hood === "Downtown";
    if (filter === "rosemont") return s.hood === "Rosemont";
    if (filter === "nearby") return true;
    return true;
  }).sort((a, b) => {
    if (filter === "nearby" && userLoc) {
      return distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) - distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng);
    }
    return 0;
  });

  function addMarker(L, map, s) {
    const icon = L.divIcon({ className: "", html: pinSVG(s.reviewed), iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38] });
    const marker = L.marker([s.lat, s.lng], { icon }).addTo(map).bindPopup(`
      <div style="width:210px;font-family:'DM Sans',sans-serif;">
        <div style="height:4px;background:${s.color};"></div>
        <div style="padding:12px 14px 14px;">
          <div style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:${BLUE};font-weight:600;margin-bottom:3px;">${s.gallery}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-style:italic;font-weight:600;color:${INK};line-height:1.2;margin-bottom:3px;">${s.title}</div>
          <div style="font-size:11px;color:${MID};margin-bottom:10px;">${s.artist}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">
            <div style="font-size:10px;color:${MID};">${s.dates}</div>
            ${isClosingThisWeek(s) ? `<div style="font-size:8px;background:${BLUE};color:white;padding:2px 6px;border-radius:2px;font-weight:600;">CLOSING</div>` : ""}
            ${s.reviewed ? `<div style="font-size:8px;background:${INK};color:white;padding:2px 6px;border-radius:2px;font-weight:600;">REVIEWED</div>` : ""}
          </div>
          <button onclick="window.__lvSelect('${s.id}')" style="width:100%;background:${INK};color:white;border:none;padding:9px;border-radius:2px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">View Show →</button>
        </div>
      </div>
    `, { className: "vp", maxWidth: 230 });
    markersRef.current.push({ id: s.id, marker });
  }

  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const showsToDisplay = mapMode === "plan" ? SHOWS.filter(s => saved.has(s.id)) : SHOWS;
    markersRef.current.forEach(m => m.marker.remove());
    markersRef.current = [];
    showsToDisplay.forEach(s => addMarker(window.L, leafletMapRef.current, s));
  }, [saved, mapMode]);

  useEffect(() => {
    if (tab !== "map") return;
    if (leafletMapRef.current) {
      setTimeout(() => leafletMapRef.current.invalidateSize(), 60);
      return;
    }
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    if (!document.getElementById("lf-style")) {
      const s = document.createElement("style");
      s.id = "lf-style";
      s.textContent = `
        .vp .leaflet-popup-content-wrapper { border-radius:4px!important; border:1.5px solid #0F0E0C!important; box-shadow:0 8px 32px rgba(0,0,0,0.15)!important; overflow:hidden; padding:0!important; }
        .vp .leaflet-popup-content { margin:0!important; }
        .vp .leaflet-popup-tip-container { display:none; }
        .leaflet-control-zoom { border:none!important; box-shadow:0 2px 8px rgba(0,0,0,0.12)!important; }
        .leaflet-control-zoom a { border:1px solid #E0DDD8!important; border-radius:4px!important; color:#0F0E0C!important; font-size:18px!important; font-weight:300!important; margin-bottom:4px; display:flex!important; align-items:center; justify-content:center; background:white!important; }
        .leaflet-control-zoom a:hover { background:#F7F7F7!important; }
      `;
      document.head.appendChild(s);
    }
    const initMap = async () => {
      if (!window.L) {
        await new Promise((res, rej) => {
          const sc = document.createElement("script");
          sc.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          sc.onload = res; sc.onerror = rej;
          document.head.appendChild(sc);
        });
      }
      if (!mapRef.current || leafletMapRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { center: [45.5050, -73.5600], zoom: 13, zoomControl: false, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20,
        attribution: '© <a href="https://carto.com">CARTO</a>'
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletMapRef.current = map;
      window.__lvSelect = (id) => { const s = SHOWS.find(x => x.id === id); if (s) setDetail(s); };
      SHOWS.forEach(s => addMarker(L, map, s));
    };
    initMap();
    return () => { window.__lvSelect = null; };
  }, [tab]);

  const PinButton = ({ id }) => {
    const on = saved.has(id);
    return (
      <button
        onClick={(e) => { e.stopPropagation(); toggleSave(id); }}
        title={on ? "Remove from plan" : "Add to map plan"}
        style={{
          width: 40, height: 40,
          borderRadius: 4,
          border: `1.5px solid ${on ? BLUE : BORDER}`,
          background: on ? BLUE : WHITE,
          color: on ? WHITE : BORDER,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.15s",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={on ? WHITE : BORDER} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </button>
    );
  };

  const FILTERS = [
    ["all", "All"],
    ["featured", "Featured"],
    ["reviewed", "Reviewed"],
    ["closing", "Closing This Week"],
    ["opening", "Opening This Week"],
    ["nearby", "Nearby"],
    ["mile-end", "Mile-End"],
    ["downtown", "Downtown"],
    ["rosemont", "Rosemont"],
    ["griffintown", "Griffintown"],
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: WHITE, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: 430, margin: "0 auto", position: "relative", boxShadow: "0 0 60px rgba(0,0,0,0.10)" }}>

      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, zIndex: 10 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, letterSpacing: "0.04em" }}>Le Vernissage<span style={{ color: BLUE }}>.</span></div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, letterSpacing: "0.10em", textTransform: "uppercase", color: MID, fontWeight: 500 }}><span style={{ color: INK, fontWeight: 600 }}>En</span> · Fr</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, cursor: "pointer" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 22, height: 1.5, background: INK }} />)}</div>
        </div>
      </div>

      {/* Tabs — Excel-style pressed look */}
      <div style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}`, display: "flex", flexShrink: 0, zIndex: 10, padding: "6px 6px 0" }}>
        {["map", "shows", "reviews"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 6px 11px",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
            color: tab === t ? INK : MID,
            background: tab === t ? WHITE : "transparent",
            border: tab === t ? `1px solid ${BORDER}` : "1px solid transparent",
            borderBottom: tab === t ? `1px solid ${WHITE}` : "none",
            borderRadius: tab === t ? "4px 4px 0 0" : "4px 4px 0 0",
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            marginBottom: tab === t ? -1 : 0,
            position: "relative",
            zIndex: tab === t ? 2 : 1,
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", position: "relative", background: WHITE }}>

        {/* MAP TAB */}
        <div style={{ display: tab === "map" ? "flex" : "none", flexDirection: "column", height: "100%", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            {[["all", "All Shows"], ["plan", "My Plan"]].map(([mode, label]) => (
              <button key={mode} onClick={() => setMapMode(mode)} style={{ padding: "9px 22px", fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600, background: mapMode === mode ? INK : WHITE, color: mapMode === mode ? WHITE : MID, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
          {mapMode === "plan" && saved.size === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 999, textAlign: "center", pointerEvents: "none", padding: "0 40px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: "italic", color: MID, marginBottom: 8 }}>No shows in your plan yet</div>
              <div style={{ fontSize: 13, color: BORDER, lineHeight: 1.6 }}>Add shows from the Shows tab</div>
            </div>
          )}
          <div ref={mapRef} style={{ flex: 1 }} />
        </div>

        {/* SHOWS TAB */}
        {tab === "shows" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: "22px 20px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: MID, fontWeight: 500, marginBottom: 8 }}>April 2026 · Montréal</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 500, lineHeight: 1.05, marginBottom: 18 }}>Current<br />Exhibitions</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
                {FILTERS.map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)} style={{
                    flexShrink: 0, padding: "8px 16px", borderRadius: 20,
                    fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500,
                    border: `1.5px solid ${filter === val ? BLUE : BORDER}`,
                    background: filter === val ? BLUE : WHITE,
                    color: filter === val ? WHITE : MID,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s"
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {filter === "nearby" && locError && (
              <div style={{ padding: "20px", textAlign: "center", color: MID, fontSize: 13 }}>Location access denied. Please enable in your browser settings.</div>
            )}
            {filter === "nearby" && !userLoc && !locError && (
              <div style={{ padding: "20px", textAlign: "center", color: MID, fontSize: 13 }}>Getting your location…</div>
            )}

            {filtered.map(s => {
              const dist = userLoc ? distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng) : null;
              return (
                <div key={s.id} onClick={() => setDetail(s)} style={{ display: "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${BORDER}`, background: WHITE, cursor: "pointer", alignItems: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 4, background: s.color, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, fontWeight: 600 }}>{s.gallery}</span>
                      {s.reviewed && <span style={{ fontSize: 9, padding: "2px 6px", background: INK, color: WHITE, borderRadius: 2, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Reviewed</span>}
                      {isClosingThisWeek(s) && <span style={{ fontSize: 9, padding: "2px 6px", background: BLUE, color: WHITE, borderRadius: 2, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Closing</span>}
                      {s.featured && !s.reviewed && <span style={{ fontSize: 9, padding: "2px 6px", background: LIGHT, color: BLUE, border: `1px solid ${BLUE}`, borderRadius: 2, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Featured</span>}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontStyle: "italic", fontWeight: 500, lineHeight: 1.2, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                    <div style={{ fontSize: 14, fontWeight: 400, marginBottom: 4 }}>{s.artist}</div>
                    <div style={{ fontSize: 12, color: MID }}>{s.hood}{dist ? ` · ${dist.toFixed(1)} km away` : ` · ${s.dates}`}</div>
                  </div>
                  <PinButton id={s.id} />
                </div>
              );
            })}
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab === "reviews" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <div onClick={() => setDetail(SHOWS[0])} style={{ background: INK, padding: "28px 20px 24px", cursor: "pointer" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: BLUE, fontWeight: 600, marginBottom: 12 }}>Featured Review</div>
              <div style={{ width: "100%", height: 200, borderRadius: 4, background: SHOWS[0].color, marginBottom: 16 }} />
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, lineHeight: 1.2, color: WHITE, marginBottom: 10 }}>On looking slowly: Marie-Claire Leblanc at Blouin Division</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 14, fontWeight: 300 }}>A show that demands patience, and rewards it completely.</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Sophie Tran</span>
                <span style={{ width: 3, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: "50%", display: "inline-block" }} />
                <span>April 8, 2026</span>
                <span style={{ width: 3, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: "50%", display: "inline-block" }} />
                <span>5 min read</span>
              </div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MID, fontWeight: 600, padding: "18px 20px 12px", background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>More Reviews</div>
            {[
              { s: SHOWS[1], title: "James Nizam's light as material", author: "Marc Durand · Apr 2 · 4 min" },
              { s: SHOWS[2], title: "Lisières and the edges of memory", author: "Isabelle Fleury · Mar 28 · 6 min" },
              { s: SHOWS[4], title: "Soft Infrastructure and the question of care", author: "Yasmine Hamdan · Mar 21 · 5 min" },
            ].map((r, i) => (
              <div key={i} onClick={() => setDetail(r.s)} style={{ display: "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${BORDER}`, background: WHITE, cursor: "pointer" }}>
                <div style={{ width: 82, height: 82, borderRadius: 4, background: r.s.color, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, fontWeight: 600, marginBottom: 6 }}>{r.s.gallery}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: MID }}>{r.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL OVERLAY */}
      {detail && (
        <div style={{ position: "absolute", inset: 0, background: WHITE, zIndex: 50, overflowY: "auto", animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ position: "sticky", top: 0, background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 10 }}>
            <button onClick={() => setDetail(null)} style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600, color: MID, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ fontSize: 16, color: INK }}>←</span> Back
            </button>
            <PinButton id={detail.id} />
          </div>
          <div style={{ width: "100%", height: 260, background: detail.color }} />
          <div style={{ padding: "24px 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, fontWeight: 600, marginBottom: 8 }}>{detail.gallery}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontStyle: "italic", fontWeight: 500, lineHeight: 1.15, marginBottom: 6 }}>{detail.title}</div>
            <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 22 }}>{detail.artist}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: `1px solid ${BORDER}`, borderRadius: 4, marginBottom: 24, overflow: "hidden" }}>
              {[["Dates", detail.dates], ["Hours", "Tue–Sat 11–18h"], ["Area", detail.hood]].map(([label, val], i) => (
                <div key={label} style={{ padding: "13px 10px", textAlign: "center", borderRight: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: MID, fontWeight: 500, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 400, lineHeight: 1.8, marginBottom: 26 }}>{detail.desc}</div>
            {detail.reviewed && (
              <div style={{ background: "#EEF2FD", borderLeft: `3px solid ${BLUE}`, padding: "18px 16px", marginBottom: 24, borderRadius: "0 4px 4px 0" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, fontWeight: 600, marginBottom: 10 }}>Vernissage Review</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontStyle: "italic", lineHeight: 1.8, marginBottom: 10 }}>{detail.quote}</div>
                <div style={{ fontSize: 11, color: MID }}>{detail.by}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
              <button style={{ flex: 1, padding: 15, background: INK, color: WHITE, border: "none", borderRadius: 4, fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Get Directions</button>
              <button style={{ flex: 1, padding: 15, background: WHITE, color: INK, border: `1.5px solid ${INK}`, borderRadius: 4, fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Share</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        *{-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{display:none;}
      `}</style>
    </div>
  );
}
