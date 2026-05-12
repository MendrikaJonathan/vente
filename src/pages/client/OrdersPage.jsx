import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage, Empty } from '../../components/ui'

const STATUS = {
  pending:    { label:'En attente',     cls:'badge-gray' },
  confirmed:  { label:'Confirmé',       cls:'badge-blue' },
  processing: { label:'En préparation', cls:'badge-orange' },
  shipped:    { label:'Expédié',        cls:'badge-blue' },
  delivered:  { label:'Livré',          cls:'badge-green' },
  cancelled:  { label:'Annulé',         cls:'badge-red' },
  refunded:   { label:'Remboursé',      cls:'badge-red' },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('orders')
      .select('*, order_items(product_image, product_name, quantity)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setOrders(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="page-title">Mes Commandes</h1>

      {orders.length === 0 ? (
        <Empty icon="📭" title="Aucune commande" sub="Vous n'avez pas encore passé de commande."
          action={<Link to="/catalogue" className="btn btn-primary btn-lg">Commencer mes achats</Link>} />
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = STATUS[order.status] ?? STATUS.pending
            return (
              <Link key={order.id} to={`/commandes/${order.id}`}
                className="card p-5 block hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-900 text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className="text-gray-400 text-xs ml-3">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {order.order_items?.slice(0,4).map((it, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-xl">
                      {it.product_image
                        ? <img src={it.product_image} alt={it.product_name} className="w-full h-full object-cover" />
                        : '📦'}
                    </div>
                  ))}
                  {(order.order_items?.length ?? 0) > 4 && (
                    <span className="text-gray-400 text-sm">+{order.order_items.length - 4}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{order.order_items?.length ?? 0} article{(order.order_items?.length ?? 0) > 1 ? 's' : ''}</span>
                  <span className="font-extrabold text-gray-900">{fmtPrice(order.total)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
