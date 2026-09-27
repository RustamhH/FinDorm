"use client";

import Link from "next/link";
import { type House, useSaved } from "./saved";
import { brokerPhone, formatPhone } from "./contact";

export default function HouseCard({ house: h, uniId, uniName, best }: { house: House; uniId: number; uniName: string; best?: boolean }) {
  const { has, toggle } = useSaved();
  const item = { ...h, uniId, uniName };
  const phone = brokerPhone(h.id);
  const fav = has("favorites", h.id, uniId), watch = has("watchlist", h.id, uniId);

  return (
    <article className={`card${best ? " best" : ""}`}>
      <div className="badges">
        {best && <span className="badge gold">Ən yaxın seçim</span>}
        {h.newBuilding && <span className="badge">Yeni tikili</span>}
        {h.hasRoommate && <span className="badge">Otaq yoldaşı ilə</span>}
        <span className="actions">
          <button className={`act${fav ? " on" : ""}`} onClick={() => toggle("favorites", item)} aria-pressed={fav}>
            {fav ? "♥ Sevimli" : "♡ Sevimli"}
          </button>
          <button className={`act${watch ? " on" : ""}`} onClick={() => toggle("watchlist", item)} aria-pressed={watch}>
            {watch ? "✓ İzlənir" : "+ İzlə"}
          </button>
        </span>
      </div>
      <div className="top">
        <div className="loc">{h.location}</div>
        <div className="price">{h.price} ₼<small>/ ay</small></div>
      </div>
      <div className="facts">
        <div><small>Mənzil</small>{h.rooms} otaqlı</div>
        <div><small>Sahə</small>{h.square} m²</div>
        <div><small>Mərtəbə</small>{h.floor}</div>
      </div>
      <div className="way">
        <div><small>Məsafə</small>{h.distanceKm.toFixed(1)} km</div>
        <div><small>Piyada</small>{h.walkMinutes} dəq</div>
        <div><small>Maşınla</small>{h.carMinutes} dəq</div>
      </div>
      {h.walkMinutes > 45 && <div className="hint">Uzun məsafə — maşın daha uyğundur</div>}
      <div className="cta">
        <Link className="mapbtn" href={`/map?uni=${uniId}&lat=${h.lat}&lng=${h.lng}&name=${encodeURIComponent(h.location)}`}>Xəritədə marşrutu gör</Link>
        <a className="mapbtn call" href={`tel:${phone}`}>Maklerə zəng et · {formatPhone(phone)}</a>
      </div>
    </article>
  );
}
