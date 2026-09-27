"use client";

import { useCallback, useEffect, useState } from "react";

export type House = {
  id: number; location: string; price: number; rooms: number; square: number;
  floor: string; newBuilding: boolean; hasRoommate: boolean; distanceKm: number;
  walkMinutes: number; carMinutes: number; lat: number; lng: number;
};
export type SavedHouse = House & { uniId: number; uniName: string };
export type ListName = "favorites" | "watchlist";
type Store = Record<ListName, SavedHouse[]>;

const KEY = "findorm.saved.v1";
const EVENT = "findorm-saved-changed";
const EMPTY: Store = { favorites: [], watchlist: [] };

function read(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return { favorites: raw?.favorites ?? [], watchlist: raw?.watchlist ?? [] };
  } catch { return EMPTY; }
}

/** Favourites and watchlist, kept in localStorage and synced across components/tabs. */
export function useSaved() {
  const [store, setStore] = useState<Store>(EMPTY);

  useEffect(() => {
    const load = () => setStore(read());
    load();
    window.addEventListener(EVENT, load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener(EVENT, load); window.removeEventListener("storage", load); };
  }, []);

  const has = useCallback((list: ListName, id: number, uniId: number) =>
    store[list].some(h => h.id === id && h.uniId === uniId), [store]);

  const toggle = useCallback((list: ListName, house: SavedHouse) => {
    const cur = read();
    const exists = cur[list].some(h => h.id === house.id && h.uniId === house.uniId);
    const next = { ...cur, [list]: exists ? cur[list].filter(h => !(h.id === house.id && h.uniId === house.uniId)) : [house, ...cur[list]] };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setStore(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { store, has, toggle };
}
