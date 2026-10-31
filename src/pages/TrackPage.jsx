import { useParams, Link } from "react-router-dom";
import { demoTracks } from "../data/demoTracks";
export default function TrackPage() {
  const {id}=useParams(); const track=demoTracks.find(t=>t.id===id);
  if(!track) return <p>Titre introuvable.</p>;
  return <section className="detail-card"><div className="cover big">{track.emoji}</div><p className="eyebrow">LECTURE</p><h1>{track.title}</h1><p className="muted">{track.artist} · {track.genre}</p>
    <audio controls className="audio" />
    <p className="notice">Le lecteur sera relié au fichier audio hébergé dans Supabase Storage après configuration de la base de données.</p>
    <Link className="btn secondary" to={`/artiste/${track.artist_id}`}>Voir le profil artiste</Link>
  </section>;
}
