import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useLoading } from '../contexts/LoadingContext';

export default function LoginPartie() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cartChoice, setCartChoice] = useState<'fixed' | 'mobile'>('fixed');
  const navigate = useNavigate();
  const { show, hide } = useLoading();

  const handleLogin = async () => {
    if (!email || !password) return setError('Veuillez renseigner email et mot de passe');
    if (!cartChoice) return setError('Veuillez choisir Fixed ou Mobile cart');
    setError('');
    show('Connexion en cours…');
    try {
      await loginUser(email, password);
      // Redirect based on selection
      if (cartChoice === 'fixed') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard/mobile');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la connexion');
    } finally {
      hide();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDF4] to-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#343A40] mb-2">Welcome Back</h1>
          <p className="text-[#343A40]/70">Sign in to access your dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[#343A40] mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#343A40] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-4 py-3 border border-gray-200 rounded-lg focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/20 outline-none transition-all"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#343A40] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-4 py-3 border border-gray-200 rounded-lg focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/20 outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#343A40] mb-2">Choose cart</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="cart" checked={cartChoice === 'fixed'} onChange={() => setCartChoice('fixed')} />
                  <span>Fixed cart</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="cart" checked={cartChoice === 'mobile'} onChange={() => setCartChoice('mobile')} />
                  <span>Mobile cart</span>
                </label>
              </div>
            </div>
          </div>

          <button onClick={handleLogin} className="w-full bg-[#2E8B57] text-white py-4 rounded-lg hover:bg-[#3CB371] transition-all font-semibold mb-4">Sign In</button>

          <div className="text-center border-t border-gray-200 pt-6">
            <p className="text-sm text-[#343A40]/70">Don't have an account? <a href="/register" className="text-[#2E8B57] hover:underline font-semibold">Sign Up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
