import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    async function loadData() {
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
          supabase.from("tracks").select("*")
        ]);

        if (artistsResult.error) throw artistsResult.error;
        if (tracksResult.error) throw tracksResult.error;

        setArtists(artistsResult.data || []);
        setTracks(tracksResult.data || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const pending = tracks.filter(t => t.status === "pending");
  const approved = tracks.filter(t => t.status === "approved");
  const rejected = tracks.filter(t => t.status === "rejected");

  if (loading) return <p>Chargement de l'administration...</p>;

  if (error) return <div className="notice">{error}</div>;

  return (
    <section>
      <p className="eyebrow">DMP CREATOR PRODUCTION</p>
      <h1>Administration SOUND-B</h1>

      <div className="dashboard-grid">
        <div className="stat">
          <b>{artists.length}</b>
          <span>Artistes inscrits</span>
        </div>

        <div className="stat">
          <b>{tracks.length}</b>
          <span>Titres reçus</span>
        </div>

        <div className="stat">
          <b>{pending.length}</b>
          <span>Titres en attente</span>
        </div>

        <div className="stat">
          <b>{approved.length}</b>
          <span>Titres approuvés</span>
        </div>

        <div className="stat">
          <b>{rejected.length}</b>
          <span>Titres refusés</span>
        </div>
      </div>

      <h2>Artistes inscrits</h2>

      {artists.map(artist => (
        <p key={artist.id}>
          {artist.artist_name || artist.full_name || artist.username || artist.id}
        </p>
      ))}

      <h2>Titres soumis</h2>

      {tracks.map(track => (
        <p key={track.id}>
          {track.title} — {track.status}
        </p>
      ))}
    </section>
  );
}
