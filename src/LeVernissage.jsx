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

const TRANSLATIONS = {
  en: {
    exhibitions: "Exhibitions", map: "Map", reviews: "Reviews",
    allShows: "All Shows", myPlan: "My Plan",
    all: "All", featured: "Featured", reviewed: "Reviewed",
    closing: "Closing This Week", opening: "Opening This Week",
    nearby: "Nearby", mileEnd: "Mile-End", downtown: "Downtown",
    rosemont: "Rosemont", griffintown: "Griffintown", saintHenri: "Saint-Henri",
    featuredReview: "Featured Review", moreReviews: "More Reviews",
    getDirections: "Get Directions", share: "Share", back: "Back",
    addToPlan: "Add to plan", inPlan: "In plan",
    dates: "Dates", hours: "Hours", area: "Area",
    noShowsInPlan: "No shows in your plan yet",
    addFromShows: "Add shows from the Exhibitions tab",
    locationDenied: "Location access denied. Please enable in your browser settings.",
    gettingLocation: "Getting your location…",
    vernissageReview: "Vernissage Review",
    frComingSoon: "French version coming soon · Version française bientôt disponible",
    april2026: "April 2026 · Montréal",
    closingSoon: "Closing", openingSoon: "Opening", away: "away",
  },
  fr: {
    exhibitions: "Expositions", map: "Carte", reviews: "Critiques",
    allShows: "Toutes", myPlan: "Mon Plan",
    all: "Tout", featured: "En vedette", reviewed: "Critiquées",
    closing: "Ferme cette semaine", opening: "Ouvre cette semaine",
    nearby: "À proximité", mileEnd: "Mile-End", downtown: "Centre-ville",
    rosemont: "Rosemont", griffintown: "Griffintown", saintHenri: "Saint-Henri",
    featuredReview: "Critique en vedette", moreReviews: "Plus de critiques",
    getDirections: "Itinéraire", share: "Partager", back: "Retour",
    addToPlan: "Ajouter", inPlan: "Ajouté",
    dates: "Dates", hours: "Heures", area: "Quartier",
    noShowsInPlan: "Aucune exposition dans votre plan",
    addFromShows: "Ajoutez des expositions depuis l'onglet Expositions",
    locationDenied: "Accès à la localisation refusé.",
    gettingLocation: "Localisation en cours…",
    vernissageReview: "Critique du Vernissage",
    frComingSoon: "",
    april2026: "Avril 2026 · Montréal",
    closingSoon: "Ferme bientôt", openingSoon: "Ouvre bientôt", away: "de vous",
  }
};

const INK = "#0F0E0C";
const BLUE = "#2B5BE8";
const WHITE = "#FFFFFF";
const BORDER = "#E8E5E0";
const MID = "#6B6560";
const LIGHT = "#F4F4F4";
const PIN_RED = "#E8251A";
const TODAY = new Date("2026-04-08");

function isClosingThisWeek(s) {
  const d = (new Date(s.closeDate) - TODAY) / 86400000;
  return d >= 0 && d <= 7;
}
function isOpeningThisWeek(s) {
  const d = (new Date(s.openDate) - TODAY) / 86400000;
  return d >= -7 && d <= 7;
}
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function mapsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + ", Montreal, QC")}`;
}

function pinSVG(reviewed) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="38" viewBox="0 0 26 38">
    <defs>
      <filter id="ps" x="-50%" y="-20%" width="200%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.32)"/>
      </filter>
      <radialGradient id="pg" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#FF5A4A"/>
        <stop offset="100%" stop-color="${PIN_RED}"/>
      </radialGradient>
    </defs>
    <ellipse cx="13" cy="36.5" rx="4.5" ry="1.5" fill="rgba(0,0,0,0.15)"/>
    <line x1="13" y1="14" x2="13" y2="34" stroke="#999" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="13" cy="12" r="11" fill="url(#pg)" filter="url(#ps)"/>
    <circle cx="10" cy="9" r="4" fill="white" opacity="0.28"/>
    ${reviewed ? `<circle cx="13" cy="12" r="4.5" fill="${BLUE}" opacity="0.9"/>` : `<circle cx="13" cy="12" r="3" fill="white" opacity="0.7"/>`}
  </svg>`;
}

