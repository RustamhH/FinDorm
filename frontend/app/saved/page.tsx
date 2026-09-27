"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../Header";
import HouseCard from "../HouseCard";
import { type ListName, useSaved } from "../saved";

export default function SavedPage() {
  const { store } = useSaved();
  const [tab, setTab] = useState<ListName>("favorites");
  const list = store[tab];

  return (
    <>
      <Header />
      <div className="wrap">
        <p><Link href="/" className="back">← Axtarışa qayıt</Link></p>
        <h2 className="hero">Seçilmişlər</h2>
        <div className="row tabs">
          <button className={`tab${tab === "favorites" ? " on" : ""}`} onClick={() => setTab("favorites")}>♥ Sevimlilər ({store.favorites.length})</button>
          <button className={`tab${tab === "watchlist" ? " on" : ""}`} onClick={() => setTab("watchlist")}>İzləmə siyahısı ({store.watchlist.length})</button>
        </div>
        {list.length === 0 && (
          <div className="empty">{tab === "favorites" ? "Hələ sevimli ev əlavə etməmisən." : "İzləmə siyahısı boşdur."} Axtarış nəticələrindəki kartlardan əlavə edə bilərsən.</div>
        )}
        <div className="grid" style={{ marginTop: 20 }}>
          {list.map(h => (
            <div key={`${h.uniId}-${h.id}`}>
              <div className="uni-note">{h.uniName} üçün</div>
              <HouseCard house={h} uniId={h.uniId} uniName={h.uniName} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
