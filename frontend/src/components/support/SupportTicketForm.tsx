import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useAuth } from '../../utils/useAuth';

export default function SupportTicketForm({ reportRef }: { reportRef?: React.RefObject<HTMLDivElement> }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!subject.trim() || !description.trim()) {
      setError('Veuillez renseigner un sujet et une description.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        subject: subject.trim(),
        description: description.trim(),
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: serverTimestamp(),
        status: 'open',
        source: 'dashboard',
      });
      setSuccess(true);
      setSubject('');
      setDescription('');
      // optional: scroll to reportRef if provided
      if (reportRef && reportRef.current) reportRef.current.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      console.error('Support ticket submit error', err);
      setError('Échec de l\'envoi du ticket. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm font-medium">Sujet</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Court résumé du problème" className="w-full mt-1 p-2 border rounded" />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez le problème en détail, étapes pour reproduire, et informations utiles." className="w-full mt-1 p-2 border rounded h-28" />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Vous êtes connecté en tant que <strong>{user?.email || 'Invité'}</strong></div>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={loading} className="px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-60">
            {loading ? 'Envoi...' : 'Soumettre'}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-rose-500">{error}</div>}
      {success && <div className="text-sm text-emerald-600">Ticket soumis — nous revenons vers vous bientôt.</div>}
    </form>
  );
}
