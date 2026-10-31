import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import TrackPage from "./pages/TrackPage";
import ArtistPage from "./pages/ArtistPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ArtistDashboard from "./pages/ArtistDashboard";
import EditArtistProfile from "./pages/EditArtistProfile";
import UploadTrack from "./pages/UploadTrack";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recherche" element={<Search />} />
        <Route path="/titre/:id" element={<TrackPage />} />
        <Route path="/artiste/:id" element={<ArtistPage />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />

        <Route
          path="/artiste/tableau-de-bord"
          element={<ArtistDashboard />}
        />

        <Route
          path="/artiste/modifier-profil"
          element={<EditArtistProfile />}
        />

        <Route
          path="/artiste/ajouter-musique"
          element={<UploadTrack />}
        />

        <Route path="/administration" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
