import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fmtPrice } from '../../components/products/ProductCard'
import { LoadingPage, Empty } from '../../components/ui'
import toast from 'react-hot-toast'

const STATUS_CLS = { published:'badge-green', draft:'badge-orange', archived:'badge-gray' }
const STATUS_LBL = { published:'Publié', draft:'Brouillon', archived:'Archivé' }

export default function VendorProducts() {
  const { vendor }  = useAuth()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    if (!vendor) return
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [vendor])

  const deleteProduct = async (id) => {
    if (!confirm('Supprimer ce produit définitivement ?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error('Erreur : ' + error.message)
    else { toast.success('Produit supprimé'); load() }
  }

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', product.id)
    if (error) toast.error(error.message)
    else { toast.success(newStatus === 'published' ? '✅ Produit publié' : '📝 Mis en brouillon'); load() }
  }

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Mes Produits ({products.length})</h1>
        <Link to="/vendor/produits/nouveau" className="btn btn-accent">
          <Plus size={17} /> Nouveau produit
        </Link>
      </div>

      {products.length === 0 ? (
        <Empty icon="📦" title="Vous n'avez aucun produit"
          sub="Ajoutez votre premier produit pour commencer à vendre !"
          action={<Link to="/vendor/produits/nouveau" className="btn btn-accent btn-lg">➕ Ajouter un produit</Link>} />
      ) : (
        <div className="table-wrap">
          {/* Header */}
          <div className="table-head">
            <div className="grid gap-3 text-[10px] font-bold text-blue-200 uppercase tracking-widest"
              style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.2fr' }}>
              <span>Produit</span><span>Catégorie</span><span>Prix</span><span>Stock</span><span>Statut</span><span>Actions</span>
            </div>
          </div>

          {products.map((p, i) => (
            <div key={p.id} className={`table-row grid gap-3 items-center ${i%2===1?'bg-gray-50':''}`}
              style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.2fr' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-lg">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : '📦'}
                </div>
                <span className="font-bold text-gray-800 truncate text-sm">{p.name}</span>
              </div>
              <span className="text-gray-500 text-sm">{p.categories?.name || '—'}</span>
              <span className="font-bold text-blue-700 text-sm">{fmtPrice(p.price)}</span>
              <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-orange-500' : 'text-gray-700'}`}>
                {p.stock}
              </span>
              <div>
                <button onClick={() => toggleStatus(p)}
                  className={`badge cursor-pointer ${STATUS_CLS[p.status]}`}>
                  {STATUS_LBL[p.status]}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <Link to={`/produit/${p.id}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all" title="Voir">
                  <Eye size={15} />
                </Link>
                <Link to={`/vendor/produits/${p.id}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all" title="Modifier">
                  <Pencil size={15} />
                </Link>
                <button onClick={() => deleteProduct(p.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all" title="Supprimer">
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
