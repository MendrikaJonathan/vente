import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage } from '../../components/ui'

const STATUS_MAP = {
  pending:'En attente',confirmed:'Confirmé',processing:'En préparation',
  shipped:'Expédié',delivered:'Livré',cancelled:'Annulé',refunded:'Remboursé'
}
const PAYMENT_MAP = { pending:'En attente',paid:'Payé ✓',failed:'Échoué',refunded:'Remboursé' }
const DELIVERY_MAP = { standard:'Standard (3–5 j)',express:'Express (24h)',pickup:'Point relais (2 j)' }

const TRACKING = [
  { key:'pending',    label:'Commande reçue', icon:'📋' },
  { key:'confirmed',  label:'Paiement confirmé', icon:'💳' },
  { key:'processing', label:'En préparation', icon:'📦' },
  { key:'shipped',    label:'Expédié', icon:'🚚' },
  { key:'delivered',  label:'Livré', icon:'🏠' },
]
const ORDER_PROGRESS = ['pending','confirmed','processing','shipped','delivered']

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('orders')
      .select('*, order_items(*), addresses(*)')
      .eq('id', id).single()
      .then(({ data, error }) => {
        if (!error) setOrder(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <LoadingPage />
  if (!order)  return <div className="text-center py-20 text-gray-400">Commande introuvable.</div>

  const currentIdx = ORDER_PROGRESS.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/commandes" className="inline-flex items-center gap-1 text-blue-600 text-sm mb-6 hover:underline">
        <ChevronLeft size={16} /> Mes commandes
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="text-emerald-500" size={28} />
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Commande #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
        </div>
        <span className={`ml-auto badge ${
          order.status === 'delivered' ? 'badge-green' :
          order.status === 'cancelled' ? 'badge-red' : 'badge-blue'
        }`}>{STATUS_MAP[order.status] ?? order.status}</span>
      </div>

      {/* Tracking */}
      {order.status !== 'cancelled' && (
        <div className="card p-6 mb-4">
          <h2 className="section-title">📦 Suivi de livraison</h2>
          <div className="flex items-center gap-0">
            {TRACKING.map((step, i) => {
              const done   = i <= currentIdx
              const active = i === currentIdx
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${
                      done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                    } ${active ? 'ring-4 ring-emerald-100' : ''}`}>
                      {done ? '✓' : step.icon}
                    </div>
                    <span className={`text-xs mt-1.5 text-center font-medium ${done ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < TRACKING.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Items */}
        <div className="card p-6">
          <h2 className="section-title">Articles commandés</h2>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
                  {item.product_image
                    ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    : '📦'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{item.product_name}</p>
                  <p className="text-xs text-gray-400">×{item.quantity} · {fmtPrice(item.unit_price)} / unité</p>
                </div>
                <span className="font-extrabold text-gray-900">{fmtPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="card p-6">
          <h2 className="section-title">Récapitulatif financier</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Sous-total</span><span>{fmtPrice(order.subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Livraison ({DELIVERY_MAP[order.delivery_method] ?? 'Standard'})</span>
              <span className={order.shipping === 0 ? 'text-emerald-600 font-bold' : ''}>{order.shipping === 0 ? 'Gratuite' : fmtPrice(order.shipping)}</span>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-extrabold text-lg text-gray-900">
            <span>Total TTC</span><span>{fmtPrice(order.total)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Paiement : <span className={order.payment_status === 'paid' ? 'text-emerald-600 font-bold' : 'text-orange-500 font-bold'}>
              {PAYMENT_MAP[order.payment_status] ?? order.payment_status}
            </span>
          </p>
        </div>

        {/* Address */}
        {order.addresses && (
          <div className="card p-6">
            <h2 className="section-title">📍 Adresse de livraison</h2>
            <p className="font-bold text-gray-800">{order.addresses.full_name}</p>
            <p className="text-gray-500 text-sm">{order.addresses.street}</p>
            <p className="text-gray-500 text-sm">{order.addresses.zip} {order.addresses.city}, {order.addresses.country}</p>
            {order.addresses.phone && <p className="text-gray-500 text-sm">{order.addresses.phone}</p>}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/catalogue" className="btn btn-outline">← Continuer mes achats</Link>
      </div>
    </div>
  )
}
