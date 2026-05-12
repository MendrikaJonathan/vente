import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage, Empty } from '../../components/ui'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded']
const STATUS_CLS = {
  pending:'badge-gray', confirmed:'badge-blue', processing:'badge-orange',
  shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red', refunded:'badge-red'
}
const STATUS_LBL = {
  pending:'En attente', confirmed:'Confirmé', processing:'En préparation',
  shipped:'Expédié', delivered:'Livré', cancelled:'Annulé', refunded:'Remboursé'
}
const PAY_CLS = { pending:'badge-orange', paid:'badge-green', failed:'badge-red', refunded:'badge-gray' }
const PAY_LBL = { pending:'En attente', paid:'Payé ✓', failed:'Échoué', refunded:'Remboursé' }

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (!error) setOrders(data||[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Statut mis à jour'); load() }
  }

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="page-title">Toutes les Commandes ({orders.length})</h1>

      {orders.length === 0 ? (
        <Empty icon="📭" title="Aucune commande" sub="Les commandes des clients apparaîtront ici." />
      ) : (
        <div className="table-wrap">
          <div className="table-head">
            <div className="grid gap-3" style={{ gridTemplateColumns:'1fr 1.4fr 1fr 1fr 1fr 1.3fr 1.3fr' }}>
              {['#Commande','Client','Total','Paiement','Statut','Date','Action'].map(h => (
                <span key={h} className="table-cell">{h}</span>
              ))}
            </div>
          </div>

          {orders.map((o, i) => (
            <div key={o.id} className={`table-row grid gap-3 items-center ${i%2===1?'bg-gray-50':''}`}
              style={{ gridTemplateColumns:'1fr 1.4fr 1fr 1fr 1fr 1.3fr 1.3fr' }}>
              <span className="font-mono text-xs font-bold text-gray-600">#{o.id.slice(-8).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{o.profiles?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{o.profiles?.email}</p>
              </div>
              <span className="font-extrabold text-blue-700 text-sm">{fmtPrice(o.total)}</span>
              <span className={`badge ${PAY_CLS[o.payment_status]??'badge-gray'}`}>
                {PAY_LBL[o.payment_status]??o.payment_status}
              </span>
              <span className={`badge ${STATUS_CLS[o.status]??'badge-gray'}`}>
                {STATUS_LBL[o.status]??o.status}
              </span>
              <span className="text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
              <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold outline-none focus:border-blue-400 cursor-pointer">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LBL[s]}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
