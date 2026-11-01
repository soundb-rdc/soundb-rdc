import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function TrackPage() {
  const { id } = useParams();

  const [track, setTrack] = useState(null);
  const [artist, setArtist] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function recordEvent(eventType, trackId) {
    try {
      const { data: auth } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("track_events")
        .insert({
          track_id: trackId,
          event_type: eventType,
          user_id: auth.user?.id || null
        });

      if (error) {
        console.error("Erreur statistiques SOUND-B :", error);
      }
    } catch (err) {
      console.error("Impossible d'enregistrer l'événement :", err);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadTrack() {
      try {
        setLoading(true);
        setError("");

        const { data, error: trackError } = await supabase
          .from("tracks")
          .select("*")
          .eq("id", id)
          .eq("status", "approved")
          .single();

        if (trackError) throw trackError;

        if (!data.audio_path) {
          throw new Error("Aucun fichier audio associé à ce morceau.");
        }

        if (active) setTrack(data);

        const { data: audioData, error: audioError } =
          await supabase.storage
            .from("music-files")
            .createSignedUrl(data.audio_path, 3600);

        if (audioError) {
          throw new Error("Erreur de lecture audio : " + audioError.message);
        }

        if (active) setAudioUrl(audioData.signedUrl);

        if (data.cover_path) {
          const { data:
