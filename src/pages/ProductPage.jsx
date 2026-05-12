import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ShoppingCart, Zap, Package, Shield, RotateCcw, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Stars, LoadingPage } from '../components/ui'
import { fmtPrice, catBg, catIcon } from '../components/products/ProductCard'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { id }        = useParams()
  const { addToCart } = useCart()
  const { user }      = useAuth()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [qty,     setQty]     = useState(1)
  const [imgIdx,  setImgIdx]  = useState(0)
  const [loading, setLoading] = useState(true)
  const [review,  setReview]  = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('products')
        .select('*, vendors(*), categories(name,slug)')
        .eq('id', id).single(),
      supabase.from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
    ]).then(([{ data: p, error: pe }, { data: r }]) => {
      if (!pe) setProduct(p)
      setReviews(r || [])
      setLoading(false)
    })
  }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Connectez-vous pour laisser un avis'); return }
    setSubmitting(true)
    const { error } = await supabase.from('reviews').upsert({
      user_id: user.id, product_id: id, rating: review.rating, comment: review.comment
    }, { onConflict: 'user_id,product_id' })
    if (error) toast.error('Erreur : ' + error.message)
    else {
      toast.success('Avis publié !')
      setReview({ rating: 5, comment: '' })
      const { data: r } = await supabase.from('reviews').select('*, profiles(full_name)').eq('product_id', id).order('created_at', { ascending: false })
      setReviews(r || [])
    }
    setSubmitting(false)
  }

  if (loading) return <LoadingPage />
  if (!product) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-gray-500">Produit introuvable.</p>
      <Link to="/catalogue" className="btn btn-primary mt-4">Retour au catalogue</Link>
    </div>
  )

  const images  = [product.image_url, ...(product.images || [])].filter(Boolean)
  const inStock = product.stock > 0
  const disc    = product.compare_price > product.price ? Math.round((1 - product.price / product.compare_price) * 100) : 0
  const catSlug = product.categories?.slug

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/catalogue" className="inline-flex items-center gap-1 text-blue-600 text-sm mb-6 hover:underline">
        <ChevronLeft size={16} /> Retour au catalogue
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="rounded-2xl overflow-hidden border border-gray-100 aspect-square flex items-center justify-center"
            style={{ background: catBg(catSlug) }}>
            {images[imgIdx]
              ? <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
              : <span className="text-8xl">{catIcon(catSlug)}</span>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-blue-500' : 'border-gray-200'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-500 mb-2">
            {product.categories?.name} · <span className="text-blue-600 font-medium">{product.vendors?.shop_name}</span>
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Stars rating={product.rating ?? 0} count={product.review_count} size="md" />
            <span className="text-gray-400 text-sm">{product.total_sold ?? 0} vendus</span>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-extrabold text-blue-700">{fmtPrice(product.price)}</span>
            {disc > 0 && <>
              <span className="text-gray-400 text-lg line-through">{fmtPrice(product.compare_price)}</span>
              <span className="badge badge-red">−{disc}%</span>
            </>}
          </div>

          <p className={`text-sm font-semibold mb-4 ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
            <Package size={15} className="inline mr-1" />
            {inStock ? `En stock (${product.stock} disponibles)` : 'Rupture de stock'}
          </p>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-5">{product.description}</p>
          )}

          {inStock && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm font-semibold text-gray-700">Quantité :</span>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => addToCart(product.id, qty)} disabled={!inStock} className="btn btn-primary py-3 justify-center">
              <ShoppingCart size={17} /> Ajouter au panier
            </button>
            <button onClick={() => { addToCart(product.id, qty); window.location.href = '/checkout' }}
              disabled={!inStock} className="btn btn-accent py-3 justify-center">
              <Zap size={17} /> Acheter maintenant
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🚚', title: 'Livraison gratuite', sub: 'dès 50 000 Ar' },
              { icon: '🔄', title: 'Retour 30 jours', sub: 'Satisfait ou remboursé' },
              { icon: '🔒', title: 'Paiement sécurisé', sub: 'SSL + 3D Secure' },
              { icon: '✅', title: 'Vendeur vérifié', sub: 'ShopHub Partner' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-800">{title}</div>
                  <div className="text-xs text-gray-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Avis clients ({reviews.length})</h2>
        {user && (
          <form onSubmit={submitReview} className="card p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Laisser un avis</h3>
            <div className="flex items-center gap-2 mb-3">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setReview(r => ({ ...r, rating: n }))}>
                  <Star size={24} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
                </button>
              ))}
            </div>
            <textarea value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
              className="input mb-3" rows={3} placeholder="Partagez votre expérience avec ce produit…" />
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Publication…' : 'Publier l\'avis'}
            </button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun avis pour ce produit. Soyez le premier !</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {r.profiles?.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{r.profiles?.full_name ?? 'Anonyme'}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
