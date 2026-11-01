import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [busyItem, setBusyItem] = useState(null);

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
        supabase
          .from("profiles")
          .select("*")
          .eq("role", "artist")
          .order("created_at", { ascending: false }),

        supabase.from("tracks").select("*")
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

  async function changeArtistStatus(artistId, validation_status) {
    if (!supabase || busyItem !== null) return;

    setBusyItem(artistId);
    setError("");
    setNotice("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ validation_status })
        .eq("id", artistId);

      if (updateError) throw updateError;

      setArtists((current) =>
        current.map((artist) =>
          artist.id === artistId
            ? { ...artist, validation_status }
            : artist
        )
      );

      setNotice(
        validation_status === "approved"
          ? "Artiste validé avec succès."
          : "Demande de l'artiste refusée."
      );
    } catch (err) {
      setError(err.message || "Impossible de modifier le statut.");
    } finally {
      setBusyItem(null);
    }
  }

  async function changeTrackStatus(trackId, status) {
    if (!supabase || busyItem !== null) return;

    setBusyItem(trackId);
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
          track.id === trackId ? { ...track, status } : track
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
      setBusyItem(null);
    }
  }

  const waitingArtists = artists.filter(
    (artist) => artist.validation_status === "pending"
  );
  const approvedArtists = artists.filter(
    (artist) => artist.validation_status === "approved"
  );
  const rejectedArtists = artists.filter(
    (artist) => artist.validation_status === "rejected"
  );

  const pendingTracks = tracks.filter((track) => track.status === "pending");
  const approvedTracks = tracks.filter((track) => track.status === "approved");
  const rejectedTracks = tracks.filter((track) => track.status === "rejected");

  function artistLabel(artistId) {
    const artist = artists.find((item) => item.id === artistId);

    return artist?.artist_name ||
      artist?.full_name ||
      artist?.username ||
      "Artiste non identifié";
  }

  function renderArtist(artist) {
    const name =
      artist.artist_name || artist.full_name || artist.username || "Artiste";

    return (
      <article className="admin-artist-card" key={artist.id}>
        <div className="admin-avatar">
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="admin-artist-info">
          <strong>{name}</strong>
          <p>{artist.username ? `@${artist.username}` : artist.full_name}</p>
          <span className={`admin-status ${artist.validation_status}`}>
            {artist.validation_status === "approved"
              ? "Profil validé"
              : artist.validation_status === "rejected"
              ? "Profil refusé"
              : "En attente"}
          </span>
        </div>

        <div className="admin-track-actions">
          {artist.validation_status !== "approved" && (
            <button
              className="admin-btn approve"
              disabled={busyItem !== null}
              onClick={() =>
                changeArtistStatus(artist.id, "approved")
              }
            >
              Valider
            </button>
          )}

          {artist.validation_status !== "rejected" && (
            <button
              className="admin-btn reject"
              disabled={busyItem !== null}
              onClick={() =>
                changeArtistStatus(artist.id, "rejected")
              }
            >
              Refuser
            </button>
          )}
        </div>
      </article>
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
              : "En attente"}
          </span>
        </div>

        <div className="admin-track-actions">
          {track.status !== "approved" && (
            <button
              className="admin-btn approve"
              disabled={busyItem !== null}
              onClick={() => changeTrackStatus(track.id, "approved")}
            >
              Approuver
            </button>
          )}

          {track.status !== "rejected" && (
            <button
              className="admin-btn reject"
              disabled={busyItem !== null}
              onClick={() => changeTrackStatus(track.id, "rejected")}
            >
              Refuser
            </button>
          )}

          {track.status !== "pending" && (
            <button
              className="admin-btn pending"
              disabled={busyItem !== null}
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
        <div className="admin-stat waiting">
          <span>Artistes en attente</span>
          <strong>{waitingArtists.length}</strong>
        </div>
        <div className="admin-stat accepted">
          <span>Artistes validés</span>
          <strong>{approvedArtists.length}</strong>
        </div>
        <div className="admin-stat refused">
          <span>Artistes refusés</span>
          <strong>{rejectedArtists.length}</strong>
        </div>
        <div className="admin-stat">
          <span>Titres reçus</span>
          <strong>{tracks.length}</strong>
        </div>
        <div className="admin-stat waiting">
          <span>Musiques en attente</span>
          <strong>{pendingTracks.length}</strong>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Demandes de validation des artistes</h2>
          <span>{waitingArtists.length}</span>
        </div>
        {waitingArtists.length === 0
          ? <p className="admin-empty">Aucune demande en attente.</p>
          : waitingArtists.map(renderArtist)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Artistes validés</h2>
          <span>{approvedArtists.length}</span>
        </div>
        {approvedArtists.length === 0
          ? <p className="admin-empty">Aucun artiste validé.</p>
          : approvedArtists.map(renderArtist)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Artistes refusés</h2>
          <span>{rejectedArtists.length}</span>
        </div>
        {rejectedArtists.length === 0
          ? <p className="admin-empty">Aucun artiste refusé.</p>
          : rejectedArtists.map(renderArtist)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques en attente</h2>
          <span>{pendingTracks.length}</span>
        </div>
        {pendingTracks.length === 0
          ? <p className="admin-empty">Aucune musique en attente.</p>
          : pendingTracks.map(renderTrack)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques approuvées</h2>
          <span>{approvedTracks.length}</span>
        </div>
        {approvedTracks.length === 0
          ? <p className="admin-empty">Aucune musique approuvée.</p>
          : approvedTracks.map(renderTrack)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques refusées</h2>
          <span>{rejectedTracks.length}</span>
        </div>
        {rejectedTracks.length === 0
          ? <p className="admin-empty">Aucune musique refusée.</p>
          : rejectedTracks.map(renderTrack)}
      </section>

      <footer className="admin-footer">
        SOUND-B © 2026 — DMP Creator Production
      </footer>
    </main>
  );
}
