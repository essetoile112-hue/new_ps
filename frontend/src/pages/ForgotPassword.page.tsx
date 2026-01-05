import React, { useState } from 'react';
import { sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowRight, Loader, ClipboardCopy, AlertCircle, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo'; // Assurez-vous d'avoir ce composant
import { useLoading } from '../contexts/LoadingContext';

export default function ForgotPassword() {
  // --- LOGIQUE EXISTANTE CONSERVÉE ---
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [codeInput, setCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const actionCodeSettings = {
    url: window.location.origin + '/auth',
    handleCodeInApp: true,
  } as any;

  const extractOobCode = (input: string) => {
    try {
      const url = new URL(input);
      return url.searchParams.get('oobCode') || input;
    } catch (e) {
      return input;
    }
  };

  const friendlyError = (err: any) => {
    const msg = err?.message || String(err || '');
    if (msg.includes('auth/invalid-action-code') || msg.includes('INVALID_OOB_CODE')) {
      return "Code invalide ou déjà utilisé. Collez le lien complet reçu par email ou demandez un nouvel email.";
    }
    if (msg.includes('auth/expired-action-code') || msg.includes('EXPIRED_OOB_CODE')) {
      return "Le lien est expiré. Demandez un nouvel email de réinitialisation.";
    }
    if (msg.includes('auth/user-not-found') || msg.includes('USER_NOT_FOUND')) {
      return "Aucun compte trouvé pour cette adresse email.";
    }
    if (msg.includes('auth/invalid-email') || msg.includes('INVALID_EMAIL')) {
      return "Adresse email invalide.";
    }
    return msg;
  };

  const pasteFromClipboard = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        setError("L'API presse-papiers n'est pas disponible dans ce navigateur.");
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text) {
        setError('Le presse-papiers est vide.');
        return;
      }
      const code = extractOobCode(text.trim());
      setCodeInput(code);
      setMessage("Code collé depuis le presse-papiers.");
      // Effacer le message de succès après 3 secondes pour ne pas encombrer
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError("Impossible d'accéder au presse-papiers. Autorisez l'accès ou collez manuellement.");
    }
  };

  const { show, hide } = useLoading();

  const handleSendEmail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    show('Envoi de l\'email en cours…');
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMessage('Email envoyé. Vérifiez votre boîte mail.');
      setStep('code');
      // Ne pas pré-remplir le champ code automatiquement — laisser l'utilisateur coller le lien correct
      setCodeInput('');
    } catch (err: any) {
      console.error('[FORGOT] sendPasswordResetEmail error:', err);
      const devSuffix = (import.meta as any).env?.DEV ? ` — ${err?.code || err?.message}` : '';
      setError((friendlyError(err) || "Erreur lors de l'envoi.") + devSuffix);
    } finally {
      setLoading(false);
      hide();
    }
  };

  const handleVerifyAndReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    show('Réinitialisation du mot de passe…');
    try {
      if (!codeInput) throw new Error('Veuillez entrer le code ou le lien reçu par email.');
      const raw = codeInput.trim();
      if (/^\d+$/.test(raw)) {
        throw new Error("Code numérique détecté. Veuillez coller le lien complet reçu par email.");
      }
      const oobCode = extractOobCode(raw);

      await verifyPasswordResetCode(auth, oobCode);

      if (newPassword !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas.');
      if (newPassword.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');

      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('Succès ! Redirection vers la connexion...');
      setTimeout(() => navigate('/auth', { state: { successMessage: 'Mot de passe mis à jour. Connectez-vous.' } }), 1500);
    } catch (err: any) {
      console.error('[FORGOT] verify/confirm reset error:', err);
      setError(friendlyError(err) || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
      hide();
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    show('Renvoyer l\'email…');
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMessage('Nouvel email envoyé.');
    } catch (err: any) {
      setError(friendlyError(err) || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
      hide();
    }
  };

  // --- NOUVEAU DESIGN (JSX) ---
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative bg-stone-50"
      style={{
        backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px), radial-gradient(#10b981 0.5px, #f8fafc 0.5px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        opacity: 1
      }}
    >
      {/* Overlay léger pour adoucir le pattern */}
      <div className="absolute inset-0 bg-stone-50/90 pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-4">
             {/* Assurez-vous d'avoir le Logo importé, sinon remplacez par une icône */}
             <Logo className="w-16 h-16 drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Récupération</h1>
          <p className="text-sm text-stone-500 mt-2">
            {step === 'email' 
              ? "Mot de passe oublié ? Pas de panique." 
              : `Code envoyé à ${email}`}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 'email' && (
          <form onSubmit={handleSendEmail} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Adresse Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="exemple@domaine.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Recevoir le code'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
              
              <Link 
                to="/auth" 
                className="w-full text-center py-3 rounded-xl text-stone-500 font-medium hover:bg-stone-100 transition-colors text-sm"
              >
                Retour à la connexion
              </Link>
            </div>

            <p className="text-xs text-center text-stone-400 leading-relaxed px-4">
              Un lien contenant un code sécurisé vous sera envoyé. Vous pourrez cliquer dessus ou le coller à l'étape suivante.
            </p>
          </form>
        )}

        {/* STEP 2: VERIFY & RESET */}
        {step === 'code' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-5">
            
            {/* Champ Code avec bouton Coller intégré */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Code ou Lien</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-4 w-5 h-5 text-stone-400 z-10" />
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Collez le lien reçu ici..."
                  className="w-full pl-12 pr-24 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm text-sm truncate"
                />
                <button
                  type="button"
                  onClick={pasteFromClipboard}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  title="Coller depuis le presse-papiers"
                >
                  <ClipboardCopy className="w-3 h-3" />
                  Coller
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Nouveau mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Confirmation</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Confirmer le changement'}
              </button>
              
              <button 
                type="button" 
                onClick={handleResend}
                disabled={loading || !email}
                className="w-full py-3 rounded-xl text-stone-500 font-medium hover:bg-stone-100 hover:text-stone-700 transition-colors text-sm"
              >
                Je n'ai rien reçu, renvoyer l'email
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
