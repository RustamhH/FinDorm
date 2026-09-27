"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import HouseCard from "./HouseCard";
import type { House } from "./saved";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5254";
const PAGE = 15;

type University = { id: number; name: string };
type SearchResponse = { total: number; university: University; items: House[] };

export default function Home() {
  const [unis, setUnis] = useState<University[]>([]);
  const [uniId, setUniId] = useState(1);
  const [stip, setStip] = useState("200");
  const [extra, setExtra] = useState("50");
  const [rooms, setRooms] = useState(0);
  const [mode, setMode] = useState("Any");
  const [sort, setSort] = useState("PriceAsc");
  const [items, setItems] = useState<House[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const budget = (+stip || 0) + (+extra || 0);

  useEffect(() => {
    fetch(`${API}/api/universities`).then(r => r.json()).then(setUnis)
      .catch(() => setError("Serverə qoşulmaq mümkün olmadı."));
  }, []);

  async function search(skip: number, sortBy = sort) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/search`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId: uniId, budget, rooms, mode, skip, take: PAGE, sort: sortBy }),
      });
      if (!res.ok) throw new Error();
      const data: SearchResponse = await res.json();
      setItems(prev => (skip ? [...prev, ...data.items] : data.items));
      setTotal(data.total);
    } catch { setError("Axtarış zamanı xəta baş verdi."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Header />
      <div className="wrap">
        <h2 className="hero">Universitetinə ən yaxın və büdcənə uyğun evi tap.</h2>

        <section className="search">
          <div className="field wide">
            <label>Universitet</label>
            <select value={uniId} onChange={e => setUniId(+e.target.value)}>
              {unis.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Stipendiya (AZN)</label>
            <input type="number" min={0} value={stip} onChange={e => setStip(e.target.value)} />
          </div>
          <div className="field">
            <label>Əlavə gəlir (AZN)</label>
            <input type="number" min={0} value={extra} onChange={e => setExtra(e.target.value)} />
          </div>
          <div className="field">
            <label>Otaq sayı</label>
            <select value={rooms} onChange={e => setRooms(+e.target.value)}>
              <option value={0}>Fərq etməz</option><option value={1}>1</option><option value={2}>2</option>
              <option value={3}>3</option><option value={4}>4</option><option value={5}>5+</option>
            </select>
          </div>
          <div className="field">
            <label>Yaşayış forması</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="Any">Fərq etməz</option><option value="Solo">Təkbaşına</option><option value="Mate">Otaq yoldaşı ilə</option>
            </select>
          </div>
          <button className="go" disabled={loading} onClick={() => search(0)}>{loading && !items.length ? "Axtarılır…" : "Evləri tap"}</button>
          <div className="budget">Aylıq büdcə: <b>{budget} ₼</b></div>
        </section>

        {error && <div className="error">{error}</div>}
        {total === null && !error && <div className="empty">Meyarları seçib “Evləri tap” düyməsinə bas.</div>}
        {total !== null && (
          <>
            <div className="bar">
              <select className="sort" value={sort} onChange={e => { setSort(e.target.value); search(0, e.target.value); }}>
                <option value="PriceAsc">Qiymət: ucuzdan bahaya</option>
                <option value="PriceDesc">Qiymət: bahadan ucuza</option>
              </select>
            </div>
            {total === 0 && <div className="empty">Bu büdcə ilə uyğun ev tapılmadı. Büdcəni artır və ya otaq yoldaşı ilə yaşayışı seç.</div>}
            <div className="grid">
              {items.map((h, i) => (
                <HouseCard key={h.id} house={h} uniId={uniId} uniName={unis.find(u => u.id === uniId)?.name ?? ""} best={i === 0} />
              ))}
            </div>
            {items.length < total && <button className="more" disabled={loading} onClick={() => search(items.length)}>Daha çox göstər</button>}
          </>
        )}
      </div>
    </>
  );
}
