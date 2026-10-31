import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [busyTrack, setBusyTrack] = useState(null);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setError("Connexion Supabase non configurée.");
      setLoading(false);
      return;
    }

    setError("");

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!auth.user) throw new Error("Connecte-toi d'abord.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role !== "admin") {
        throw new Error("Accès réservé à l'administrateur.");
      }

      const [artistsResult, tracksResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "artist"),
        supabase.from("tracks").select("*"),
      ]);

      if (artistsResult.error) throw artistsResult.error;
      if (tracksResult.error) throw tracksResult.error;

      setArtists(artistsResult.data || []);
      setTracks(tracksResult.data || []);

    } catch (err) {
      setError(err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function changeTrackStatus(trackId, status) {
    if (!supabase || busyTrack !== null) return;

    setBusyTrack(trackId);
    setError("");
    setNotice("");

    try {
      const { error: updateError } = await supabase
        .from("tracks")
        .update({ status })
        .eq("id", trackId);

      if (updateError) throw updateError;

      setTracks((current) =>
        current.map((track) =>
          track.id === trackId
            ? { ...track, status }
            : track
        )
      );

      setNotice(
        status === "approved"
          ? "Musique approuvée avec succès."
          : status === "rejected"
          ? "Musique refusée."
          : "Musique remise en attente."
      );

    } catch (err) {
      setError(err.message || "Impossible de modifier le statut.");
    } finally {
      setBusyTrack(null);
    }
  }

  const pending = tracks.filter((t) => t.status === "pending");
  const approved = tracks.filter((t) => t.status === "approved");
  const rejected = tracks.filter((t) => t.status === "rejected");

  function artistLabel(artistId) {
    const artist = artists.find((a) => a.id === artistId);

    if (!artist) return "Artiste non identifié";

    return (
      artist.artist_name ||
      artist.full_name ||
      artist.username ||
      artist.email ||
      artist.id
    );
  }

  function renderTrack(track) {
    return (
      <article className="admin-track-card" key={track.id}>
        <div className="admin-track-info">
          <h3>{track.title || "Sans titre"}</h3>
          <p>Artiste : {artistLabel(track.artist_id)}</p>
          <span className={`admin-status ${track.status || "unknown"}`}>
            {track.status === "approved"
              ? "Approuvée"
              : track.status === "rejected"
              ? "Refusée"
              : track.status === "pending"
              ? "En attente"
              : "Non défini"}
          </span>
        </div>

        <div className="admin-track-actions">
          {track.status !== "approved" && (
            <button
              className="admin-btn approve"
              disabled={busyTrack !== null}
              onClick={() => changeTrackStatus(track.id, "approved")}
            >
              Approuver
            </button>
          )}

          {track.status !== "rejected" && (
            <button
              className="admin-btn reject"
              disabled={busyTrack !== null}
              onClick={() => changeTrackStatus(track.id, "rejected")}
            >
              Refuser
            </button>
          )}

          {track.status !== "pending" && (
            <button
              className="admin-btn pending"
              disabled={busyTrack !== null}
              onClick={() => changeTrackStatus(track.id, "pending")}
            >
              Remettre en attente
            </button>
          )}
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        Chargement de l'administration SOUND-B...
      </div>
    );
  }

  if (error && artists.length === 0 && tracks.length === 0) {
    return <div className="admin-alert error">{error}</div>;
  }

  return (
    <main className="admin-container">

      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">DMP CREATOR PRODUCTION</p>
          <h1>Administration SOUND-B</h1>
          <p>Centre de gestion et de validation musicale.</p>
        </div>

        <button className="admin-refresh" onClick={loadData}>
          ↻ Actualiser
        </button>
      </header>

      {error && <div className="admin-alert error">{error}</div>}
      {notice && <div className="admin-alert success">{notice}</div>}

      <section className="admin-stats">

        <div className="admin-stat">
          <span>Artistes inscrits</span>
          <strong>{artists.length}</strong>
        </div>

        <div className="admin-stat">
          <span>Titres reçus</span>
          <strong>{tracks.length}</strong>
        </div>

        <div className="admin-stat waiting">
          <span>En attente</span>
          <strong>{pending.length}</strong>
        </div>

        <div className="admin-stat accepted">
          <span>Approuvées</span>
          <strong>{approved.length}</strong>
        </div>

        <div className="admin-stat refused">
          <span>Refusées</span>
          <strong>{rejected.length}</strong>
        </div>

      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musique en attente</h2>
          <span>{pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <p className="admin-empty">Aucune musique en attente.</p>
        ) : (
          pending.map(renderTrack)
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques approuvées</h2>
          <span>{approved.length}</span>
        </div>

        {approved.length === 0 ? (
          <p className="admin-empty">Aucune musique approuvée.</p>
        ) : (
          approved.map(renderTrack)
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques refusées</h2>
          <span>{rejected.length}</span>
        </div>

        {rejected.length === 0 ? (
          <p className="admin-empty">Aucune musique refusée.</p>
        ) : (
          rejected.map(renderTrack)
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Artistes inscrits</h2>
          <span>{artists.length}</span>
        </div>

        {artists.length === 0 ? (
          <p className="admin-empty">Aucun artiste inscrit.</p>
        ) : (
          artists.map((artist) => (
            <article className="admin-artist-card" key={artist.id}>
              <div className="admin-avatar">
                {(artist.artist_name || artist.full_name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {artist.artist_name ||
                    artist.full_name ||
                    artist.username ||
                    "Artiste"}
                </strong>
                <p>{artist.email || "Adresse non disponible"}</p>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="admin-footer">
        SOUND-B © 2026 — DMP Creator Production
      </footer>

    </main>
  );
}
