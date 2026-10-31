import { useState } from "react";
export default function AdminDashboard() {
  const [message,setMessage]=useState("Le panneau de modération sera relié aux demandes en attente dans Supabase.");
  return <section><p className="eyebrow">DMP CREATOR PRODUCTION</p><h1>Administration SOUND-B</h1>
    <div className="dashboard-grid"><div className="stat"><b>—</b><span>Artistes à valider</span></div><div className="stat"><b>—</b><span>Titres en attente</span></div><div className="stat"><b>—</b><span>Signalements</span></div></div>
    <div className="notice">{message}</div>
    <p className="muted small">Important : protéger cette page avec un rôle administrateur vérifié côté serveur et des politiques RLS. Ne pas se fier uniquement au masquage du lien.</p>
  </section>;
}
