import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { useEffect } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './config/firebase.config';
import './styles/tokens.css';
import { LoadingProvider } from './contexts/LoadingContext';
// Landing i18n and providers
import './landing/i18n';
import { AuthProvider as LandingAuthProvider } from './landing/contexts/AuthContext';
import { LanguageProvider } from './landing/contexts/LanguageContext';

export default function App() {
  useEffect(() => {
    // Handle Firebase redirect result after signInWithRedirect
    // This is non-blocking - errors don't prevent app from loading
    (async () => {
      try {
        const result = await Promise.race([
          getRedirectResult(auth as any),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]).catch(() => null);
        
        if (result && result.user) {
          const idToken = await result.user.getIdToken();
          // Send to backend for verification and optional user creation
          const apiUrl = (import.meta as any).env.VITE_API_URL || (process.env.REACT_APP_API_URL as string) || 'http://localhost:3001';
          await fetch(`${apiUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }).catch(() => null);
        }
      } catch (err) {
        // Silently ignore auth redirect errors - they don't block the app
        console.debug('Auth redirect handling skipped:', (err as any)?.message);
      }
    })();
  }, []);

  return (
    <LoadingProvider>
      <LanguageProvider>
        <LandingAuthProvider>
          <Router>
            <AppRouter />
          </Router>
        </LandingAuthProvider>
      </LanguageProvider>
    </LoadingProvider>
  );
}
