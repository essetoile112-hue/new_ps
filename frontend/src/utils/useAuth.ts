import { useEffect, useState } from 'react';
import { AuthUser, onAuthChange, logoutUser, getAuthToken } from '../services/authService';

/**
 * Hook pour gérer l'authentification dans les composants
 * Utilisation: const { user, loading, logout, token } = useAuth();
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Écouter les changements d'auth
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Fetch token for WebSocket or API calls
      if (authUser) {
        const idToken = await getAuthToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
    });

    return unsubscribe; // Cleanup
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { user, loading, error, logout, token };
}
