import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, ShoppingBag, Star, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage, Empty } from '../../components/ui'

function KpiCard({ icon, title, value, sub, bg }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`${bg} p-3 rounded-xl text-2xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_CLS = { pending:'badge-gray',confirmed:'badge-blue',shipped:'badge-blue',delivered:'badge-green',cancelled:'badge-red' }
const STATUS_LBL = { pending:'En attente',confirmed:'Confirmé',shipped:'Expédié',delivered:'Livré',cancelled:'Annulé' }

export default function VendorDashboard() {
  const { vendor } = useAuth()
  const [stats,  setStats]  = useState({ revenue:0, orders:0, products:0 })
  const [topProds, setTopProds] = useState([])
  const [recentOI, setRecentOI] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!vendor) return
    Promise.all([
      supabase.from('order_items').select('total_price, quantity, order_id, product_name, order:orders(status,created_at,user:profiles(full_name))').eq('vendor_id', vendor.id).order('created_at', { ascending:false }).limit(10),
      supabase.from('products').select('id,name,total_sold,price,rating,status,image_url').eq('vendor_id', vendor.id),
    ]).then(([{ data: oi }, { data: prods }]) => {
      const revenue  = (oi || []).reduce((s,i)=>s+(i.total_price||0),0)
      const orderIds = new Set((oi||[]).map(i=>i.order_id))
      setStats({ revenue, orders: orderIds.size, products: (prods||[]).filter(p=>p.status==='published').length })
      setTopProds((prods||[]).sort((a,b)=>(b.total_sold||0)-(a.total_sold||0)).slice(0,5))
      setRecentOI(oi||[])
      setLoading(false)
    })
  }, [vendor])

  if (loading) return <LoadingPage />
  if (!vendor) return (
    <div className="max-w-xl mx-auto px-4 py-20">
      <Empty icon="🏪" title="Boutique non configurée"
        sub="Vous devez d'abord créer votre boutique vendeur."
        action={<Link to="/vendor/setup" className="btn btn-accent btn-lg">Créer ma boutique</Link>} />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard — {vendor.shop_name}</h1>
          <p className="text-gray-500 text-sm mt-1">Bonjour ! Voici votre activité en temps réel.</p>
        </div>
        <Link to="/vendor/produits/nouveau" className="btn btn-accent">
          <Plus size={17} /> Nouveau produit
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <KpiCard icon="📈" title="Chiffre d'affaires" value={fmtPrice(stats.revenue)} sub="Total cumulé" bg="bg-blue-50" />
        <KpiCard icon="🛍️" title="Commandes" value={stats.orders} sub="Reçues" bg="bg-emerald-50" />
        <KpiCard icon="📦" title="Produits actifs" value={stats.products} sub="Publiés" bg="bg-orange-50" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900">🏆 Top produits</h2>
            <Link to="/vendor/produits" className="text-blue-600 text-sm font-bold hover:underline">Voir tout</Link>
          </div>
          {topProds.length === 0 ? (
            <Empty icon="📦" title="Aucun produit" sub="Ajoutez votre premier produit !" />
          ) : (
            <div className="space-y-3">
              {topProds.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                  <span className="text-gray-400 font-bold text-sm w-5">#{i+1}</span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.total_sold||0} ventes · {fmtPrice(p.price)}</p>
                  </div>
                  <span className={`badge ${p.status==='published'?'badge-green':'badge-gray'}`}>
                    {p.status==='published'?'Publié':'Brouillon'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900">🛍️ Dernières commandes</h2>
            <Link to="/vendor/commandes" className="text-blue-600 text-sm font-bold hover:underline">Voir tout</Link>
          </div>
          {recentOI.length === 0 ? (
            <Empty icon="📭" title="Aucune commande" sub="Vos commandes apparaîtront ici." />
          ) : (
            <div className="space-y-3">
              {recentOI.slice(0,6).map(oi => (
                <div key={oi.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{oi.product_name}</p>
                    <p className="text-xs text-gray-400">{oi.order?.user?.full_name} · ×{oi.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${STATUS_CLS[oi.order?.status]||'badge-gray'} mb-1`}>
                      {STATUS_LBL[oi.order?.status]||'?'}
                    </span>
                    <p className="text-sm font-extrabold text-gray-900">{fmtPrice(oi.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
