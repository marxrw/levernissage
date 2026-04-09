import { useState, useEffect, useRef } from "react";

const SHOWS = [
  {
    id: "blouin", gallery: "Blouin Division", title: "Corps de mémoire", artist: "Marie-Claire Leblanc",
    dates: "Mar 15 – Apr 26", hood: "Griffintown", color: "#C8A882", reviewed: true, closing: true,
    quote: '"This is painting that understands its own slowness. Leblanc isn\'t working against the speed of the contemporary image — she\'s simply uninterested in it. That refusal feels quietly radical."',
    by: "Sophie Tran · April 8, 2026",
    desc: "Leblanc's paintings arrive quietly. Layered in beeswax and pigment, each surface holds time the way skin does — recording pressure, warmth, and the slow work of forgetting.",
    address: "2020 rue William", lat: 45.4925, lng: -73.5618
  },
  {
    id: "bradley", gallery: "Bradley Ertaskiran", title: "Still Frequency", artist: "James Nizam",
    dates: "Mar 28 – May 3", hood: "Saint-Henri", color: "#8BAEC4", reviewed: true, closing: false,
    quote: '"Nizam makes you aware of how much light is happening in any given room, unnoticed. These are arguments for a different quality of attention."',
    by: "Marc Durand · April 2, 2026",
    desc: "Nizam's photographs treat light as a sculptural material, capturing moments where beams, reflections and shadows form geometries too fleeting for the unaided eye.",
    address: "3550 rue Saint-Antoine O", lat: 45.4777, lng: -73.5760
  },
  {
    id: "charbonneau", gallery: "Hugues Charbonneau", title: "Lisières", artist: "Dominique Blain",
    dates: "Mar 6 – Apr 19", hood: "Downtown", color: "#8DAA88", reviewed: false, closing: true,
    desc: "Blain's practice occupies the space between document and testimony. Works on paper and installation navigating the edges of political memory.",
    address: "372 Ste-Catherine O, espace 508", lat: 45.5016, lng: -73.5726
  },
  {
    id: "mcbride", gallery: "McBride Contemporain", title: "Terrain vague", artist: "Nadia Myre",
    dates: "Apr 4 – May 10", hood: "Downtown", color: "#6A6058", reviewed: false, closing: false,
    desc: "Myre's work sits at the intersection of language, land and Anishinaabe knowledge systems. New textile and mixed-media works.",
    address: "372 Ste-Catherine O, Suite 414", lat: 45.5018, lng: -73.5724
  },
  {
    id: "ellephant", gallery: "ELLEPHANT", title: "Soft Infrastructure", artist: "Group Show",
    dates: "Mar 20 – Apr 30", hood: "Quartier des spectacles", color: "#B86040", reviewed: false, closing: true,
    desc: "Five artists consider the systems of care — emotional, domestic, civic — that make collective life possible.",
    address: "1201 rue Saint-Dominique", lat: 45.5098, lng: -73.5623
  },
  {
    id: "blais", gallery: "Galerie Simon Blais", title: "Feux pâles", artist: "Robert Wolfe",
    dates: "Apr 3 – May 17", hood: "Mile-End", color: "#7888A0", reviewed: false, closing: false,
    desc: "A career retrospective of one of Quebec's most distinctive abstract painters. Large-scale canvases between restraint and eruption.",
    address: "5420 boul. Saint-Laurent", lat: 45.5243, lng: -73.5972
  },
  {
    id: "artmur", gallery: "Art Mûr", title: "Double Bind", artist: "Gwenaël Bélanger",
    dates: "Mar 21 – May 2", hood: "Rosemont", color: "#C4907A", reviewed: false, closing: false,
    desc: "Bélanger's photographs stage impossible perceptual situations — images that look documentary but couldn't be.",
    address: "5826 rue Saint-Hubert", lat: 45.5338, lng: -73.5851
  },
  {
    id: "pangee", gallery: "Pangée", title: "Matière première", artist: "Sébastien Cliche",
    dates: "Apr 2 – May 8", hood: "Mile-End", color: "#A89070", reviewed: false, closing: false,
    desc: "Cliche's sculptural practice excavates industrial materials, finding tenderness in concrete, rust, and reclaimed steel.",
    address: "1305 avenue des Pins O", lat: 45.5089, lng: -73.5882
  },
];

