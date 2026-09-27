"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { addTiles } from "./tiles";

export type MapItem = { id: number; location: string; price: number; lat: number; lng: number; rank: number };
type Props = {
  items: MapItem[];
  uni: { name: string; lat: number; lng: number } | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
};

/** Map with one marker per area (the cheapest/nearest listing there) plus the university. */
export default function HomeMap({ items, uni, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const fitted = useRef("");

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then(L => {
      if (cancelled || !el.current) return;
      if (!map.current) {
        map.current = L.map(el.current, { zoomControl: true }).setView([40.4, 49.85], 12);
        addTiles(L, map.current);
        layer.current = L.layerGroup().addTo(map.current);
      }
      layer.current!.clearLayers();
      const label = (cls: string, text: string) =>
        L.divIcon({ html: `<div class="mk ${cls}">${text}</div>`, className: "", iconSize: [0, 0] });

      const groups = new Map<string, MapItem[]>();
      for (const it of items) {
        const k = `${it.lat},${it.lng}`;
        groups.set(k, [...(groups.get(k) ?? []), it]);
      }
      const pts: [number, number][] = [];
      groups.forEach(g => {
        const best = g.reduce((a, b) => (b.rank < a.rank ? b : a));
        const sel = g.some(x => x.id === selectedId);
        const extra = g.length > 1 ? ` +${g.length - 1}` : "";
        L.marker([best.lat, best.lng], { icon: label(sel ? "sel" : "", `#${best.rank} · ${best.price} ₼${extra}`) })
          .on("click", () => onSelect(best.id)).addTo(layer.current!);
        pts.push([best.lat, best.lng]);
      });
      if (uni) {
        L.marker([uni.lat, uni.lng], { icon: label("uni", uni.name.split(/[ —-]/)[0]), zIndexOffset: 1000 }).addTo(layer.current!);
        pts.push([uni.lat, uni.lng]);
      }
      const key = pts.map(p => p.join()).join("|");
      if (pts.length && key !== fitted.current) {
        fitted.current = key;
        map.current.fitBounds(pts, { padding: [60, 60], maxZoom: 15 });
      }
    });
    return () => { cancelled = true; };
  }, [items, uni, selectedId, onSelect]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  return <div ref={el} style={{ height: "100%", width: "100%" }} />;
}
