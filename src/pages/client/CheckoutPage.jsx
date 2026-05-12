import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { fmtPrice } from '../../components/products/ProductCard'
import toast from 'react-hot-toast'

const STEPS = ['Panier', 'Livraison', 'Paiement', 'Confirmation']
const DELIVERY = [
  { id:'standard', label:'📦 Livraison standard', sub:'3–5 jours ouvrés', price:0 },
  { id:'express',  label:'⚡ Livraison express',  sub:'24h — Antananarivo', price:5000 },
  { id:'pickup',   label:'🏪 Point relais',        sub:'2 jours ouvrés', price:0 },
]
const PAYMENT = [
  { id:'simulation', label:'🧪 Simulation (Démo)', sub:'Confirmation instantanée — aucun vrai paiement' },
  { id:'card',       label:'💳 Carte bancaire (Stripe)', sub:'Visa · Mastercard · 3D Secure' },
  { id:'mobile',     label:'📱 Mobile Money',      sub:'MVola · Orange Money · Airtel Money' },
]

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [loading,  setLoading]  = useState(false)
  const [delivery, setDelivery] = useState('standard')
  const [payment,  setPayment]  = useState('simulation')
  const [addr, setAddr] = useState({ full_name:'', street:'', city:'', zip:'', country:'Madagascar', phone:'' })

  const shipCost = DELIVERY.find(d => d.id === delivery)?.price ?? 0
  const total    = subtotal + shipCost

  const handleAddr = e => setAddr(a => ({ ...a, [e.target.name]: e.target.value }))

  const placeOrder = async (e) => {
    e.preventDefault()
    if (!addr.full_name || !addr.street || !addr.city || !addr.phone) {
      toast.error('Remplissez tous les champs obligatoires (*)'); return
    }
    if (items.length === 0) { toast.error('Votre panier est vide'); return }
    setLoading(true)
    try {
      // 1. Save address
      const { data: address, error: addrErr } = await supabase
        .from('addresses')
        .insert({ ...addr, user_id: user.id })
        .select().single()
      if (addrErr) throw addrErr

      // 2. Create order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          address_id: address.id,
          subtotal, shipping: shipCost,
          discount: 0, total,
          status: 'confirmed',
          payment_status: payment === 'simulation' ? 'paid' : 'pending',
          payment_method: payment,
          delivery_method: delivery,
        })
        .select().single()
      if (orderErr) throw orderErr

      // 3. Create order items
      const orderItems = items.map(item => ({
        order_id:      order.id,
        product_id:    item.product?.id,
        vendor_id:     item.product?.vendor_id ?? null,
        product_name:  item.product?.name,
        product_image: item.product?.image_url,
        quantity:      item.quantity,
        unit_price:    item.product?.price,
        total_price:   (item.product?.price ?? 0) * item.quantity,
      }))
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
      if (itemsErr) throw itemsErr

      await clearCart()
      toast.success('🎉 Commande confirmée !')
      navigate(`/commandes/${order.id}`)
    } catch (err) {
      toast.error('Erreur : ' + (err.message || 'Veuillez réessayer'))
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) { navigate('/panier'); return null }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i === 0 ? 'bg-emerald-500 text-white' :
              i <= 2  ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i === 0 ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-semibold ${i <= 2 ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < 2 ? 'bg-blue-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={placeOrder}>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Address */}
            <div className="card p-6">
              <h2 className="section-title">📍 Adresse de livraison</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nom complet *</label>
                  <input name="full_name" value={addr.full_name} onChange={handleAddr} required className="input" placeholder="Marie Dupont" />
                </div>
                <div className="col-span-2">
                  <label className="label">Adresse *</label>
                  <input name="street" value={addr.street} onChange={handleAddr} required className="input" placeholder="Rue Andrianaivoravelona, Lot II" />
                </div>
                <div>
                  <label className="label">Ville *</label>
                  <input name="city" value={addr.city} onChange={handleAddr} required className="input" placeholder="Antananarivo" />
                </div>
                <div>
                  <label className="label">Code postal</label>
                  <input name="zip" value={addr.zip} onChange={handleAddr} className="input" placeholder="101" />
                </div>
                <div>
                  <label className="label">Pays</label>
                  <input name="country" value={addr.country} onChange={handleAddr} className="input" />
                </div>
                <div>
                  <label className="label">Téléphone *</label>
                  <input name="phone" value={addr.phone} onChange={handleAddr} required className="input" placeholder="+261 34 00 000 00" />
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="card p-6">
              <h2 className="section-title">🚚 Mode de livraison</h2>
              <div className="space-y-3">
                {DELIVERY.map(d => (
                  <label key={d.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    delivery === d.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="delivery" value={d.id} checked={delivery === d.id}
                      onChange={() => setDelivery(d.id)} className="accent-blue-600" />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-900">{d.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{d.sub}</div>
                    </div>
                    <span className={`font-bold text-sm ${d.price === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {d.price === 0 ? 'Gratuit' : fmtPrice(d.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="section-title">💳 Mode de paiement</h2>
              <div className="space-y-3">
                {PAYMENT.map(p => (
                  <label key={p.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    payment === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="payment" value={p.id} checked={payment === p.id}
                      onChange={() => setPayment(p.id)} className="accent-blue-600" />
                    <div>
                      <div className="font-bold text-sm text-gray-900">{p.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              {payment === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <label className="label">Numéro de carte</label>
                    <input className="input" placeholder="4242 4242 4242 4242" maxLength={19}
                      onChange={e => { let v=e.target.value.replace(/\D/g,'').substring(0,16); e.target.value=v.replace(/(.{4})/g,'$1 ').trim() }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Expiration</label>
                      <input className="input" placeholder="MM/AA" maxLength={5} />
                    </div>
                    <div>
                      <label className="label">CVV</label>
                      <input className="input" placeholder="•••" maxLength={4} type="password" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Nom sur la carte</label>
                    <input className="input" placeholder="MARIE DUPONT" />
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-lg p-2.5 text-xs font-semibold">
                    <Lock size={14} /> Paiement 256-bit SSL · Conforme PCI DSS
                  </div>
                </div>
              )}

              {payment === 'mobile' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex gap-2">
                    {['📱 MVola', '🟠 Orange Money', '🔴 Airtel Money'].map(op => (
                      <button key={op} type="button"
                        className="px-3 py-1.5 text-xs font-bold border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all">
                        {op}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="label">Numéro de téléphone</label>
                    <input className="input" placeholder="+261 34 00 000 00" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card p-6 sticky top-20">
              <h2 className="section-title">Récapitulatif</h2>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
                      {item.product?.image_url
                        ? <img src={item.product.image_url} className="w-full h-full object-cover" alt="" />
                        : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {fmtPrice((item.product?.price ?? 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Sous-total</span><span>{fmtPrice(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span className={shipCost === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {shipCost === 0 ? 'Gratuite' : fmtPrice(shipCost)}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-extrabold text-lg text-gray-900">
                <span>Total</span><span>{fmtPrice(total)}</span>
              </div>

              <button type="submit" disabled={loading} className="btn btn-success btn-block py-4 justify-center mt-5 text-base">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Traitement…</>
                ) : (
                  <><CheckCircle size={19} /> Confirmer — {fmtPrice(total)}</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                <Lock size={11} /> Paiement sécurisé · Données chiffrées
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
