import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TrackCard from "../components/TrackCard";
import { loadApprovedTracks } from "../lib/loadApprovedTracks";

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await loadApprovedTracks();
      setTracks(data);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">LA MUSIQUE À PORTÉE DE CLIC</p>

        <h1>
          Découvre les sons<br />
          <span>qui te ressemblent.</span>
        </h1>

        <p>
          Écoute et découvre les artistes.
          Retrouve la musique que tu aimes sur SOUND-B.
        </p>

        <div className="actions">
          <Link className="btn primary" to="/recherche">
            Explorer la musique
          </Link>

          <Link className="btn secondary" to="/inscription">
            Devenir artiste
          </Link>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>Titres à découvrir</h2>
          <Link to="/recherche">Tout voir →</Link>
        </div>

        {loading ? (
          <p className="muted">Chargement des musiques...</p>
        ) : tracks.length > 0 ? (
          <div className="track-list">
            {tracks.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucune musique disponible pour le moment.
          </p>
        )}
      </section>

      <section className="artist-callout">
        <h2>Tu fais de la musique ?</h2>

        <p>
          Crée ton espace artiste et soumets tes titres
          à l’équipe SOUND-B pour validation.
        </p>

        <Link className="btn primary" to="/inscription">
          Créer mon compte artiste
        </Link>
      </section>
    </>
  );
}