const INK = "#0F0E0C";
const ACCENT = "#B8621A";
const CREAM = "#F5F1EB";
const BORDER = "#D8D2C8";
const MID = "#5C5750";
const WHITE = "#FFFFFF";
const SAVE_ON = "#E8321A";

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function App() {
  const [tab, setTab] = useState("map");
  const [detail, setDetail] = useState(null);
  const [saved, setSaved] = useState(new Set(["blouin", "bradley", "ellephant"]));
  const [filter, setFilter] = useState("all");
  const [mapMode, setMapMode] = useState("all");
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

  const filtered = SHOWS.filter(s => {
    if (filter === "all") return true;
    if (filter === "reviewed") return s.reviewed;
    if (filter === "closing") return s.closing;
    if (filter === "griffintown") return s.hood === "Griffintown";
    if (filter === "mile-end") return s.hood === "Mile-End";
    if (filter === "downtown") return s.hood === "Downtown";
    if (filter === "rosemont") return s.hood === "Rosemont";
    return true;
  });

  function addMarker(L, map, s) {
    const c = s.reviewed ? ACCENT : INK;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42">
      <defs>
        <radialGradient id="g${s.id}" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="${lighten(c, 30)}"/>
          <stop offset="100%" stop-color="${c}"/>
        </radialGradient>
        <filter id="sh${s.id}" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <circle cx="14" cy="14" r="12" fill="url(#g${s.id})" stroke="white" stroke-width="2" filter="url(#sh${s.id})"/>
      <circle cx="10" cy="10" r="3.5" fill="white" opacity="0.35"/>
      <circle cx="14" cy="14" r="4.5" fill="white" opacity="0.9"/>
      <path d="M 10 24 Q 14 42 18 24 Q 16 26 14 26 Q 12 26 10 24 Z" fill="${c}" filter="url(#sh${s.id})"/>
    </svg>`;
    const icon = L.divIcon({ className: "", html: svg, iconSize: [28, 42], iconAnchor: [14, 42], popupAnchor: [0, -44] });
    const marker = L.marker([s.lat, s.lng], { icon }).addTo(map).bindPopup(`
      <div style="width:200px;font-family:'DM Sans',sans-serif;">
        <div style="height:5px;background:${s.color};"></div>
        <div style="padding:12px 14px 14px;">
          <div style="font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:${ACCENT};font-weight:600;margin-bottom:3px;">${s.gallery}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;font-weight:600;color:${INK};line-height:1.2;margin-bottom:3px;">${s.title}</div>
          <div style="font-size:10px;color:${MID};margin-bottom:10px;">${s.artist}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">
            <div style="font-size:9px;color:${MID};">${s.dates}</div>
            ${s.closing ? `<div style="font-size:7px;background:${ACCENT};color:white;padding:1px 5px;border-radius:2px;font-weight:600;letter-spacing:.06em;">CLOSING</div>` : ""}
            ${s.reviewed ? `<div style="font-size:7px;background:${INK};color:white;padding:1px 5px;border-radius:2px;font-weight:600;letter-spacing:.06em;">REVIEWED</div>` : ""}
          </div>
          <button onclick="window.__lvSelect('${s.id}')" style="width:100%;background:${INK};color:white;border:none;padding:8px;border-radius:2px;font-size:8px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">View Show →</button>
        </div>
      </div>
    `, { className: "vp", maxWidth: 220 });
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
        .vp .leaflet-popup-content-wrapper { border-radius:3px!important; border:1.5px solid #0F0E0C!important; box-shadow:0 6px 24px rgba(0,0,0,0.18)!important; overflow:hidden; padding:0!important; }
        .vp .leaflet-popup-content { margin:0!important; }
        .vp .leaflet-popup-tip-container { display:none; }
        .leaflet-control-zoom { border:none!important; box-shadow:none!important; }
        .leaflet-control-zoom a { border:1.5px solid #0F0E0C!important; border-radius:2px!important; color:#0F0E0C!important; font-size:18px!important; font-weight:300!important; margin-bottom:3px; display:flex!important; align-items:center; justify-content:center; }
        .leaflet-control-zoom a:hover { background:#F5F1EB!important; }
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
      const map = L.map(mapRef.current, { center: [45.5100, -73.5600], zoom: 13, zoomControl: false, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 20, attribution: '© <a href="https://carto.com">CARTO</a>' }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletMapRef.current = map;
      window.__lvSelect = (id) => { const s = SHOWS.find(x => x.id === id); if (s) setDetail(s); };
      SHOWS.forEach(s => addMarker(L, map, s));
    };
    initMap();
    return () => { window.__lvSelect = null; };
  }, [tab]);

  const SaveButton = ({ id }) => {
    const on = saved.has(id);
    return (
      <button
        onClick={(e) => { e.stopPropagation(); toggleSave(id); }}
        style={{
          width: 36, height: 36,
          borderRadius: 2,
          border: `1.5px solid ${on ? SAVE_ON : BORDER}`,
          background: on ? SAVE_ON : WHITE,
          color: on ? WHITE : BORDER,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.15s",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        {on ? "★" : "☆"}
      </button>
    );
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: CREAM, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: 430, margin: "0 auto", position: "relative", boxShadow: "0 0 60px rgba(0,0,0,0.12)" }}>

      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1.5px solid ${INK}`, height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", flexShrink: 0, zIndex: 10 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, letterSpacing: "0.06em" }}>Le Vernissage<span style={{ color: ACCENT }}>.</span></div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: MID, fontWeight: 500 }}><span style={{ color: INK }}>En</span> · Fr</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, cursor: "pointer" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 20, height: 1.5, background: INK }} />)}</div>
        </div>
      </div>

      {/* 3 Tabs */}
      <div style={{ background: WHITE, borderBottom: `1.5px solid ${INK}`, display: "flex", flexShrink: 0, zIndex: 10 }}>
        {["map", "shows", "reviews"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px 6px", fontSize: 9, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: tab === t ? INK : MID, background: "none", border: "none", borderRight: `1px solid ${BORDER}`, borderBottom: tab === t ? `2.5px solid ${ACCENT}` : "2.5px solid transparent", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

        {/* MAP TAB */}
        <div style={{ display: tab === "map" ? "flex" : "none", flexDirection: "column", height: "100%", position: "relative" }}>
          {/* Toggle */}
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", background: WHITE, border: `1.5px solid ${INK}`, borderRadius: 3, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
            {[["all", "All Shows"], ["plan", "My Plan"]].map(([mode, label]) => (
              <button key={mode} onClick={() => setMapMode(mode)} style={{ padding: "8px 20px", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, background: mapMode === mode ? INK : WHITE, color: mapMode === mode ? WHITE : MID, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {mapMode === "plan" && saved.size === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 999, textAlign: "center", pointerEvents: "none", padding: "0 40px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: "italic", color: MID, marginBottom: 8 }}>No shows in your plan yet</div>
              <div style={{ fontSize: 11, color: BORDER, lineHeight: 1.6 }}>Star shows in the Shows tab to build your plan</div>
            </div>
          )}

          <div ref={mapRef} style={{ flex: 1 }} />
        </div>

        {/* SHOWS TAB */}
        {tab === "shows" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <div style={{ background: WHITE, borderBottom: `1.5px solid ${INK}`, padding: "20px 18px 0" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: MID, fontWeight: 500, marginBottom: 6 }}>April 2026 · Montréal</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 500, lineHeight: 1.05, marginBottom: 16 }}>Current<br />Exhibitions</div>
              <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 14, scrollbarWidth: "none" }}>
                {[["all", "All"], ["reviewed", "Reviewed"], ["closing", "Closing"], ["mile-end", "Mile-End"], ["downtown", "Downtown"], ["rosemont", "Rosemont"], ["griffintown", "Griffintown"]].map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, border: `1.5px solid ${filter === val ? INK : BORDER}`, background: filter === val ? INK : "none", color: filter === val ? WHITE : MID, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>{label}</button>
                ))}
              </div>
            </div>
            {filtered.map(s => (
              <div key={s.id} onClick={() => setDetail(s)} style={{ display: "flex", gap: 13, padding: "15px 18px", borderBottom: `1px solid ${BORDER}`, background: WHITE, cursor: "pointer", alignItems: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: 3, background: s.color, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT, fontWeight: 500 }}>{s.gallery}</span>
                    {s.reviewed && <span style={{ fontSize: 7, padding: "2px 5px", background: INK, color: WHITE, borderRadius: 2, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Reviewed</span>}
                    {s.closing && <span style={{ fontSize: 7, padding: "2px 5px", background: ACCENT, color: WHITE, borderRadius: 2, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Closing</span>}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", fontWeight: 500, lineHeight: 1.2, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 400, marginBottom: 3 }}>{s.artist}</div>
                  <div style={{ fontSize: 10, color: MID }}>{s.hood} · {s.dates}</div>
                </div>
                <SaveButton id={s.id} />
              </div>
            ))}
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab === "reviews" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <div onClick={() => setDetail(SHOWS[0])} style={{ background: INK, padding: "26px 18px 22px", cursor: "pointer" }}>
              <div style={{ fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT, fontWeight: 500, marginBottom: 10 }}>Featured Review</div>
              <div style={{ width: "100%", height: 190, borderRadius: 3, background: SHOWS[0].color, marginBottom: 14 }} />
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 500, lineHeight: 1.2, color: WHITE, marginBottom: 8 }}>On looking slowly: Marie-Claire Leblanc at Blouin Division</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 12, fontWeight: 300 }}>A show that demands patience, and rewards it completely.</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 7 }}>
                <span>Sophie Tran</span><span style={{ width: 3, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: "50%", display: "inline-block" }} /><span>April 8, 2026</span><span style={{ width: 3, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: "50%", display: "inline-block" }} /><span>5 min read</span>
              </div>
            </div>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: MID, fontWeight: 500, padding: "16px 18px 10px", background: CREAM, borderBottom: `1px solid ${BORDER}` }}>More Reviews</div>
            {[
              { s: SHOWS[1], title: "James Nizam's light as material", author: "Marc Durand · Apr 2 · 4 min" },
              { s: SHOWS[2], title: "Lisières and the edges of memory", author: "Isabelle Fleury · Mar 28 · 6 min" },
              { s: SHOWS[4], title: "Soft Infrastructure and the question of care", author: "Yasmine Hamdan · Mar 21 · 5 min" },
            ].map((r, i) => (
              <div key={i} onClick={() => setDetail(r.s)} style={{ display: "flex", gap: 13, padding: "15px 18px", borderBottom: `1px solid ${BORDER}`, background: WHITE, cursor: "pointer" }}>
                <div style={{ width: 76, height: 76, borderRadius: 3, background: r.s.color, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT, fontWeight: 500, marginBottom: 4 }}>{r.s.gallery}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 500, lineHeight: 1.3, marginBottom: 5 }}>{r.title}</div>
                  <div style={{ fontSize: 9, color: MID }}>{r.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL OVERLAY */}
      {detail && (
        <div style={{ position: "absolute", inset: 0, background: WHITE, zIndex: 50, overflowY: "auto", animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ position: "sticky", top: 0, background: WHITE, borderBottom: `1.5px solid ${INK}`, height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", zIndex: 10 }}>
            <button onClick={() => setDetail(null)} style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: MID, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ fontSize: 14, color: INK }}>←</span> Back
            </button>
            <SaveButton id={detail.id} />
          </div>
          <div style={{ width: "100%", height: 260, background: detail.color, borderBottom: `1.5px solid ${INK}` }} />
          <div style={{ padding: "22px 18px" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, fontWeight: 500, marginBottom: 7 }}>{detail.gallery}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontStyle: "italic", fontWeight: 500, lineHeight: 1.15, marginBottom: 5 }}>{detail.title}</div>
            <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 20 }}>{detail.artist}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: `1.5px solid ${INK}`, borderRadius: 3, marginBottom: 22, overflow: "hidden" }}>
              {[["Dates", detail.dates], ["Hours", "Tue–Sat 11–18h"], ["Area", detail.hood]].map(([label, val], i) => (
                <div key={label} style={{ padding: "11px 8px", textAlign: "center", borderRight: i < 2 ? `1px solid ${INK}` : "none" }}>
                  <div style={{ fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: MID, fontWeight: 500, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 400, lineHeight: 1.8, marginBottom: 24 }}>{detail.desc}</div>
            {detail.reviewed && (
              <div style={{ background: "#F0E6DC", borderLeft: `3px solid ${ACCENT}`, padding: "18px 16px", marginBottom: 22, borderRadius: "0 3px 3px 0" }}>
                <div style={{ fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, fontWeight: 500, marginBottom: 10 }}>Vernissage Review</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", lineHeight: 1.8, marginBottom: 10 }}>{detail.quote}</div>
                <div style={{ fontSize: 9, color: MID }}>{detail.by}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, paddingBottom: 40 }}>
              <button style={{ flex: 1, padding: 13, background: INK, color: WHITE, border: "none", borderRadius: 3, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Get Directions</button>
              <button style={{ flex: 1, padding: 13, background: "none", color: INK, border: `1.5px solid ${INK}`, borderRadius: 3, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Share</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        *{-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{display:none;}
      `}</style>
    </div>
  );
}
