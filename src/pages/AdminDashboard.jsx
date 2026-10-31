import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
        supabase
          .from("profiles")
          .select("*")
          .eq("role", "artist"),

        supabase
          .from("tracks")
          .select("*"),
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

  const pending = tracks.filter(
    (track) => track.status === "pending"
  );

  const approved = tracks.filter(
    (track) => track.status === "approved"
  );

  const rejected = tracks.filter(
    (track) => track.status === "rejected"
  );

  function artistLabel(artistId) {
    const artist = artists.find(
      (item) => item.id === artistId
    );

    if (!artist) return "Artiste non identifié";

    return (
      artist.artist_name ||
      artist.full_name ||
      artist.username ||
      artist.email ||
      artist.id
    );
  }

  if (loading) {
    return <p>Chargement de l'administration...</p>;
  }

  if (error && artists.length === 0 && tracks.length === 0) {
    return <div className="notice">{error}</div>;
  }

  return (
    <section>
      <p className="eyebrow">
        DMP CREATOR PRODUCTION
      </p>

      <h1>Administration SOUND-B</h1>

      <p className="mut
