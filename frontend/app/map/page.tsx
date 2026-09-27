"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../Header";
import { useSearchParams } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5254";

type Step = { type: string; modifier: string | null; name: string; meters: number; seconds: number };
type Path = {
  distanceKm: number; minutes: number; geometry: [number, number][]; steps: Step[];
  university: { id: number; name: string; lat: number; lng: number };
};

const MOD: Record<string, string> = {
  left: "sola", right: "sağa", straight: "düz",
  "slight left": "azca sola", "slight right": "azca sağa",
  "sharp left": "kəskin sola", "sharp right": "kəskin sağa", uturn: "geri",
};

function describe(s: Step, i: number, last: boolean): string {
  const on = s.name ? ` — ${s.name}` : "";
  const dir = s.modifier ? MOD[s.modifier] ?? s.modifier : "";
  if (last || s.type === "arrive") return "Təyinat yerinə çatdın";
  if (s.type === "depart") return `Yola çıx${dir ? `, ${dir} get` : ""}${on}`;
  if (s.type === "roundabout" || s.type === "rotary") return `Dairəvi hərəkətdə davam et${on}`;
  if (s.type === "continue" || (s.type === "new name" && !dir)) return `Davam et${on}`;
  if (s.type === "merge") return `Yola qoşul${on}`;
  if (s.type === "fork") return `Ayrıcda ${dir || "düz"} get${on}`;
  return `${dir ? dir[0].toUpperCase() + dir.slice(1) : "Düz"} dön${on}`;
}

function fmtDist(m: number) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`; }

function MapView() {
  const q = useSearchParams();
  const uni = q.get("uni") ?? "1", lat = q.get("lat") ?? "", lng = q.get("lng") ?? "", name = q.get("name") ?? "Ev";
  const [mode, setMode] = useState<"foot" | "car">("foot");
  const [path, setPath] = useState<Path | null>(null);
  const [error, setError] = useState("");
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);

  useEffect(() => {
    setPath(null); setError("");
    fetch(`${API}/api/route?universityId=${uni}&lat=${lat}&lng=${lng}&mode=${mode}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPath)
      .catch(() => setError("Marşrutu yükləmək mümkün olmadı."));
  }, [uni, lat, lng, mode]);

  useEffect(() => {
    if (!path || !el.current) return;
    let cancelled = false;
    import("leaflet").then(L => {
      if (cancelled || !el.current) return;
      if (!map.current) {
        map.current = L.map(el.current);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
      }
      const pin = (fill: string) => L.divIcon({ html: `<div style="width:16px;height:16px;border-radius:50%;background:${fill};border:3px solid #fff;box-shadow:0 0 0 1px #111"></div>`, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
      layer.current!.clearLayers();
      const line = L.polyline(path.geometry, { color: "#c37c2c", weight: 6, opacity: 0.95 }).addTo(layer.current!);
      L.marker(path.geometry[0], { icon: pin("#c37c2c") }).bindPopup(name).addTo(layer.current!);
      L.marker([path.university.lat, path.university.lng], { icon: pin("#111") }).bindPopup(path.university.name).addTo(layer.current!);
      map.current.fitBounds(line.getBounds(), { padding: [40, 40] });
    });
    return () => { cancelled = true; };
  }, [path, mode, name]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  return (
    <div className="wrap">
      <p><Link href="/" className="back">← Nəticələr</Link></p>
      <h2 className="hero" style={{ fontSize: 28, margin: "12px 0 28px" }}>{name} → {path?.university.name ?? "Universitet"}</h2>
      <div className="mapgrid">
        <div ref={el} className="map" />
        <aside className="panel">
          <div className="row" >
            <button className={`tab${mode === "foot" ? " on" : ""}`} onClick={() => setMode("foot")}>Piyada</button>
            <button className={`tab${mode === "car" ? " on" : ""}`} onClick={() => setMode("car")}>Maşınla</button>
          </div>
          {error && <div className="error">{error}</div>}
          {!path && !error && <div className="empty">Marşrut yüklənir…</div>}
          {path && (
            <>
              <div className="budget route"><span>{path.distanceKm} km</span><b>{path.minutes} dəq</b></div>
              <ol className="steps">
                {path.steps.map((s, i) => (
                  <li key={i}><span>{describe(s, i, i === path.steps.length - 1)}</span>{s.meters > 0 && <small>{fmtDist(s.meters)}</small>}</li>
                ))}
              </ol>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="wrap"><div className="empty">Yüklənir…</div></div>}>
        <MapView />
      </Suspense>
    </>
  );
}
