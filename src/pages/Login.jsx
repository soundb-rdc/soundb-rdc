import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Erreur : les variables Supabase ne sont pas configurées.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      const user = data.user;

      if (!user) {
        throw new Error("Impossible de récupérer les informations du compte.");
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Profil utilisateur introuvable.");
      }

      if (profile.role === "admin") {
        nav("/administration", { replace: true });
      } else if (profile.role === "artist") {
        nav("/artiste/tableau-de-bord", { replace: true });
      } else {
        await supabase.auth.signOut();
        throw new Error("Votre compte ne possède pas de rôle autorisé.");
      }

    } catch (error) {
      setMessage(
        error.message || "Une erreur est survenue lors de la connexion."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-card">

      <p className="eyebrow">BON RETOUR</p>

      <h1>Connexion</h1>

      <form onSubmit={submit}>

        <label>
          Email
          <input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="btn primary"
          disabled={busy}
        >
          {busy ? "Connexion..." : "Se connecter"}
        </button>

      </form>

      {message && (
        <p className="notice">{message}</p>
      )}

      <p className="muted">
        Pas encore de compte ?{" "}
        <Link to="/inscription">Créer un compte</Link>
      </p>

    </section>
  );
}
