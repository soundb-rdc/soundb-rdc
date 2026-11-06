import { createContext, useContext, useState } from "react";

const FavoritesContext = createContext(null);

const STORAGE_KEY = "soundb_favorites";

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function toggleFavorite(trackId) {
    setFavoriteIds((previous) => {
      const id = String(trackId);

      const updated = previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id];

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Erreur favoris SOUND-B :", error);
      }

      return updated;
    });
  }

  function isFavorite(trackId) {
    return favoriteIds.includes(String(trackId));
  }

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites doit être utilisé dans FavoritesProvider"
    );
  }

  return context;
}
