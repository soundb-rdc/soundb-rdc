import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [historyProfiles, setHistoryProfiles] = useState({});
  const [busyItem, setBusyItem] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [trackSearch, setTrackSearch] = useState("");
  const [trackStatusFilter, setTrackStatusFilter] = useState("all");
  const [trackArtistFilter, setTrackArtistFilter] = useState("all");

  const loadData = useCallback(async () => {
    if (!supabase) {
      setError("Connexion Supabase non configurée.");
      setLoading(false);
      return;
    }

    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
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

      const [artistsResult, tracksResult, historyResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "artist")
          .order("created_at", { ascending: false }),
        supabase.from("tracks").select("*"),
        supabase.from("artist_suspension_history").select("*")
          .order("created_at", { ascending: false }).limit(100)
      ]);

      if (artistsResult.error) throw artistsResult.error;
      if (tracksResult.error) throw tracksResult.error;
      if (historyResult.error) throw historyResult.error;

      const history = historyResult.data || [];
      const profileIds = [...new Set(
        history.flatMap(item => [item.artist_id, item.admin_id]).filter(Boolean)
      )];

      let profileMap = {};
      if (profileIds.length > 0) {
        const { data: people, error: peopleError } = await supabase
          .from("profiles")
          .select("id, full_name, username, artist_name")
          .in("id", profileIds);

        if (peopleError) throw peopleError;
        profileMap = Object.fromEntries((people || []).map(person => [person.id, person]));
      }

      setArtists(artistsResult.data || []);
      setTracks(tracksResult.data || []);
      setSuspensionHistory(history);
      setHistoryProfiles(profileMap);
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
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ validation_status })
        .eq("id", artistId)
        .select("id, validation_status")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) {
        throw new Error("Aucune modification effectuée. Vérifie les autorisations UPDATE dans Supabase.");
      }

      await loadData();
      setNotice(validation_status === "approved"
        ? "Artiste validé avec succès."
        : "Demande de l'artiste refusée.");
    } catch (err) {
      setError(err.message || "Impossible de modifier le statut.");
    } finally {
      setBusyItem(null);
    }
  }

  async function changeArtistSuspension(artistId, is_suspended) {
    if (!supabase || busyItem !== null) return;

    const artist = artists.find(item => item.id === artistId);
    const artistName = artist?.artist_name || artist?.full_name || artist?.username || "cet artiste";
    let reason = artist?.suspension_reason || "";

    if (is_suspended) {
      reason = window.prompt(
        `Indique le motif de suspension de ${artistName} :`,
        ""
      );

      if (reason === null) return;
      reason = reason.trim();

      if (!reason) {
        setError("Le motif de suspension est obligatoire.");
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Voulez-vous vraiment réactiver le compte de ${artistName} ?`
      );
      if (!confirmed) return;
    }

    setBusyItem(artistId);
    setError("");
    setNotice("");

    try {
      const updateValues = is_suspended
        ? { is_suspended: true, suspension_reason: reason }
        : { is_suspended: false };

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updateValues)
        .eq("id", artistId)
        .select("id, is_suspended, suspension_reason")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) {
        throw new Error("Modification impossible. Vérifie les autorisations UPDATE dans Supabase.");
      }

      setArtists(current => current.map(item =>
        item.id === artistId
          ? { ...item, is_suspended: data.is_suspended, suspension_reason: data.suspension_reason }
          : item
      ));

      await loadData();
      setNotice(is_suspended
        ? "Compte artiste suspendu. Le motif a été ajouté à l'historique."
        : "Compte artiste réactivé. La décision a été ajoutée à l'historique.");
    } catch (err) {
      setError(err.message || "Impossible de modifier la suspension.");
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
      const { data, error: updateError } = await supabase
        .from("tracks")
        .update({ status })
        .eq("id", trackId)
        .select("id, status")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) {
        throw new Error("Aucune modification effectuée. Vérifie les autorisations UPDATE dans Supabase.");
      }

      setTracks(current => current.map(track =>
        track.id === trackId ? { ...track, status } : track
      ));

      setNotice(status === "approved"
        ? "Musique approuvée avec succès."
        : status === "rejected"
          ? "Musique refusée."
          : "Musique remise en attente.");
    } catch (err) {
      setError(err.message || "Impossible de modifier le statut.");
    } finally {
      setBusyItem(null);
    }
  }

  async function deleteTrack(track) {
    if (!supabase || busyItem !== null) return;

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer définitivement le morceau "${track.title}" ?\n\nCette action supprimera également ses statistiques.`
    );
    if (!confirmed) return;

    setBusyItem(track.id);
    setError("");
    setNotice("");

    try {
      const { data, error: deleteError } = await supabase
        .from("tracks")
        .delete()
        .eq("id", track.id)
        .select("id")
        .maybeSingle();

      if (deleteError) throw deleteError;
      if (!data) {
        throw new Error("Suppression impossible. Vérifie les autorisations Supabase.");
      }

      const audioResult = track.audio_path
        ? await supabase.storage.from("music-files").remove([track.audio_path])
        : null;
      const coverResult = track.cover_path
        ? await supabase.storage.from("music-covers").remove([track.cover_path])
        : null;

      const audioOk = !audioResult || (!audioResult.error && audioResult.data?.length > 0);
      const coverOk = !coverResult || (!coverResult.error && coverResult.data?.length > 0);

      setTracks(current => current.filter(item => item.id !== track.id));
      setPreviewUrls(current => {
        const updated = { ...current };
        delete updated[track.id];
        return updated;
      });

      setNotice(audioOk && coverOk
        ? "Morceau et fichiers supprimés avec succès."
        : "Morceau supprimé, mais certains fichiers n'ont pas pu être supprimés du stockage.");
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression.");
    } finally {
      setBusyItem(null);
    }
  }

  async function previewTrack(track) {
    if (!track.audio_path) {
      setError("Aucun fichier audio associé à ce morceau.");
      return;
    }

    setError("");
    try {
      const { data, error: signError } = await supabase.storage
        .from("music-files")
        .createSignedUrl(track.audio_path, 3600);

      if (signError) throw signError;
      setPreviewUrls(current => ({ ...current, [track.id]: data.signedUrl }));
    } catch (err) {
      setError("Impossible de lire ce morceau : " + err.message);
    }
  }

  function artistLabel(artistId) {
    const artist = artists.find(item => item.id === artistId);
    return artist?.artist_name || artist?.full_name || artist?.username || "Artiste non identifié";
  }

  function historyPersonLabel(personId, fallback) {
    if (!personId) return fallback;
    const person = historyProfiles[personId];
    return person?.artist_name || person?.full_name || person?.username || fallback;
  }

  function formatHistoryDate(value) {
    if (!value) return "Date inconnue";
    return new Date(value).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  const waitingArtists = artists.filter(a => a.validation_status === "pending");
  const approvedArtists = artists.filter(a => a.validation_status === "approved");
  const rejectedArtists = artists.filter(a => a.validation_status === "rejected");
  const suspendedArtists = artists.filter(a => a.is_suspended === true);
  const pendingTracks = tracks.filter(t => t.status === "pending");
  const approvedTracks = tracks.filter(t => t.status === "approved");
  const rejectedTracks = tracks.filter(t => t.status === "rejected");

  const filteredTracks = tracks.filter(track => {
    const artistName = artistLabel(track.artist_id).toLowerCase();
    const title = (track.title || "").toLowerCase();
    const search = trackSearch.toLowerCase();

    return (title.includes(search) || artistName.includes(search))
      && (trackStatusFilter === "all" || track.status === trackStatusFilter)
      && (trackArtistFilter === "all" || track.artist_id === trackArtistFilter);
  });

  function renderArtist(artist) {
    const name = artist.artist_name || artist.full_name || artist.username || "Artiste";

    return (
      <article className="admin-artist-card" key={artist.id}>
        <div className="admin-avatar">{name.charAt(0).toUpperCase()}</div>
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
          {artist.is_suspended && (
            <>
              <span className="admin-status rejected">Compte suspendu</span>
              {artist.suspension_reason && (
                <p className="admin-suspension-reason">
                  Motif : {artist.suspension_reason}
                </p>
              )}
            </>
          )}
        </div>

        <div className="admin-track-actions">
          {artist.validation_status !== "approved" && (
            <button className="admin-btn approve" disabled={busyItem !== null}
              onClick={() => changeArtistStatus(artist.id, "approved")}>
              Valider
            </button>
          )}
          {artist.validation_status !== "rejected" && (
            <button className="admin-btn reject" disabled={busyItem !== null}
              onClick={() => changeArtistStatus(artist.id, "rejected")}>
              Refuser
            </button>
          )}
          <button
            className={`admin-btn ${artist.is_suspended ? "approve" : "reject"}`}
            disabled={busyItem !== null}
            onClick={() => changeArtistSuspension(artist.id, !artist.is_suspended)}
          >
            {artist.is_suspended ? "Réactiver" : "Suspendre"}
          </button>
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
          <div style={{ marginTop: "12px" }}>
            {previewUrls[track.id] ? (
              <audio controls preload="metadata" src={previewUrls[track.id]}
                style={{ width: "100%", maxWidth: "350px" }} />
            ) : (
              <button className="admin-btn preview" onClick={() => previewTrack(track)}>
                🎧 Écouter le morceau
              </button>
            )}
          </div>
        </div>

        <div className="admin-track-actions">
          {track.status !== "approved" && (
            <button className="admin-btn approve" disabled={busyItem !== null}
              onClick={() => changeTrackStatus(track.id, "approved")}>
              Approuver
            </button>
          )}
          {track.status !== "rejected" && (
            <button className="admin-btn reject" disabled={busyItem !== null}
              onClick={() => changeTrackStatus(track.id, "rejected")}>
              Refuser
            </button>
          )}
          {track.status !== "pending" && (
            <button className="admin-btn pending" disabled={busyItem !== null}
              onClick={() => changeTrackStatus(track.id, "pending")}>
              Remettre en attente
            </button>
          )}
          <button className="admin-btn delete" disabled={busyItem !== null}
            onClick={() => deleteTrack(track)}>
            🗑 Supprimer
          </button>
        </div>
      </article>
    );
  }

  if (loading) {
    return <div className="admin-loading">Chargement de l'administration SOUND-B...</div>;
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
        <button className="admin-refresh" onClick={loadData}>↻ Actualiser</button>
      </header>

      {error && <div className="admin-alert error">{error}</div>}
      {notice && <div className="admin-alert success">{notice}</div>}

      <section className="admin-stats">
        <div className="admin-stat">
          <span>Artistes inscrits</span><strong>{artists.length}</strong>
        </div>
        <div className="admin-stat waiting">
          <span>Artistes en attente</span><strong>{waitingArtists.length}</strong>
        </div>
        <div className="admin-stat accepted">
          <span>Artistes validés</span><strong>{approvedArtists.length}</strong>
        </div>
        <div className="admin-stat refused">
          <span>Artistes refusés</span><strong>{rejectedArtists.length}</strong>
        </div>
        <div className="admin-stat">
          <span>Comptes suspendus</span><strong>{suspendedArtists.length}</strong>
        </div>
        <div className="admin-stat">
          <span>Titres reçus</span><strong>{tracks.length}</strong>
        </div>
        <div className="admin-stat waiting">
          <span>Musiques en attente</span><strong>{pendingTracks.length}</strong>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Demandes de validation des artistes</h2><span>{waitingArtists.length}</span>
        </div>
        {waitingArtists.length === 0
          ? <p className="admin-empty">Aucune demande en attente.</p>
          : waitingArtists.map(renderArtist)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Artistes validés</h2><span>{approvedArtists.length}</span>
        </div>
        {approvedArtists.length === 0
          ? <p className="admin-empty">Aucun artiste validé.</p>
          : approvedArtists.map(renderArtist)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Artistes refusés</h2><span>{rejectedArtists.length}</span>
        </div>
        {rejectedArtists.length === 0
          ? <p className="admin-empty">Aucun artiste refusé.</p>
          : rejectedArtists.map(renderArtist)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Historique des sanctions</h2>
          <span>{suspensionHistory.length}</span>
        </div>

        {suspensionHistory.length === 0 ? (
          <p className="admin-empty">
            Aucune suspension ou réactivation enregistrée pour le moment.
          </p>
        ) : (
          <div className="admin-history-list">
            {suspensionHistory.map(item => {
              const suspended = item.action === "suspended";
              return (
                <article className="admin-history-card" key={item.id}>
                  <div className="admin-history-main">
                    <span className={`admin-history-badge ${suspended ? "suspended" : "reactivated"}`}>
                      {suspended ? "Compte suspendu" : "Compte réactivé"}
                    </span>
                    <strong>
                      {historyPersonLabel(item.artist_id, "Artiste supprimé ou inconnu")}
                    </strong>
                    <p>{formatHistoryDate(item.created_at)}</p>
                  </div>
                  <div className="admin-history-details">
                    <p>
                      <b>Administrateur :</b>{" "}
                      {historyPersonLabel(item.admin_id, "Administrateur inconnu")}
                    </p>
                    <p>
                      <b>Motif :</b> {item.reason || "Aucun motif renseigné"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Recherche et filtres musicaux</h2>
        </div>
        <input
          type="search"
          placeholder="Rechercher un titre ou un artiste..."
          value={trackSearch}
          onChange={e => setTrackSearch(e.target.value)}
          className="admin-search"
        />
        <div className="admin-filters">
          <select value={trackStatusFilter} onChange={e => setTrackStatusFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Refusées</option>
          </select>
          <select value={trackArtistFilter} onChange={e => setTrackArtistFilter(e.target.value)}>
            <option value="all">Tous les artistes</option>
            {artists.map(artist => (
              <option key={artist.id} value={artist.id}>
                {artistLabel(artist.id)}
              </option>
            ))}
          </select>
        </div>
        <p className="admin-empty">{filteredTracks.length} morceau(x) trouvé(s).</p>
        {filteredTracks.length === 0
          ? <p className="admin-empty">Aucun morceau correspondant.</p>
          : filteredTracks.map(renderTrack)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques en attente</h2><span>{pendingTracks.length}</span>
        </div>
        {pendingTracks.length === 0
          ? <p className="admin-empty">Aucune musique en attente.</p>
          : pendingTracks.map(renderTrack)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques approuvées</h2><span>{approvedTracks.length}</span>
        </div>
        {approvedTracks.length === 0
          ? <p className="admin-empty">Aucune musique approuvée.</p>
          : approvedTracks.map(renderTrack)}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Musiques refusées</h2><span>{rejectedTracks.length}</span>
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
