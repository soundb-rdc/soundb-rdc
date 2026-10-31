import { useMemo, useState } from "react";
import TrackCard from "../components/TrackCard";
import { demoTracks } from "../data/demoTracks";
export default function Search() {
  const [query,setQuery]=useState("");
  const results=useMemo(()=>demoTracks.filter(t=>(t.title+" "+t.artist+" "+t.genre).toLowerCase().includes(query.toLowerCase())),[query]);
  return <section><p className="eyebrow">CATALOGUE</p><h1>Découvrir la musique</h1>
    <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un titre, un artiste ou un genre…"/>
    <div className="track-list">{results.map(t=><TrackCard key={t.id} track={t}/>)}</div>
    {!results.length && <p className="muted">Aucun résultat pour cette recherche.</p>}
  </section>;
}
