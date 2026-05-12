import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { fmtPrice } from '../../components/products/ProductCard'
import { Empty } from '../../components/ui'

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, shipping, total, loading } = useCart()
  const navigate = useNavigate()

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <Empty
        icon="🛒"
        title="Votre panier est vide"
        sub="Découvrez nos produits et ajoutez vos favoris !"
        action={<Link to="/catalogue" className="btn btn-primary btn-lg">Explorer les produits</Link>}
      />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="page-title">Mon Panier ({items.reduce((s,i)=>s+i.quantity,0)} articles)</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl">
                {item.product?.image_url
                  ? <img src={item.product.image_url} alt={item.product?.name} className="w-full h-full object-cover" />
                  : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/produit/${item.product?.id}`}
                  className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors line-clamp-2">
                  {item.product?.name}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{item.product?.vendor?.shop_name}</p>
                <p className="text-blue-700 font-bold mt-1">{fmtPrice(item.product?.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-gray-900">{fmtPrice((item.product?.price ?? 0) * item.quantity)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="section-title">Récapitulatif</h2>

          {/* Free shipping progress */}
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            {shipping === 0 ? (
              <p className="text-sm font-bold text-emerald-600">🎉 Livraison gratuite débloquée !</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-1.5">Plus que <strong>{fmtPrice(50 - subtotal)}</strong> pour la livraison gratuite</p>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100,(subtotal/50)*100)}%` }} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between"><span>Sous-total</span><span className="font-semibold text-gray-900">{fmtPrice(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span className={shipping === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-gray-900'}>
                {shipping === 0 ? 'Gratuite 🎉' : fmtPrice(shipping)}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-extrabold text-lg text-gray-900">
            <span>Total TTC</span><span>{fmtPrice(total)}</span>
          </div>

          <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-block py-3.5 mt-5 justify-center">
            Commander <ArrowRight size={18} />
          </button>
          <Link to="/catalogue" className="btn btn-ghost btn-block justify-center mt-2 text-sm">
            ← Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  )
}
