import { useState, useEffect } from 'react';
import { Eye, EyeOff, Cpu } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

interface AuthCardProps {
  initialMode: 'login' | 'register' | 'resetPassword';
  onLogin: (data: any) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
  onGoogle: (dashboardType?: 'fixed' | 'mobile') => Promise<void>;
  onResetPassword?: (oobCode: string, newPassword: string) => Promise<void>;
  oobCode?: string | null;
  successMessage: string | null;
}

export default function AuthCard({ initialMode, onLogin, onRegister, onGoogle, onResetPassword, oobCode, successMessage }: AuthCardProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'resetPassword'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    country: '',
    phoneNumber: '',
    remember: false,
    dashboardType: 'fixed'
  });

  const countries = [
    { code: 'TN', name: 'Tunisie', dial: '+216', flag: '🇹🇳' },
    { code: 'MA', name: 'Maroc', dial: '+212', flag: '🇲🇦' },
    { code: 'DZ', name: 'Algérie', dial: '+213', flag: '🇩🇿' },
    { code: 'LY', name: 'Libye', dial: '+218', flag: '🇱🇾' },
    { code: 'EG', name: 'Égypte', dial: '+20', flag: '🇪🇬' },
    { code: 'OT', name: 'Others', dial: '', flag: '🌍' },
  ];

  const getCountryByName = (name: string) => countries.find(c => c.name === name) || countries[countries.length - 1];

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const cardMaxClass = mode === 'register' ? 'max-w-lg' : 'max-w-md';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDashboardChoice = (val: 'fixed' | 'mobile') => {
    setFormData(prev => ({ ...prev, dashboardType: val }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = countries.find(c => c.name === val) || countries[countries.length - 1];
    setFormData(prev => ({ ...prev, country: found.name }));
  };

  // Check if email already exists in Firebase
  const checkEmailExists = async (_email: string): Promise<boolean> => {
    // placeholder - not used currently
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        console.log('[AUTHCARD] Submitting registration form:', {
          email: formData.email,
          fullName: formData.fullName,
          country: formData.country,
          phoneNumber: formData.phoneNumber
        });

        // Register the user
        // combine dial + local number when sending
        const selected = getCountryByName(formData.country);
        const fullPhone = selected.dial ? `${selected.dial}${formData.phoneNumber.replace(/\s+/g, '')}` : formData.phoneNumber;
        await onRegister({ ...formData, phoneNumber: fullPhone });

        console.log('[AUTHCARD] Registration successful! Switching to login mode...');
        // After successful registration, auto-switch to login mode
        setMode('login');
        // Clear the form but keep email and password for auto-login
        setFormData({
          ...formData,
          fullName: '',
          country: '',
          phoneNumber: ''
        });
        console.log('[AUTHCARD] Switched to login mode. User can now log in with:', formData.email);
      } else if (mode === 'resetPassword') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas.');
        }
        if (!oobCode || !onResetPassword) {
          throw new Error('Code de réinitialisation manquant.');
        }
        console.log('[AUTHCARD] Resetting password...');
        await onResetPassword(oobCode, formData.password);
        console.log('[AUTHCARD] Password reset successful!');
      } else {
      console.log('[AUTHCARD] Submitting login form with email:', formData.email, 'dashboardType:', formData.dashboardType);
      // Login the user (include chosen dashboardType so we can redirect correctly)
      await onLogin({ email: formData.email, password: formData.password, remember: formData.remember, dashboardType: formData.dashboardType });
      console.log('[AUTHCARD] Login successful!');
      }
    } catch (err: any) {
      console.error('[AUTHCARD] Form submission error:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className={`w-full ${cardMaxClass} bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-stone-100 transition-all duration-300 hover:shadow-2xl relative max-h-screen overflow-y-auto`}>
      {/* Decorative Eco Header */}
      <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-600" />
      
      <div className="p-6">
        {/* Header / Logo Area */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-emerald-200 bg-white overflow-hidden flex-shrink-0">
            {/* Try to load the PNG site icon from public folder, fallback to inline SVG */}
            <img
              src="/assets/icons/u4-logo.png"
              alt="U4-Green Africa"
              className="w-12 h-12 object-cover rounded-full"
              onError={(e) => {
                // hide broken image to reveal SVG fallback
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) parent.querySelector('.logo-fallback')?.classList.remove('hidden');
              }}
            />
            <span className="logo-fallback hidden w-12 h-12 flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" stroke="#10b981" strokeWidth="1.5" fill="#ffffff"/>
                <path d="M6 15c1.5-2 3-4 6-4s4.5 2 6 4" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6v6" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-800 mt-3">
            {mode === 'login' ? 'Bienvenue' : mode === 'register' ? 'Créer un compte' : 'Réinitialiser le mot de passe'}
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            {mode === 'login'
              ? 'Accédez à votre espace éco-responsable'
              : mode === 'register'
              ? 'Rejoignez notre communauté verte'
              : 'Entrez votre nouveau mot de passe'}
          </p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            ✓ {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Nom complet</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none text-stone-800 text-sm"
                  placeholder="Votre Nom"
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Pays</label>
                  <select
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleCountryChange}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none text-stone-800 text-sm"
                  >
                    <option value="">Sélectionnez un pays</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.name}>{`${c.flag} ${c.name}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Téléphone</label>
                  <div className="flex items-center w-full">
                    <div className="flex items-center w-28 flex-shrink-0 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-l-lg text-sm text-stone-700 select-none">
                      <span className="text-lg mr-2">{getCountryByName(formData.country).flag}</span>
                      <span className="font-medium">{getCountryByName(formData.country).dial || ''}</span>
                    </div>
                    <input
                      name="phoneNumber"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, phoneNumber: val }));
                      }}
                      className="min-w-0 w-full px-3 py-1.5 bg-white border-t border-b border-r border-stone-200 rounded-r-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none text-stone-800 text-sm"
                      placeholder={getCountryByName(formData.country).dial ? 'xxx xxx xxx' : '+216...'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {mode !== 'resetPassword' && (
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none text-stone-800 text-sm"
                placeholder="votre@email.com"
                onChange={handleChange}
              />
            </div>
          )}

          {/* Dashboard type selection - shown for both register and login so user picks before submit */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-4 text-center">
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Dashboard Access Type *</label>
              <div className="flex justify-center items-center gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => handleDashboardChoice('fixed')}
                  className={`relative px-5 py-2.5 rounded-xl border transition-all duration-250 ease-in-out focus:outline-none flex items-center justify-center text-sm font-medium ${
                    formData.dashboardType === 'fixed'
                      ? 'bg-white text-stone-900 shadow-lg border-emerald-300 scale-105'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:scale-102'
                  }`}
                >
                  {formData.dashboardType === 'fixed' && (
                    <span className="absolute inset-0 pointer-events-none rounded-xl">
                      <span className="absolute inset-0 rounded-xl border-2 border-emerald-300 opacity-60 animate-pulse blur-sm" />
                    </span>
                  )}
                  Fixed Stations
                </button>

                <button
                  type="button"
                  onClick={() => handleDashboardChoice('mobile')}
                  className={`relative px-5 py-2.5 rounded-xl border transition-all duration-250 ease-in-out focus:outline-none flex items-center justify-center text-sm font-medium ${
                    formData.dashboardType === 'mobile'
                      ? 'bg-white text-stone-900 shadow-lg border-emerald-300 scale-105'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:scale-102'
                  }`}
                >
                  {formData.dashboardType === 'mobile' && (
                    <span className="absolute inset-0 pointer-events-none rounded-xl">
                      <span className="absolute inset-0 rounded-xl border-2 border-emerald-300 opacity-60 animate-pulse blur-sm" />
                    </span>
                  )}
                  Mobile Sensors
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Mot de passe</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none text-stone-800 pr-9 text-sm"
                placeholder="••••••••"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'resetPassword' && (
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-0.5">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none text-stone-800 pr-9 text-sm"
                  placeholder="••••••••"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  name="remember"
                  type="checkbox"
                  className="w-3 h-3 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  onChange={handleChange}
                />
                <span className="text-stone-600">Se souvenir de moi</span>
              </label>
              <a href="/forgot" className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                Oublié ?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Se connecter' : mode === 'register' ? "S'inscrire" : 'Réinitialiser'}
                <Cpu className="w-3 h-3 opacity-80" />
              </>
            )}
          </button>
        </form>

        {mode !== 'resetPassword' && (
          <>
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-stone-500">Ou continuer avec</span>
                </div>
              </div>

              <button
                onClick={() => onGoogle(formData.dashboardType as 'fixed' | 'mobile')}
                type="button"
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-stone-200 rounded-lg bg-white hover:bg-stone-50 text-stone-700 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            {/* Footer Toggle */}
            <div className="mt-5 text-center">
              <p className="text-stone-600 text-sm">
                {mode === 'login' ? "Pas encore de compte ?" : "Déjà inscrit ?"}
                <button
                  onClick={toggleMode}
                  className="ml-2 font-semibold text-emerald-600 hover:text-emerald-800 underline decoration-2 decoration-emerald-200 hover:decoration-emerald-600 transition-all"
                >
                  {mode === 'login' ? "Créer un compte" : "Se connecter"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
