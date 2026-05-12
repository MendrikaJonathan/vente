import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage, Empty } from '../../components/ui'
import toast from 'react-hot-toast'

const STATUS_CLS = { published:'badge-green', draft:'badge-orange', archived:'badge-gray' }
const STATUS_LBL = { published:'Publié', draft:'Brouillon', archived:'Archivé' }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [q,        setQ]        = useState('')
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, vendors(shop_name), categories(name)')
      .order('created_at', { ascending:false })
    if (!error) setProducts(data||[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const deleteProduct = async (id) => {
    if (!confirm('Supprimer définitivement ce produit ?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Produit supprimé'); load() }
  }

  const toggleStatus = async (p) => {
    const status = p.status === 'published' ? 'archived' : 'published'
    const { error } = await supabase.from('products').update({ status }).eq('id', p.id)
    if (error) toast.error(error.message)
    else { toast.success('Statut mis à jour'); load() }
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(q.toLowerCase()) ||
    p.vendors?.shop_name?.toLowerCase().includes(q.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="page-title mb-0">Tous les Produits ({products.length})</h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher…" className="input pl-9 w-56" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="📦" title="Aucun produit" sub="Les vendeurs n'ont pas encore ajouté de produits." />
      ) : (
        <div className="table-wrap">
          <div className="table-head">
            <div className="grid gap-3" style={{ gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr' }}>
              {['Produit','Vendeur','Prix','Stock','Statut','Actions'].map(h => (
                <span key={h} className="table-cell">{h}</span>
              ))}
            </div>
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} className={`table-row grid gap-3 items-center ${i%2===1?'bg-gray-50':''}`}
              style={{ gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr' }}>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-base">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : '📦'}
                </div>
                <span className="font-bold text-gray-800 text-sm truncate">{p.name}</span>
              </div>
              <span className="text-gray-500 text-sm truncate">{p.vendors?.shop_name ?? '—'}</span>
              <span className="font-bold text-blue-700 text-sm">{fmtPrice(p.price)}</span>
              <span className={`text-sm font-bold ${p.stock===0?'text-red-500':p.stock<5?'text-orange-500':'text-gray-700'}`}>{p.stock}</span>
              <button onClick={() => toggleStatus(p)} className={`badge cursor-pointer ${STATUS_CLS[p.status]}`}>
                {STATUS_LBL[p.status]}
              </button>
              <div className="flex gap-1">
                <Link to={`/produit/${p.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all">
                  <Eye size={15} />
                </Link>
                <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
