import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage, Empty } from '../../components/ui'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['pending','confirmed','processing','shipped','delivered','cancelled']
const STATUS_CLS = {
  pending:'badge-gray', confirmed:'badge-blue', processing:'badge-orange',
  shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red'
}
const STATUS_LBL = {
  pending:'En attente', confirmed:'Confirmé', processing:'En préparation',
  shipped:'Expédié', delivered:'Livré', cancelled:'Annulé'
}

export default function VendorOrders() {
  const { vendor }  = useAuth()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendor) return
    supabase
      .from('order_items')
      .select(`
        id, quantity, total_price, product_name, product_image, created_at,
        order:orders ( id, status, created_at, user:profiles(full_name, email) )
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setItems(data || [])
        setLoading(false)
      })
  }, [vendor])

  const updateStatus = async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { toast.error(error.message); return }
    toast.success('Statut mis à jour')
    setItems(prev => prev.map(i =>
      i.order?.id === orderId ? { ...i, order: { ...i.order, status } } : i
    ))
  }

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="page-title">Commandes reçues ({items.length})</h1>

      {items.length === 0 ? (
        <Empty icon="📭" title="Aucune commande reçue" sub="Vos commandes apparaîtront ici dès que des clients achèteront vos produits." />
      ) : (
        <div className="table-wrap">
          <div className="table-head">
            <div className="grid gap-3" style={{ gridTemplateColumns:'1fr 1.4fr 2fr 1fr 1fr 1.4fr' }}>
              {['Commande','Client','Produit','Qté','Montant','Statut'].map(h => (
                <span key={h} className="table-cell">{h}</span>
              ))}
            </div>
          </div>

          {items.map((item, i) => (
            <div key={item.id}
              className={`table-row grid gap-3 items-center ${i % 2 === 1 ? 'bg-gray-50' : ''}`}
              style={{ gridTemplateColumns:'1fr 1.4fr 2fr 1fr 1fr 1.4fr' }}>

              <div className="font-mono text-xs text-gray-500 font-bold">
                #{item.order?.id?.slice(-8).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{item.order?.user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{item.order?.user?.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-base">
                  {item.product_image
                    ? <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    : '📦'}
                </div>
                <span className="text-sm text-gray-700 truncate font-medium">{item.product_name}</span>
              </div>

              <span className="text-sm font-bold text-gray-700">×{item.quantity}</span>
              <span className="text-sm font-extrabold text-blue-700">{fmtPrice(item.total_price)}</span>

              <div>
                <select
                  value={item.order?.status || 'pending'}
                  onChange={e => updateStatus(item.order?.id, e.target.value)}
                  className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold outline-none focus:border-blue-400 transition-all cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_LBL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
