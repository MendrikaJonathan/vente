import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LoadingPage } from '../../components/ui'
import toast from 'react-hot-toast'

const ROLE_CLS = { admin:'badge-red', vendor:'badge-blue', client:'badge-green' }

export default function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [q,       setQ]       = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data, error } = await supabase
      .from('profiles').select('*').order('created_at', { ascending:false })
    if (!error) setUsers(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateRole = async (id, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Rôle mis à jour'); load() }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    u.email?.toLowerCase().includes(q.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="page-title mb-0">Utilisateurs ({users.length})</h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher…" className="input pl-9 w-56" />
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-head">
          <div className="grid gap-3" style={{ gridTemplateColumns:'1.5fr 2fr 1fr 1.2fr 1.2fr' }}>
            {['Utilisateur','Email','Rôle','Inscrit le','Actions'].map(h => (
              <span key={h} className="table-cell">{h}</span>
            ))}
          </div>
        </div>

        {filtered.map((u, i) => (
          <div key={u.id} className={`table-row grid gap-3 items-center ${i%2===1?'bg-gray-50':''}`}
            style={{ gridTemplateColumns:'1.5fr 2fr 1fr 1.2fr 1.2fr' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                {u.full_name?.[0] ?? '?'}
              </div>
              <span className="font-bold text-gray-800 text-sm truncate">{u.full_name}</span>
            </div>
            <span className="text-gray-500 text-sm truncate">{u.email}</span>
            <span className={`badge ${ROLE_CLS[u.role] ?? 'badge-gray'}`}>{u.role}</span>
            <span className="text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
            <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
              className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold outline-none focus:border-blue-400 cursor-pointer">
              <option value="client">👤 Client</option>
              <option value="vendor">🏪 Vendeur</option>
              <option value="admin">⚙️ Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
