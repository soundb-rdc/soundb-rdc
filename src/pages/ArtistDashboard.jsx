import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ArtistDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    total_plays: 0,
    total_downloads: 0,
    published_tracks: 0
  });

  const [advanced, setAdvanced] = useState({
    top_tracks: [],
    daily_plays: [],
    recent_downloads: []
  });

  const [notifications, setNotifications] = useState([]);
  const [artistMessages, setArtistMessages] = useState([]);
const [messageSubject, setMessageSubject] = useState("");
const [messageBody, setMessageBody] = useState("");
const [messageLoading, setMessageLoading] = useState(false);
const [messageSending, setMessageSending] = useState(false);
const [messageError, setMessageError] = useState("");
const [messageSuccess, setMessageSuccess] = useState("");
const [showContact, setShowContact] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(
    notification => !notification.is_read
  ).length;

  useEffect(() => {
    loadProfile();
  }, []);

  // ÉCOUTE DES NOTIFICATIONS EN TEMPS RÉEL
useEffect(() => {
  if (!supabase || !user?.id) return;

  const channel = supabase
    .channel(`notifications-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${user.id}`
      },
      (payload) => {
        setNotifications((previous) => {
          const exists = previous.some(
            (notification) => notification.id === payload.new.id
          );

          if (exists) return previous;

          return [payload.new, ...previous].slice(0, 30);
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${user.id}`
      },
      (payload) => {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === payload.new.id
              ? payload.new
              : notification
          )
        );
      }
    )
    .subscribe((status, error) => {
  console.log("État des notifications SOUND-B :", status);

  if (error) {
    console.error("Erreur Realtime :", error);
  }
});

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);

  async function loadNotifications(userId) {
    if (!supabase || !userId) return;

    setNotificationLoading(true);

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Erreur de chargement des notifications :", error);
    } finally {
      setNotificationLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("recipient_id", user.id);

      if (error) throw error;

      setNotifications(previous =>
        previous.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Impossible de marquer cette notification comme lue.");
    }
  }

  async function markAllAsRead() {
    if (!supabase || !user || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(previous =>
        previous.map(notification => ({
          ...notification,
          is_read: true
        }))
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Impossible de marquer les notifications comme lues.");
    }
  }

async function deleteNotification(notificationId) {
  if (!supabase || !user) return;

  if (!window.confirm("Supprimer cette notification ?")) return;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", user.id)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("Suppression refusée par la base de données.");
    }

    setNotifications(previous =>
      previous.filter(notification => notification.id !== notificationId)
    );
  } catch (error) {
    console.error("Erreur de suppression :", error);
    alert("Impossible de supprimer : " + (error.message || "erreur inconnue"));
  }
}

async function deleteAllNotifications() {
  if (!supabase || !user || notifications.length === 0) return;

  if (
    !window.confirm(
      "Supprimer toutes vos notifications ? Cette action est définitive."
    )
  ) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", user.id)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("Suppression refusée par la base de données.");
    }

    setNotifications([]);
  } catch (error) {
    console.error("Erreur de suppression :", error);
    alert("Impossible de supprimer : " + (error.message || "erreur inconnue"));
}
}
  
async function loadArtistMessages(userId) {
  if (!supabase || !userId) return;

  setMessageLoading(true);
  setMessageError("");

  try {
    const { data, error } = await supabase
      .from("artist_messages")
      .select("*")
      .eq("artist_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    setArtistMessages(data || []);
  } catch (error) {
    setMessageError(error.message || "Impossible de charger les messages.");
  } finally {
    setMessageLoading(false);
  }
}

  async function sendArtistMessage(event) {
  event.preventDefault();

  if (!supabase || !user) return;

  const subject = messageSubject.trim();
  const message = messageBody.trim();

  if (!subject || !message) {
    setMessageError("Veuillez remplir tous les champs.");
    return;
  }

  if (subject.length > 120 || message.length > 3000) {
    setMessageError("Le sujet ou le message est trop long.");
    return;
  }

  setMessageSending(true);
  setMessageError("");
  setMessageSuccess("");

  try {
    const { error } = await supabase
      .from("artist_messages")
      .insert({
        artist_id: user.id,
        subject,
        message
      });

    if (error) throw error;

    setMessageSubject("");
    setMessageBody("");
    setMessageSuccess("Votre message a été envoyé à l'administration.");

    await loadArtistMessages(user.id);
  } catch (error) {
    setMessageError(error.message || "Impossible d'envoyer le message.");
  } finally {
    setMessageSending(false);
  }
  }
  async function loadProfile() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!auth.user) {
        setLoading(false);
        return;
      }

      setUser(auth.user);

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Chargement des notifications
      await loadNotifications(auth.user.id);
      await loadArtistMessages(auth.user.id);

      // Statistiques générales
      const { data: statistics, error: statsError } =
        await supabase.rpc("get_artist_statistics");

      if (statsError) throw statsError;

      const basicStats = Array.isArray(statistics)
        ? statistics[0]
        : statistics;

      if (basicStats) {
        setStats(basicStats);
      }

      // Statistiques avancées
      const { data: advancedData, error: advancedError } =
        await supabase.rpc("get_artist_advanced_statistics");

      if (advancedError) throw advancedError;

      if (advancedData) {
        setAdvanced({
          top_tracks: advancedData.top_tracks || [],
          daily_plays: advancedData.daily_plays || [],
          recent_downloads: advancedData.recent_downloads || []
        });
      }

    } catch (error) {
      console.error("Erreur tableau de bord SOUND-B :", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="muted">Chargement de votre espace artiste...</p>;
  }

  if (!user) {
    return (
      <section className="page">
        <p>Connectez-vous pour accéder à votre espace artiste.</p>
        <Link className="btn primary" to="/connexion">
          Se connecter
        </Link>
      </section>
    );
  }

  const maxPlays = Math.max(
    1,
    ...advanced.daily_plays.map(day => Number(day.total))
  );

  return (
    <section className="page">

      <p className="eyebrow">ESPACE PERSONNEL</p>

      <h1>Tableau de bord artiste</h1>

      {/* CENTRE DE NOTIFICATIONS */}

      <div
        style={{
          margin: "20px 0",
          padding: "18px",
          borderRadius: "12px",
          background: "rgba(255, 138, 50, 0.08)",
          border: "1px solid rgba(255, 138, 50, 0.3)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "700",
              padding: "5px 0"
            }}
          >
            🔔 Mes notifications
            {unreadCount > 0 && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "9px",
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: "#dc3232",
                  color: "#fff",
                  fontSize: "12px"
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadNotifications(user.id)}
            disabled={notificationLoading}
            style={{
              padding: "7px 12px",
              borderRadius: "7px",
              border: "1px solid #ff8a32",
              background: "transparent",
              color: "inherit",
              cursor: "pointer"
            }}
          >
            {notificationLoading ? "Actualisation..." : "↻ Actualiser"}
          </button>
        </div>

        {showNotifications && (
          <div style={{ marginTop: "18px" }}>

            {notifications.length > 0 && (
  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "15px"
    }}
  >
    {unreadCount > 0 && (
      <button
        type="button"
        onClick={markAllAsRead}
        style={{
          padding: "8px 12px",
          border: "none",
          borderRadius: "7px",
          background: "#ff8a32",
          color: "#171717",
          fontWeight: "600",
          cursor: "pointer"
        }}
      >
        Tout marquer comme lu
      </button>
    )}

    <button
      type="button"
      onClick={deleteAllNotifications}
      style={{
        padding: "8px 12px",
        border: "1px solid #dc3232",
        borderRadius: "7px",
        background: "transparent",
        color: "#ff7777",
        fontWeight: "600",
        cursor: "pointer"
      }}
    >
      🗑️ Tout supprimer
    </button>
  </div>
)}

            {notificationLoading && notifications.length === 0 ? (
              <p className="muted">Chargement des notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="muted">
                Vous n'avez aucune notification pour le moment.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    style={{
                      padding: "14px",
                      borderRadius: "9px",
                      background: notification.is_read
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(255,138,50,0.13)",
                      border: notification.is_read
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid #ff8a32"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap"
                      }}
                    >
                      <strong>
                        {notification.type === "warning" ? "⚠️ " : "✅ "}
                        {notification.title}
                      </strong>

                      {!notification.is_read && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#ff8a32",
                            fontWeight: "700"
                          }}
                        >
                          NON LUE
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        margin: "10px 0",
                        lineHeight: "1.6"
                      }}
                    >
                      {notification.message}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap"
                      }}
                    >
                      <small className="muted">
        {new Date(notification.created_at).toLocaleString("fr-FR")}
      </small>

      {!notification.is_read && (
        <button
      type="button"
      onClick={() => markAsRead(notification.id)}
      style={{
        border: "none",
        background: "transparent",
        color: "#ff8a32",
        cursor: "pointer",
        fontWeight: "600"
      }}
    >
      Marquer comme lu
    </button>
      )}

      {/* ⬇️ AJOUTE ICI */}
      <button
        type="button"
        onClick={() => deleteNotification(notification.id)}
        style={{
          border: "none",
          background: "transparent",
          color: "#ff7777",
          cursor: "pointer",
          fontWeight: "600"
        }}
      >
        🗑️ Supprimer
      </button>
      {/* ⬆️ FIN */}

    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
{/* MESSAGERIE AVEC L'ADMINISTRATION */}

<div className="form-card" style={{ margin: "25px 0" }}>
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  }}>
    <h2>✉️ Contacter l'administration</h2>

    <button
      type="button"
      className="btn primary"
      onClick={() => setShowContact(!showContact)}
    >
      {showContact ? "Fermer" : "Écrire un message"}
    </button>
  </div>

  {showContact && (
    <form onSubmit={sendArtistMessage} style={{ marginTop: "18px" }}>
      <label>Sujet du message</label>
      <input
        type="text"
        value={messageSubject}
        onChange={e => setMessageSubject(e.target.value)}
        placeholder="Ex. : Problème avec mon compte"
        maxLength={120}
        required
        style={{ width: "100%", margin: "8px 0 15px" }}
      />

      <label>Votre message</label>
      <textarea
        value={messageBody}
        onChange={e => setMessageBody(e.target.value)}
        placeholder="Décrivez votre problème ou votre préoccupation..."
        maxLength={3000}
        rows={5}
        required
        style={{ width: "100%", margin: "8px 0 15px" }}
      />

      <button
        type="submit"
        className="btn primary"
        disabled={messageSending}
      >
        {messageSending ? "Envoi en cours..." : "📨 Envoyer à l'administration"}
      </button>
    </form>
  )}

  {messageError && (
    <p style={{ color: "#ff7777", marginTop: "12px" }}>
      {messageError}
    </p>
  )}

  {messageSuccess && (
    <p style={{ color: "#19c37d", marginTop: "12px" }}>
      {messageSuccess}
    </p>
  )}

  <hr style={{ margin: "22px 0", opacity: 0.2 }} />

  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px"
  }}>
    <h3>📬 Mes messages</h3>

    <button
      type="button"
      className="btn secondary"
      onClick={() => loadArtistMessages(user.id)}
      disabled={messageLoading}
    >
      {messageLoading ? "Chargement..." : "↻ Actualiser"}
    </button>
  </div>

  {messageLoading && artistMessages.length === 0 ? (
    <p className="muted">Chargement des messages...</p>
  ) : artistMessages.length === 0 ? (
    <p className="muted">
      Vous n'avez encore envoyé aucun message.
    </p>
  ) : (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      marginTop: "15px"
    }}>
      {artistMessages.map(item => (
        <article
          key={item.id}
          style={{
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.03)"
          }}
        >
          <strong>{item.subject}</strong>

          <p style={{ lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
            {item.message}
          </p>

          <small className="muted">
            Envoyé le {new Date(item.created_at).toLocaleString("fr-FR")}
          </small>

          <p style={{
            color: item.status === "replied" ? "#19c37d" : "#f0b84b",
            fontWeight: "700",
            marginTop: "10px"
          }}>
            {item.status === "replied"
              ? "✅ Réponse de l'administration"
              : "⏳ En attente de réponse"}
          </p>

          {item.admin_reply && (
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(25,195,125,0.08)",
              marginTop: "10px"
            }}>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                {item.admin_reply}
              </p>

              {item.replied_at && (
                <small className="muted">
                  Répondu le {new Date(item.replied_at).toLocaleString("fr-FR")}
                </small>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )}
</div>
      {/* NOTIFICATION DE VALIDATION DU PROFIL */}

      {profile?.validation_status === "pending" && (
        <div style={{
          padding: "16px",
          margin: "20px 0",
          borderRadius: "10px",
          background: "rgba(255, 170, 0, 0.12)",
          border: "1px solid #e6a23c"
        }}>
          <strong>⏳ Profil en cours de vérification</strong>
          <p>
            Votre demande d'inscription est bien reçue.
            Notre équipe examine actuellement votre profil.
            Vous serez informé dès qu'une décision sera prise.
          </p>
        </div>
      )}

      {profile?.validation_status === "approved" && (
        <div style={{
          padding: "16px",
          margin: "20px 0",
          borderRadius: "10px",
          background: "rgba(40, 180, 100, 0.12)",
          border: "1px solid #28b464"
        }}>
          <strong>🎉 Félicitations ! Votre profil est validé.</strong>
          <p>
            Votre profil artiste est maintenant approuvé
            et peut être visible sur SOUND-B.
            Bienvenue officiellement dans notre communauté !
          </p>
        </div>
      )}

      {profile?.validation_status === "rejected" && (
        <div style={{
          padding: "16px",
          margin: "20px 0",
          borderRadius: "10px",
          background: "rgba(220, 50, 50, 0.12)",
          border: "1px solid #dc3232"
        }}>
          <strong>⚠️ Votre demande n'a pas été approuvée.</strong>
          <p>
            Votre profil artiste n'a pas été accepté.
            Veuillez contacter l'administration SOUND-B
            pour obtenir davantage d'informations.
          </p>
        </div>
      )}

      {/* PROFIL ARTISTE */}

      <div className="artist-profile">
        <img
          className="artist-profile-photo"
          src={
            profile?.avatar_url ||
            "https://placehold.co/150x150/392416/ff8a32?text=SOUND-B"
          }
          alt="Photo de profil"
        />

        <div>
          <h2>{profile?.artist_name || "Artiste SOUND-B"}</h2>
          <p className="muted">{user.email}</p>

          {profile?.music_styles?.length > 0 && (
            <p className="muted">
              {profile.music_styles.join(" • ")}
            </p>
          )}
        </div>
      </div>

      <div className="actions">
        <Link
          className="btn primary"
          to="/artiste/modifier-profil"
        >
          ✎ Modifier mon profil
        </Link>

        <Link
          className="btn secondary"
          to="/artiste/ajouter-musique"
        >
          + Ajouter une musique
        </Link>
      </div>

      {/* STATISTIQUES GÉNÉRALES */}

      <h2>Mes performances</h2>

      <div className="dashboard-grid">

        <div className="stat">
          <b>
            {Number(stats.total_plays || 0).toLocaleString("fr-FR")}
          </b>
          <span>Écoutes</span>
        </div>

        <div className="stat">
          <b>
            {Number(stats.total_downloads || 0).toLocaleString("fr-FR")}
          </b>
          <span>Téléchargements</span>
        </div>

        <div className="stat">
          <b>
            {Number(stats.published_tracks || 0).toLocaleString("fr-FR")}
          </b>
          <span>Titres publiés</span>
        </div>

      </div>

      {/* GRAPHIQUE DES ÉCOUTES */}

      <div className="form-card" style={{ marginTop: "25px" }}>

        <h2>📊 Évolution des écoutes</h2>

        <p className="muted">
          Activité des 7 derniers jours
        </p>

        {advanced.daily_plays.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              gap: "10px",
              height: "190px",
              paddingTop: "20px"
            }}
          >
            {advanced.daily_plays.map((day, index) => {
              const value = Number(day.total || 0);
              const height = (value / maxPlays) * 130;

              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                    gap: "7px"
                  }}
                >
                  <small>{value}</small>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: "35px",
                      height: `${Math.max(height, 4)}px`,
                      background: "#ff8a32",
                      borderRadius: "6px 6px 0 0"
                    }}
                  />

                  <small className="muted">
                    {new Date(day.day + "T12:00:00").toLocaleDateString(
                      "fr-FR",
                      { day: "2-digit", month: "2-digit" }
                    )}
                  </small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Aucune donnée disponible.</p>
        )}

      </div>

      {/* TOP 5 DES CHANSONS */}

      <div className="form-card" style={{ marginTop: "25px" }}>

        <h2>🏆 Mes titres les plus écoutés</h2>

        {advanced.top_tracks.length > 0 ? (
          <div>
            {advanced.top_tracks.map((track, index) => (
              <div
                key={track.track_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <div>
                  <strong>
                    {index + 1}. {track.title}
                  </strong>

                  <p className="muted" style={{ margin: "5px 0 0" }}>
                    🎧 {Number(track.plays)} écoutes
                  </p>
                </div>

                <span>
                  ⬇️ {Number(track.downloads)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucun titre publié pour le moment.
          </p>
        )}

      </div>

      {/* TÉLÉCHARGEMENTS RÉCENTS */}

      <div className="form-card" style={{ marginTop: "25px" }}>

        <h2>⬇️ Téléchargements récents</h2>

        {advanced.recent_downloads.length > 0 ? (
          <div>
            {advanced.recent_downloads.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <strong>{item.title}</strong>

                <p className="muted" style={{ margin: "5px 0 0" }}>
                  {new Date(item.downloaded_at).toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucun téléchargement enregistré.
          </p>
        )}

      </div>

    </section>
  );
}
