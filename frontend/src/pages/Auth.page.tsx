import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, registerUser } from '../services/authService';
import AuthCard from '../components/AuthCard';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { useLoading } from '../contexts/LoadingContext';

/**
 * Page de connexion (Login)
 * Design: Fond avec circuit + plante verte (Eco-Tech)
 */
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { show, hide } = useLoading();
  // @ts-ignore
  const successMessage = (location.state && location.state.successMessage) || null;

  const params = new URLSearchParams(location.search);
  const modeParam = params.get('mode');
  const oobCode = params.get('oobCode');
  const initialMode = modeParam === 'register' ? 'register' : (modeParam === 'resetPassword' && oobCode) ? 'resetPassword' : 'login';

  const handleLogin = async (data: any) => {
    show('Connexion en cours…');
    try {
      await loginUser(data.email, data.password);
      if (data.remember) localStorage.setItem('userEmail', data.email);
      // Redirect based on dashboardType choice (default to fixed)
      const target = data?.dashboardType === 'mobile' ? '/dashboard/mobile' : '/dashboard';
      navigate(target);
    } finally {
      hide();
    }
  };

  const handleRegister = async (data: any) => {
    show('Création du compte…');
    try {
      await registerUser(data.fullName, data.country, data.phoneNumber, data.email, data.password);
      // After successful registration, redirect based on chosen dashboard type
      const target = data?.dashboardType === 'mobile' ? '/dashboard/mobile' : '/dashboard';
      navigate(target);
    } finally {
      hide();
    }
  };

  const handleResetPassword = async (oobCode: string, newPassword: string) => {
    show('Réinitialisation en cours…');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      // After successful reset, redirect to login with success message
      navigate('/auth', { state: { successMessage: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' } });
    } finally {
      hide();
    }
  };

  const handleGoogle = async (dashboardType?: 'fixed' | 'mobile') => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('[Auth] Starting Google Sign-In with popup...');
      show('Connexion via Google…');
      
      const result: any = await signInWithPopup(auth, provider);
      console.log('[Auth] ✅ Google Sign-In popup successful');
      
      const idToken = await result.user.getIdToken();
      console.log('[Auth] ✅ ID Token retrieved');
      
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';
      console.log(`[Auth] API URL: ${apiUrl}`);

      // Try to send to backend for verification, but don't fail if backend is down
      try {
        console.log('[Auth] Sending token to backend for verification...');
        const res = await fetch(`${apiUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          console.warn('[Auth] Backend verification failed (non-200 status), but proceeding with client-side auth');
        } else {
          console.log('[Auth] ✅ Backend verification successful');
        }
      } catch (backendErr) {
        console.warn('[Auth] Backend not available, proceeding with client-side Google auth', backendErr);
      }

      // Determine target based on dashboardType choice (default to fixed dashboard)
      const target = dashboardType === 'mobile' ? '/dashboard/mobile' : '/dashboard';
      console.log(`[Auth] Navigating to ${target}`);
      navigate(target);
      hide();
    } catch (err: any) {
      console.error('[Auth] ❌ Error during Google Sign-In:', err);
      console.error('[Auth] Error code:', err?.code);
      console.error('[Auth] Error message:', err?.message);
      
      if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/web-storage-unsupported')) {
        console.log('[Auth] Popup blocked/closed, using redirect flow instead...');
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-stone-100 overflow-hidden">
      {/* Simple light background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-stone-50 to-emerald-50"></div>
      
      {/* Abstract Circuit Decoration (CSS only) */}
      <div className="absolute inset-0 z-0 opacity-10" 
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 flex justify-center animate-in fade-in zoom-in duration-500">
        <AuthCard
          initialMode={initialMode}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogle={handleGoogle}
          onResetPassword={handleResetPassword}
          oobCode={oobCode}
          successMessage={successMessage}
        />
      </div>
    </div>
  );
}
