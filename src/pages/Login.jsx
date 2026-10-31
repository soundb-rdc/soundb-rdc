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
      // 1. Connexion de l'utilisateur
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error("Impossible de récupérer les informations du compte.");
      }

      // 2. Récupération du rôle dans la table profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Profil utilisateur introuvable.");
      }

      // 3. Redirection selon le rôle
      if (profile.role === "admin") {
        nav("/administration", { replace: true });
      } else if (profile.role === "artist") {
        nav("/artiste/tableau-de-bord", { replace: true });
      } else {
        await supabase.auth.signOut();
        throw new Error("Votre compte ne possède pas de rôle autorisé.");
      }
    } catch (error) {
      setMessage(error.message || "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Connexion</h1>

      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <p>
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </div>
  );
}
