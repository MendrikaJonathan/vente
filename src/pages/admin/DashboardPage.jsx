import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage } from '../../components/ui'

const ROLE_CLS = { admin:'badge-red', vendor:'badge-blue', client:'badge-green' }

export default function AdminDashboard() {
  const [stats, setStats]  = useState({ users:0, vendors:0, products:0, orders:0, revenue:0 })
  const [users, setUsers]  = useState([])
  const [orders,setOrders] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*', { count:'exact' }).limit(5).order('created_at', { ascending:false }),
      supabase.from('vendors').select('id', { count:'exact', head:true }),
      supabase.from('products').select('id', { count:'exact', head:true }).eq('status','published'),
      supabase.from('orders').select('id, total', { count:'exact' }),
    ]).then(([
      { data: uData, count: uCount },
      { count: vCount },
      { count: pCount },
      { data: oData, count: oCount },
    ]) => {
      const revenue = (oData||[]).reduce((s,o)=>s+(o.total||0),0)
      setStats({ users:uCount||0, vendors:vCount||0, products:pCount||0, orders:oCount||0, revenue })
      setUsers(uData||[])
    })

    supabase.from('orders')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending:false })
      .limit(8)
      .then(({ data }) => { setOrders(data||[]); setLoading(false) })
  }, [])

  if (loading) return <LoadingPage />

  const kpis = [
    { icon:'👥', val:stats.users,   lbl:'Utilisateurs',       bg:'bg-blue-50',   to:'/admin/users' },
    { icon:'🏪', val:stats.vendors, lbl:'Vendeurs actifs',    bg:'bg-emerald-50',to:'/admin/users' },
    { icon:'📦', val:stats.products,lbl:'Produits publiés',   bg:'bg-purple-50', to:'/admin/produits' },
    { icon:'🛍️', val:stats.orders,  lbl:'Commandes totales',  bg:'bg-orange-50', to:'/admin/commandes' },
    { icon:'💰', val:fmtPrice(stats.revenue), lbl:'Revenus totaux', bg:'bg-amber-50', to:'/admin/commandes' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="page-title">⚙️ Administration</h1>
      <p className="text-gray-500 text-sm -mt-4 mb-6">Vue globale de la plateforme ShopHub</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpis.map(k => (
          <Link key={k.lbl} to={k.to} className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`${k.bg} p-2.5 rounded-xl text-2xl flex-shrink-0`}>{k.icon}</div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{k.val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.lbl}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900">👥 Utilisateurs récents</h2>
            <Link to="/admin/users" className="text-blue-600 text-sm font-bold hover:underline">Gérer →</Link>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                  {u.full_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`badge ${ROLE_CLS[u.role] ?? 'badge-gray'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900">🛍️ Commandes récentes</h2>
            <Link to="/admin/commandes" className="text-blue-600 text-sm font-bold hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">#{o.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{o.profiles?.full_name} · {new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`badge ${
                  o.status==='delivered'?'badge-green':o.status==='cancelled'?'badge-red':'badge-blue'
                }`}>{o.status}</span>
                <span className="text-sm font-extrabold text-gray-900 flex-shrink-0">{fmtPrice(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
