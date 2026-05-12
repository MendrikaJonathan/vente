import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_LABELS = { admin:'⚙️ Administrateur', vendor:'🏪 Vendeur', client:'👤 Client' }
const ROLE_CLS    = { admin:'badge-red', vendor:'badge-blue', client:'badge-green' }

export default function ProfilePage() {
  const { user, profile, fetchProfile } = useAuth()
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '' })
  const [loading, setLoading] = useState(false)
  const [pwForm, setPwForm] = useState({ current:'', next:'', confirm:'' })
  const [pwLoading, setPwLoading] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Le nom ne peut pas être vide'); return }
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user.id)
    if (error) toast.error('Erreur : ' + error.message)
    else { toast.success('Profil mis à jour !'); fetchProfile(user.id) }
    setLoading(false)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.next.length < 6) { toast.error('Mot de passe trop court (min 6 caractères)'); return }
    if (pwForm.next !== pwForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) toast.error('Erreur : ' + error.message)
    else { toast.success('Mot de passe mis à jour !'); setPwForm({ current:'', next:'', confirm:'' }) }
    setPwLoading(false)
  }

  const initials = profile?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? 'U'

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="page-title">Mon Profil</h1>

      <div className="card p-8 mb-5">
        <div className="flex items-center gap-4 mb-7">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-lg">{profile?.full_name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className={`badge mt-1 ${ROLE_CLS[profile?.role] ?? 'badge-gray'}`}>
              {ROLE_LABELS[profile?.role] ?? profile?.role}
            </span>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input className="input" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email} disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Enregistrement…' : '💾 Enregistrer les modifications'}
          </button>
        </form>
      </div>

      <div className="card p-8">
        <h2 className="section-title">🔑 Changer le mot de passe</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input type="password" className="input" value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="Min. 6 caractères" />
          </div>
          <div>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input type="password" className="input" value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={pwLoading} className="btn btn-outline">
            {pwLoading ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
