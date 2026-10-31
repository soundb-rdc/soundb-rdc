import { supabase } from "./supabase";

export async function loadApprovedTracks() {
  if (!supabase) {
    return [];
  }

  const { data: tracks, error } = await supabase
    .from("tracks")
    .select("id, title, artist_id, audio_path, cover_path, status")
    .eq("status", "approved");

  if (error) {
    console.error("Erreur de chargement des musiques :", error);
    return [];
  }

  if (!tracks || tracks.length === 0) {
    return [];
  }

  const artistIds = [...new Set(tracks.map(track => track.artist_id))];

  const { data: artists } = await supabase
    .from("profiles")
    .select("id, artist_name")
    .in("id", artistIds);

  return Promise.all(
    tracks.map(async track => {
      const artist = artists?.find(a => a.id === track.artist_id);

      let coverUrl = null;

      if (track.cover_path) {
        const { data } = await supabase.storage
          .from("music-covers")
          .createSignedUrl(track.cover_path, 3600);

        coverUrl = data?.signedUrl || null;
      }

      return {
        ...track,
        artist: artist?.artist_name || "Artiste SOUND-B",
        genre: "Musique",
        emoji: "♫",
        cover_url: coverUrl
      };
    })
  );
}
