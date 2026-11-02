import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TrackCard from "../components/TrackCard";
import { loadApprovedTracks } from "../lib/loadApprovedTracks";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [top5, setTop5] = useState([]);
  const [top10, setTop10] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const approvedTracks = await loadApprovedTracks();
        setTracks(approvedTracks);

        const { data, error } = await supabase.rpc(
          "get_top_downloads"
        );

        if (error) throw error;

        const { data: artists } = await supabase
          .from("profiles")
          .select("id, artist_name");

        const rankedTracks = await Promise.all(
          (data || []).map(async track => {
            const artist = artists?.find(
              item => item.id === track.artist_id
            );

            let coverUrl = null;

            if (track.cover_path) {
              const { data: coverData } = await supabase.storage
                .from("music-covers")
                .createSignedUrl(track.cover_path, 3600);

              coverUrl = coverData?.signedUrl || null;
            }

            return {
              ...track,
              artist: artist?.artist_name || "Artiste SOUND-B",
              cover_url: coverUrl,
              emoji: "♫"
            };
          })
        );

        const eligibleTop5 = rankedTracks
          .filter(track => track.download_count >= 250)
          .slice(0, 5);

        const top5Ids = eligibleTop5.map(track => track.id);

        const eligibleTop10 = rankedTracks
          .filter(
            track =>
              track.download_count >= 100 &&
              !top5Ids.includes(track.id)
          )
          .slice(0, 10);

        setTop5(eligibleTop5);
        setTop10(eligibleTop10);

      } catch (error) {
        console.error("Erreur de chargement des TOP SOUND-B :", error);
      } finally {
        setLoading(false);
      }
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

      {/* TOP 5 */}
      <section>
        <div className="section-heading">
          <h2>🏆 TOP 5 SOUND-B</h2>
        </div>

        <p className="muted">
          Les 5 morceaux les plus téléchargés ayant atteint
          au moins 250 téléchargements.
        </p>

        {loading ? (
          <p className="muted">Chargement du TOP 5...</p>
        ) : top5.length > 0 ? (
          <>
            {top5[0].download_count >= 500 && (
              <div className="top-featured">
                <span>⭐ NUMÉRO 1 SOUND-B</span>
                <h3>{top5[0].title}</h3>
                <p>{top5[0].artist}</p>
                <strong>
                  {top5[0].download_count} téléchargements
                </strong>
              </div>
            )}

            <div className="track-list">
              {top5.map((track, index) => (
                <div key={track.id}>
                  <p className="top-position">
                    TOP {index + 1} · {track.download_count} téléchargements
                  </p>
                  <TrackCard track={track} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">
            Aucun morceau n'a encore atteint 250 téléchargements.
          </p>
        )}
      </section>

      {/* TOP 10 */}
      <section>
        <div className="section-heading">
          <h2>🔥 TOP 10 SOUND-B</h2>
        </div>

        <p className="muted">
          Les 10 morceaux suivants ayant atteint au moins
          100 téléchargements.
        </p>

        {loading ? (
          <p className="muted">Chargement du TOP 10...</p>
        ) : top10.length > 0 ? (
          <div className="track-list">
            {top10.map((track, index) => (
              <div key={track.id}>
                <p className="top-position">
                  TOP {index + 6} · {track.download_count} téléchargements
                </p>
                <TrackCard track={track} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucun autre morceau n'a encore atteint 100 téléchargements.
          </p>
        )}
      </section>

      {/* TITRES À DÉCOUVRIR */}
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
