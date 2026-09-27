import type { Map as LeafletMap, TileLayer } from "leaflet";

/** Adds the OSM-based tile layer matching the current theme (CARTO dark in dark mode). */
export function addTiles(L: typeof import("leaflet"), map: LeafletMap): TileLayer {
  const dark = document.documentElement.dataset.theme === "dark";
  const url = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  return L.tileLayer(url, {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);
}