export default function App() {
  const [tab, setTab] = useState("exhibitions");
  const [detail, setDetail] = useState(null);
  const [saved, setSaved] = useState(new Set(["blouin", "bradley", "ellephant"]));
  const [filter, setFilter] = useState("featured");
  const [mapMode, setMapMode] = useState("all");
  const [userLoc, setUserLoc] = useState(null);
  const [locError, setLocError] = useState(false);
  const [lang, setLang] = useState("en");
  const [showLangBanner, setShowLangBanner] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  const t = TRANSLATIONS[lang];

  const toggleSave = (id) => setSaved(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  useEffect(() => {
    if (filter === "nearby" && !userLoc && !locError) {
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
    if (filter === "nearby") return true;
    if (filter === "mile-end") return s.hood === "Mile-End";
    if (filter === "downtown") return s.hood === "Downtown";
    if (filter === "rosemont") return s.hood === "Rosemont";
    if (filter === "griffintown") return s.hood === "Griffintown";
    if (filter === "saint-henri") return s.hood === "Saint-Henri";
    return true;
  }).sort((a, b) => {
    if (filter === "nearby" && userLoc)
      return distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) - distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng);
    return 0;
  });

  function addMarker(L, map, s) {
    const icon = L.divIcon({ className: "", html: pinSVG(s.reviewed), iconSize: [26, 38], iconAnchor: [13, 38], popupAnchor: [0, -40] });
    const marker = L.marker([s.lat, s.lng], { icon }).addTo(map).bindPopup(`
      <div style="width:215px;font-family:'DM Sans',sans-serif;">
        <div style="height:4px;background:${s.color};"></div>
        <div style="padding:13px 15px 15px;">
          <div style="font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:${BLUE};font-weight:700;margin-bottom:4px;">${s.gallery}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:600;color:${INK};line-height:1.2;margin-bottom:4px;">${s.title}</div>
          <div style="font-size:12px;color:${MID};margin-bottom:5px;">${s.artist}</div>
          <div style="font-size:11px;color:${MID};margin-bottom:12px;">${s.address}</div>
          <button onclick="window.__lvSelect('${s.id}')" style="width:100%;background:${INK};color:white;border:none;padding:10px;border-radius:3px;font-size:10px;letter-spacing:.10em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">View Show →</button>
        </div>
      </div>
    `, { className: "vp", maxWidth: 235 });
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
    if (leafletMapRef.current) { setTimeout(() => leafletMapRef.current.invalidateSize(), 60); return; }
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
        .vp .leaflet-popup-content-wrapper{border-radius:4px!important;border:1px solid #E8E5E0!important;box-shadow:0 8px 32px rgba(0,0,0,0.14)!important;overflow:hidden;padding:0!important;}
        .vp .leaflet-popup-content{margin:0!important;}
        .vp .leaflet-popup-tip-container{display:none;}
        .leaflet-control-zoom{border:none!important;box-shadow:0 2px 8px rgba(0,0,0,0.10)!important;}
        .leaflet-control-zoom a{border:1px solid #E8E5E0!important;border-radius:4px!important;color:#0F0E0C!important;font-size:18px!important;font-weight:400!important;margin-bottom:4px;display:flex!important;align-items:center;justify-content:center;background:white!important;width:34px!important;height:34px!important;}
        .leaflet-control-zoom a:hover{background:#F4F4F4!important;}
        .leaflet-control-attribution{font-size:9px!important;}
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
      const map = L.map(mapRef.current, { center: [45.5050, -73.5600], zoom: 13, zoomControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20, attribution: '© <a href="https://carto.com">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>'
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletMapRef.current = map;
      window.__lvSelect = (id) => { const s = SHOWS.find(x => x.id === id); if (s) setDetail(s); };
      SHOWS.forEach(s => addMarker(L, map, s));
    };
    initMap();
    return () => { window.__lvSelect = null; };
  }, [tab]);

  const PinButton = ({ id, size = 42 }) => {
    const on = saved.has(id);
    return (
      <button onClick={(e) => { e.stopPropagation(); toggleSave(id); }}
        title={on ? t.inPlan : t.addToPlan}
        style={{ width: size, height: size, borderRadius: 4, border: `1.5px solid ${on ? BLUE : BORDER}`, background: on ? BLUE : WHITE, color: on ? WHITE : BORDER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? WHITE : "#C0BBB5"} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </button>
    );
  };

  const FILTERS = [
    ["featured", t.featured], ["all", t.all], ["reviewed", t.reviewed],
    ["closing", t.closing], ["opening", t.opening], ["nearby", t.nearby],
    ["mile-end", t.mileEnd], ["downtown", t.downtown],
    ["rosemont", t.rosemont], ["griffintown", t.griffintown], ["saint-henri", t.saintHenri],
  ];

  const TABS = [
    ["exhibitions", t.exhibitions],
    ["map", t.map],
    ["reviews", t.reviews],
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: WHITE, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: 430, margin: "0 auto", position: "relative", boxShadow: "0 0 60px rgba(0,0,0,0.08)" }}>

      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, zIndex: 10 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, letterSpacing: "0.04em" }}>
          Le Vernissage<span style={{ color: BLUE }}>.</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {["en","fr"].map(l => (
            <button key={l} onClick={() => { setLang(l); if (l === "fr") setShowLangBanner(true); }} style={{ padding: "5px 10px", borderRadius: 3, border: `1px solid ${lang === l ? INK : BORDER}`, background: lang === l ? INK : WHITE, color: lang === l ? WHITE : MID, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* FR banner */}
      {showLangBanner && lang === "fr" && (
        <div style={{ background: BLUE, color: WHITE, fontSize: 12, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span>Version française bientôt disponible</span>
          <button onClick={() => setShowLangBanner(false)} style={{ background: "none", border: "none", color: WHITE, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}`, display: "flex", flexShrink: 0, zIndex: 10, padding: "6px 6px 0" }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "11px 6px 12px",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: tab === key ? INK : MID,
            background: tab === key ? WHITE : "transparent",
            border: `1px solid ${tab === key ? BORDER : "transparent"}`,
            borderBottom: tab === key ? `1px solid ${WHITE}` : "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            marginBottom: tab === key ? -1 : 0,
            zIndex: tab === key ? 2 : 1, position: "relative",
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", position: "relative", background: WHITE }}>

        {/* EXHIBITIONS TAB */}
        {tab === "exhibitions" && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

            {/* Filter pills */}
            <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: "12px 0 12px 16px", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingRight: 16 }}>
                {FILTERS.map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)} style={{
                    flexShrink: 0, padding: "7px 15px", borderRadius: 20,
                    fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500,
                    border: `1.5px solid ${filter === val ? BLUE : BORDER}`,
                    background: filter === val ? BLUE : WHITE,
                    color: filter === val ? WHITE : MID,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.12s",
                    whiteSpace: "nowrap",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Location states */}
            {filter === "nearby" && locError && (
              <div style={{ padding: "24px 20px", textAlign: "center", color: MID, fontSize: 14 }}>{t.locationDenied}</div>
            )}
            {filter === "nearby" && !userLoc && !locError && (
              <div style={{ padding: "24px 20px", textAlign: "center", color: MID, fontSize: 14 }}>{t.gettingLocation}</div>
            )}

            {/* Show cards — image-first layout like reference */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map(s => {
                const dist = userLoc ? distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng) : null;
                const closing = isClosingThisWeek(s);
                const opening = isOpeningThisWeek(s);
                return (
                  <div key={s.id} onClick={() => setDetail(s)} style={{ position: "relative", cursor: "pointer", borderBottom: `1px solid ${BORDER}` }}>
                    {/* Full-width image/color block */}
                    <div style={{ width: "100%", height: 220, background: s.color, position: "relative", overflow: "hidden" }}>
                      {/* Gradient overlay for text legibility */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)" }} />
                      {/* Badges top right */}
                      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                        {s.reviewed && <span style={{ fontSize: 10, padding: "3px 8px", background: INK, color: WHITE, borderRadius: 3, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Reviewed</span>}
                        {closing && <span style={{ fontSize: 10, padding: "3px 8px", background: BLUE, color: WHITE, borderRadius: 3, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.closingSoon}</span>}
                        {opening && !closing && <span style={{ fontSize: 10, padding: "3px 8px", background: "#22A06B", color: WHITE, borderRadius: 3, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.openingSoon}</span>}
                        {s.featured && !s.reviewed && <span style={{ fontSize: 10, padding: "3px 8px", background: "rgba(255,255,255,0.15)", color: WHITE, border: "1px solid rgba(255,255,255,0.5)", borderRadius: 3, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Featured</span>}
                      </div>
                      {/* Text over image */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px 14px" }}>
                        <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: 4 }}>{s.gallery}</div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontStyle: "italic", fontWeight: 600, color: WHITE, lineHeight: 1.15, marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 400 }}>{s.artist}</div>
                      </div>
                    </div>
                    {/* Info row below image */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: WHITE }}>
                      <div>
                        <div style={{ fontSize: 13, color: INK, fontWeight: 500, marginBottom: 2 }}>{s.address} · {s.hood}</div>
                        <div style={{ fontSize: 12, color: MID }}>
                          {dist ? `${dist.toFixed(1)} km ${t.away} · ` : ""}{s.dates}
                        </div>
                      </div>
                      <PinButton id={s.id} size={40} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MAP TAB */}
        <div style={{ display: tab === "map" ? "flex" : "none", flexDirection: "column", height: "100%", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
            {[["all", t.allShows], ["plan", t.myPlan]].map(([mode, label]) => (
              <button key={mode} onClick={() => setMapMode(mode)} style={{ padding: "10px 22px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, background: mapMode === mode ? BLUE : WHITE, color: mapMode === mode ? WHITE : MID, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
          {mapMode === "plan" && saved.size === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 999, textAlign: "center", pointerEvents: "none", padding: "0 40px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: "italic", color: MID, marginBottom: 8 }}>{t.noShowsInPlan}</div>
              <div style={{ fontSize: 13, color: BORDER, lineHeight: 1.6 }}>{t.addFromShows}</div>
            </div>
          )}
          <div ref={mapRef} style={{ flex: 1 }} />
        </div>

        {/* REVIEWS TAB */}
        {tab === "reviews" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            {/* Featured review — white background */}
            <div onClick={() => setDetail(SHOWS[0])} style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, cursor: "pointer", padding: "0 0 20px" }}>
              <div style={{ width: "100%", height: 240, background: SHOWS[0].color, marginBottom: 18, position: "relative" }}>
                <div style={{ position: "absolute", top: 16, left: 18 }}>
                  <span style={{ fontSize: 10, padding: "4px 10px", background: BLUE, color: WHITE, borderRadius: 3, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>{t.featuredReview}</span>
                </div>
              </div>
              <div style={{ padding: "0 20px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: BLUE, fontWeight: 700, marginBottom: 10 }}>{SHOWS[0].gallery}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, lineHeight: 1.2, color: INK, marginBottom: 10 }}>On looking slowly: Marie-Claire Leblanc at Blouin Division</div>
                <div style={{ fontSize: 15, color: MID, lineHeight: 1.6, marginBottom: 14, fontWeight: 400 }}>A show that demands patience, and rewards it completely.</div>
                <div style={{ fontSize: 12, color: MID, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Sophie Tran</span>
                  <span style={{ width: 3, height: 3, background: BORDER, borderRadius: "50%", display: "inline-block" }} />
                  <span>April 8, 2026</span>
                  <span style={{ width: 3, height: 3, background: BORDER, borderRadius: "50%", display: "inline-block" }} />
                  <span>5 min read</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: MID, fontWeight: 700, padding: "18px 20px 12px", borderBottom: `1px solid ${BORDER}` }}>{t.moreReviews}</div>
            {[
              { s: SHOWS[1], title: "James Nizam's light as material", author: "Marc Durand · Apr 2 · 4 min" },
              { s: SHOWS[2], title: "Lisières and the edges of memory", author: "Isabelle Fleury · Mar 28 · 6 min" },
              { s: SHOWS[4], title: "Soft Infrastructure and the question of care", author: "Yasmine Hamdan · Mar 21 · 5 min" },
            ].map((r, i) => (
              <div key={i} onClick={() => setDetail(r.s)} style={{ display: "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${BORDER}`, background: WHITE, cursor: "pointer" }}>
                <div style={{ width: 86, height: 86, borderRadius: 4, background: r.s.color, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: BLUE, fontWeight: 700, marginBottom: 6 }}>{r.s.gallery}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: MID }}>{r.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL OVERLAY */}
      {detail && (
        <div style={{ position: "absolute", inset: 0, background: WHITE, zIndex: 50, overflowY: "auto", animation: "slideUp 0.32s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ position: "sticky", top: 0, background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 10 }}>
            <button onClick={() => setDetail(null)} style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: MID, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ fontSize: 18, color: INK, lineHeight: 1 }}>←</span> {t.back}
            </button>
            <PinButton id={detail.id} size={40} />
          </div>
          <div style={{ width: "100%", height: 260, background: detail.color }} />
          <div style={{ padding: "24px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, fontWeight: 700, marginBottom: 8 }}>{detail.gallery}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontStyle: "italic", fontWeight: 500, lineHeight: 1.15, marginBottom: 6 }}>{detail.title}</div>
            <div style={{ fontSize: 17, fontWeight: 400, marginBottom: 22, color: INK }}>{detail.artist}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: `1px solid ${BORDER}`, borderRadius: 4, marginBottom: 24, overflow: "hidden" }}>
              {[[t.dates, detail.dates], [t.hours, "Tue–Sat 11–18h"], [t.area, detail.hood]].map(([label, val], i) => (
                <div key={label} style={{ padding: "13px 10px", textAlign: "center", borderRight: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase", color: MID, fontWeight: 600, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: INK }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, color: MID, marginBottom: 6 }}>📍 {detail.address}, {detail.hood}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400, lineHeight: 1.8, marginBottom: 26, color: INK }}>{detail.desc}</div>
            {detail.reviewed && (
              <div style={{ background: "#EEF2FD", borderLeft: `3px solid ${BLUE}`, padding: "18px 16px", marginBottom: 24, borderRadius: "0 4px 4px 0" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, fontWeight: 700, marginBottom: 10 }}>{t.vernissageReview}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", lineHeight: 1.8, marginBottom: 10, color: INK }}>{detail.quote}</div>
                <div style={{ fontSize: 12, color: MID }}>{detail.by}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
              <a href={mapsUrl(detail.address)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: 15, background: INK, color: WHITE, border: "none", borderRadius: 4, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.getDirections}
              </a>
              <button onClick={() => { if (navigator.share) { navigator.share({ title: `${detail.title} — ${detail.gallery}`, text: `${detail.artist} at ${detail.gallery}`, url: window.location.href }); } else { navigator.clipboard?.writeText(window.location.href); } }} style={{ flex: 1, padding: 15, background: WHITE, color: INK, border: `1.5px solid ${INK}`, borderRadius: 4, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                {t.share}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        *{-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{display:none;}
      `}</style>
    </div>
  );
}
