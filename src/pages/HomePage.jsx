import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, TrendingUp, Store } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/products/ProductCard'
import { Empty, LoadingPage } from '../components/ui'

const CATEGORIES = [
  { name:'Électronique', slug:'electronique', icon:'📱', bg:'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
  { name:'Mode',         slug:'mode',         icon:'👗', bg:'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { name:'Maison',       slug:'maison',       icon:'🏠', bg:'linear-gradient(135deg,#15803d,#22c55e)' },
  { name:'Livres',       slug:'livres',       icon:'📚', bg:'linear-gradient(135deg,#b45309,#f59e0b)' },
  { name:'Sport',        slug:'sport',        icon:'⚽', bg:'linear-gradient(135deg,#b91c1c,#ef4444)' },
  { name:'Gaming',       slug:'gaming',       icon:'🎮', bg:'linear-gradient(135deg,#0e7490,#06b6d4)' },
  { name:'Beauté',       slug:'beaute',       icon:'💄', bg:'linear-gradient(135deg,#9d174d,#ec4899)' },
  { name:'Alimentation', slug:'alimentation', icon:'🥗', bg:'linear-gradient(135deg,#065f46,#10b981)' },
]

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q, setQ] = useState('')
  const navigate  = useNavigate()

  useEffect(() => {
    supabase
      .from('products')
      .select('*, vendors(shop_name), categories(name,slug)')
      .eq('status', 'published')
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (!error) setProducts(data || [])
        setLoading(false)
      })
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/catalogue?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#09182e] via-[#0f2f60] to-[#1a1a50] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(59,130,246,0.13),transparent)]" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-4 py-1.5 text-xs text-blue-200/80 font-semibold mb-5 tracking-wider">
            🌟 MARKETPLACE N°1 À MADAGASCAR
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
            Achetez & Vendez<br/>sur <span className="text-amber-400">ShopHub</span>
          </h1>
          <p className="text-blue-200/65 text-lg mb-8 leading-relaxed">
            Des milliers de produits, des centaines de vendeurs — tout en un seul endroit sécurisé.
          </p>
          <form onSubmit={handleSearch} className="flex bg-white rounded-2xl max-w-xl mx-auto mb-7 shadow-2xl overflow-hidden">
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Que cherchez-vous aujourd'hui ?"
              className="flex-1 px-5 py-4 text-gray-800 text-base outline-none font-medium" />
            <button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-7 font-bold text-lg hover:opacity-90 transition-opacity">
              🔍
            </button>
          </form>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/catalogue" className="btn btn-outline bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/40">
              Explorer les produits
            </Link>
            <Link to="/register?role=vendor" className="btn btn-accent">
              Devenir vendeur →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-[#0f2544] py-4">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[['12 500+','Produits'],['840+','Vendeurs actifs'],['50 000+','Clients'],['4,8 ★','Note moyenne']].map(([n,l]) => (
            <div key={l}><div className="text-amber-400 font-extrabold text-xl">{n}</div><div className="text-blue-200/55 text-xs mt-0.5">{l}</div></div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">🗂️ Catégories</h2>
          <Link to="/catalogue" className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} to={`/catalogue?cat=${cat.slug}`}
              className="flex flex-col items-center p-4 rounded-2xl text-white text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
              style={{ background: cat.bg }}>
              <span className="text-3xl mb-2">{cat.icon}</span>
              <span className="text-xs font-bold leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-orange-500" size={24} /> Produits récents
          </h2>
          <Link to="/catalogue" className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i) => (
              <div key={i} className="card animate-pulse h-72 bg-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Empty
            icon="🏪"
            title="Aucun produit pour le moment"
            sub="Les vendeurs n'ont pas encore ajouté de produits. Soyez le premier !"
            action={<Link to="/register?role=vendor" className="btn btn-accent btn-lg">Devenir le premier vendeur</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 py-14 px-4 text-center">
        <Store className="mx-auto text-white/80 mb-3" size={36} />
        <h2 className="text-2xl font-extrabold text-white mb-2">Vendez sur ShopHub</h2>
        <p className="text-orange-100 mb-7 text-base max-w-md mx-auto">
          Rejoignez 840+ vendeurs actifs et commencez à vendre vos produits dès aujourd'hui. C'est 100% gratuit !
        </p>
        <Link to="/register?role=vendor" className="btn btn-primary btn-lg">
          Créer ma boutique gratuitement
        </Link>
      </section>
    </div>
  )
}
