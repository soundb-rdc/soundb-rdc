import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export default function ArtistDashboard() {
  const [user,setUser]=useState(null);
  useEffect(()=>{supabase?.auth.getUser().then(({data})=>setUser(data.user));},[]);
  return <section><p className="eyebrow">ESPACE PERSONNEL</p><h1>Tableau de bord artiste</h1><p className="muted">{user?.email || "Connecte-toi pour accéder à ton espace artiste."}</p>
    <div className="dashboard-grid"><div className="stat"><b>—</b><span>Écoutes</span></div><div className="stat"><b>—</b><span>Téléchargements</span></div><div className="stat"><b>—</b><span>Titres publiés</span></div></div>
    <Link className="btn primary" to="/artiste/ajouter-musique">+ Ajouter une musique</Link>
    <p className="notice">Les statistiques et la liste réelle des titres seront activées après création des tables Supabase et des règles RLS.</p>
  </section>;
}
