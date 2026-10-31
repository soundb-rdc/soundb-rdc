import { useParams } from "react-router-dom";
import { demoTracks } from "../data/demoTracks";
import TrackCard from "../components/TrackCard";
export default function ArtistPage() {
  const {id}=useParams(); const tracks=demoTracks.filter(t=>t.artist_id===id);
  const name=tracks[0]?.artist || "Profil artiste";
  return <section><div className="artist-header"><div className="avatar">♫</div><div><p className="eyebrow">ARTISTE SOUND-B</p><h1>{name}</h1><p className="muted">Profil public de l’artiste</p></div></div>
    <h2>Ses titres</h2><div className="track-list">{tracks.map(t=><TrackCard key={t.id} track={t}/>)}</div>
    {!tracks.length && <p className="muted">Aucun titre public pour le moment.</p>}
  </section>;
}
