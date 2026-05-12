import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true)
    try {
      await signIn({ email: form.email, password: form.password })
      toast.success('Connexion réussie !')
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message || 'Erreur de connexion.'
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
          <p className="text-blue-200/70 mt-1 text-sm">Connectez-vous à votre compte</p>
        </div>

        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                className="input" placeholder="vous@exemple.com" autoComplete="email" required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                className="input" placeholder="••••••••" autoComplete="current-password" required />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block py-3">
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
