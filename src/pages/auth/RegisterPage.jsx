import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()
  const [params]   = useSearchParams()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: params.get('role') === 'vendor' ? 'vendor' : 'client'
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.fullName || !form.email || !form.password) { setError('Tous les champs sont obligatoires.'); return }
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: form.role })
      toast.success('Compte créé ! Vérifiez votre email pour confirmer.')
      navigate('/login')
    } catch (err) {
      setError(
        err.message?.includes('already registered')
          ? 'Cet email est déjà utilisé. Connectez-vous.'
          : err.message || 'Erreur lors de la création du compte.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-[#0f2544] to-[#1a3d7a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛒</div>
          <h1 className="text-white font-bold text-2xl">Shop<span className="text-amber-400">Hub</span></h1>
          <p className="text-blue-200/70 mt-1 text-sm">Créez votre compte gratuitement</p>
        </div>

        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nom complet *</label>
              <input name="fullName" value={form.fullName} onChange={handle}
                className="input" placeholder="Ex : Marie Dupont" required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                className="input" placeholder="vous@exemple.com" autoComplete="email" required />
            </div>
            <div>
              <label className="label">Mot de passe * (min. 6 caractères)</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                className="input" placeholder="••••••••" required />
            </div>
            <div>
              <label className="label">Confirmer le mot de passe *</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle}
                className="input" placeholder="••••••••" required />
            </div>

            {/* Role selector */}
            <div>
              <label className="label">Je suis un :</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'client', icon: '👤', label: 'Client', sub: 'Acheter des produits' },
                  { val: 'vendor', icon: '🏪', label: 'Vendeur', sub: 'Vendre mes produits' },
                ].map(({ val, icon, label, sub }) => (
                  <label key={val}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.role === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="role" value={val} checked={form.role === val} onChange={handle} className="sr-only" />
                    <span className="text-2xl mb-1">{icon}</span>
                    <span className="font-bold text-sm text-gray-900">{label}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block py-3">
              {loading ? 'Création…' : 'Créer mon compte →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
