import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function VendorSetup() {
  const { user, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ shop_name:'', description:'' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.shop_name.trim()) { toast.error('Le nom de la boutique est obligatoire'); return }
    setLoading(true)
    const { error } = await supabase.from('vendors').insert({ ...form, user_id: user.id, status:'active' })
    if (error) { toast.error('Erreur : ' + error.message); setLoading(false); return }
    toast.success('🎉 Boutique créée avec succès !')
    await fetchProfile(user.id)
    navigate('/vendor')
    setLoading(false)
  }

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-[#0f2544] to-[#1a3d7a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="text-white" size={32} />
          </div>
          <h1 className="text-white font-extrabold text-2xl">Créez votre boutique</h1>
          <p className="text-blue-200/70 mt-1">Configurez votre espace vendeur ShopHub</p>
        </div>
        <div className="card p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">Nom de la boutique *</label>
              <input value={form.shop_name} onChange={e => setForm(f=>({...f,shop_name:e.target.value}))}
                required className="input" placeholder="Ex : TechStore Madagascar" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
                className="input" rows={3} placeholder="Décrivez votre boutique…" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-accent btn-block py-3 justify-center">
              {loading ? 'Création…' : '🚀 Lancer ma boutique'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
