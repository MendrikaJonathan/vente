import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/products/ProductCard'
import { Empty } from '../components/ui'

const CATEGORIES = [
  { name:'Toutes', slug:'' },
  { name:'📱 Électronique', slug:'electronique' },
  { name:'👗 Mode', slug:'mode' },
  { name:'🏠 Maison', slug:'maison' },
  { name:'📚 Livres', slug:'livres' },
  { name:'⚽ Sport', slug:'sport' },
  { name:'🎮 Gaming', slug:'gaming' },
  { name:'💄 Beauté', slug:'beaute' },
  { name:'🥗 Alimentation', slug:'alimentation' },
]
const SORTS = [
  { label:'Pertinence', val:'' },
  { label:'Prix ↑', val:'price_asc' },
  { label:'Prix ↓', val:'price_desc' },
  { label:'Nouveautés', val:'newest' },
  { label:'Meilleures notes', val:'rating' },
]

export default function CataloguePage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showFilter, setShowFilter] = useState(false)

  const q    = params.get('q')   || ''
  const cat  = params.get('cat') || ''
  const sort = params.get('sort')|| ''

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, vendors(shop_name), categories(name,slug)')
      .eq('status', 'published')

    if (q)   query = query.ilike('name', `%${q}%`)
    if (cat) query = query.eq('categories.slug', cat)

    if (sort === 'price_asc')  query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else if (sort === 'rating')     query = query.order('rating', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (!error) setProducts(data || [])
    setLoading(false)
  }, [q, cat, sort])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const setParam = (key, val) => setParams(p => {
    const n = new URLSearchParams(p)
    val ? n.set(key, val) : n.delete(key)
    return n
  })

  const FilterSidebar = () => (
    <div className="card p-5 space-y-5">
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Catégorie</h3>
        <div className="space-y-0.5">
          {CATEGORIES.map(c => (
            <button key={c.slug} onClick={() => { setParam('cat', c.slug); setShowFilter(false) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                cat === c.slug ? 'bg-[#0f2544] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Trier par</h3>
        <div className="space-y-0.5">
          {SORTS.map(s => (
            <button key={s.val} onClick={() => setParam('sort', s.val)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                sort === s.val ? 'bg-[#0f2544] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {(q || cat || sort) && (
        <button onClick={() => setParams({})}
          className="btn btn-ghost btn-sm w-full justify-center text-red-500">
          <X size={14} /> Réinitialiser les filtres
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {q ? `Résultats pour "${q}"` : cat ? `${cat}` : 'Tous les produits'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Chargement…' : `${products.length} produit${products.length !== 1 ? 's' : ''} trouvé${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className="btn btn-outline btn-sm md:hidden">
          <SlidersHorizontal size={15} /> Filtres
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20"><FilterSidebar /></div>
        </aside>

        {/* Mobile filter */}
        {showFilter && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setShowFilter(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">Filtres</span>
                <button onClick={() => setShowFilter(false)}><X size={20} /></button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_,i) => <div key={i} className="card animate-pulse h-72 bg-gray-100" />)}
            </div>
          ) : products.length === 0 ? (
            <Empty icon="🔍" title="Aucun produit trouvé" sub="Essayez d'autres termes de recherche ou filtres." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
