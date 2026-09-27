"use client";

import Link from "next/link";
import { useSaved } from "./saved";

export default function Header() {
  const { store } = useSaved();
  const count = store.favorites.length + store.watchlist.length;

  function toggleTheme() {
    const r = document.documentElement;
    r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark";
  }
  return (
    <header>
      <Link href="/" className="logo"><img src="/logo.png" alt="FinDorm" height={60} /></Link>
      <div className="nav">
        <Link href="/saved" className="navlink">Seçilmişlər{count > 0 && <b>{count}</b>}</Link>
        <button className="theme" onClick={toggleTheme} title="Tema" aria-label="Tema">◐</button>
      </div>
    </header>
  );
}
