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
        profileMap = Object.fromEntries(
          (people || []).map(person => [person.id, person])
        );
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
        throw new Error(
          "Aucune modification effectuée. Vérifie les autorisations UPDATE dans Supabase."
        );
      }

      await loadData();

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

  async function changeArtistSuspension(artistId, is_suspended) {
    if (!supabase || busyItem !== null) return;

    const artist = artists.find(item => item.id === artistId);
    const artistName =
      artist?.artist_name || artist?.full_name || artist?.username || "cet artiste";
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
        throw new Error(
          "Modification impossible. Vérifie les autorisations UPDATE dans Supabase."
        );
      }

      await loadData();

      setNotice(
        is_suspended
          ? "Compte artiste suspendu. Le motif a été ajouté à l'historique."
          : "Compte artiste réactivé. La décision a été ajoutée à l'historique."
      );
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
        throw new Error(
          "Aucune modification effectuée. Vérifie les autorisations UPDATE dans Supabase."
        );
      }

      setTracks(current =>
        current.map(track =>
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

  async function deleteTrack(track) {
    if (!supabase || busyItem
