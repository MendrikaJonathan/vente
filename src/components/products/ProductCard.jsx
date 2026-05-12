import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Stars } from '../ui'
import { useCart } from '../../context/CartContext'

const CAT_BG = {
  electronique:'#e0eaff', mode:'#ffe0f0', maison:'#e0ffe8',
  livres:'#fffbe0', sport:'#fff0e0', gaming:'#e0e8ff',
  beaute:'#fde8ff', alimentation:'#e8fff0'
}
const CAT_ICONS = {
  electronique:'📱', mode:'👗', maison:'🏠', livres:'📚',
  sport:'⚽', gaming:'🎮', beaute:'💄', alimentation:'🥗'
}

export function catBg(cat)   { return CAT_BG[cat]   || '#f0f4f8' }
export function catIcon(cat) { return CAT_ICONS[cat] || '📦' }
export function fmtPrice(n)  { return Number(n).toLocaleString('fr-FR') + ' Ar' }

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const inStock  = (product.stock ?? 0) > 0
  const discount = product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100) : 0

  return (
    <div className="card-hover flex flex-col group">
      <Link to={`/produit/${product.id}`} className="block relative overflow-hidden rounded-t-2xl aspect-square">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
            />
          : null}
        <div
          className="w-full h-full flex items-center justify-center text-5xl"
          style={{ background: catBg(product.categories?.slug), display: product.image_url ? 'none' : 'flex' }}
        >
          {catIcon(product.categories?.slug)}
        </div>
        {discount > 0 && (
          <span className="absolute top-2 left-2 badge badge-red text-white bg-red-500">−{discount}%</span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">Rupture de stock</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <p className="text-xs text-gray-400 font-medium">{product.vendors?.shop_name}</p>
        <Link to={`/produit/${product.id}`}>
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <Stars rating={product.rating ?? 0} count={product.review_count} />
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-blue-700 font-extrabold text-lg">{fmtPrice(product.price)}</span>
          {discount > 0 && (
            <span className="text-gray-400 text-xs line-through">{fmtPrice(product.compare_price)}</span>
          )}
        </div>
        <button
          onClick={() => addToCart(product.id)}
          disabled={!inStock}
          className="btn btn-primary btn-sm w-full justify-center mt-1"
        >
          <ShoppingCart size={14} />
          {inStock ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    </div>
  )
}
