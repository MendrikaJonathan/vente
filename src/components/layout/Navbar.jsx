import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search, Menu, X, LogOut, LayoutDashboard, Package, ShoppingBag, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, isVendor, isAdmin, signOut } = useAuth()
  const { itemsCount } = useCart()
  const navigate   = useNavigate()
  const [q, setQ]  = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) { navigate(`/catalogue?q=${encodeURIComponent(q.trim())}`); setMobileOpen(false) }
  }

  const handleLogout = async () => {
    await signOut()
    setDropOpen(false)
    toast.success('Déconnecté avec succès')
    navigate('/')
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Compte'
  const initials  = profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() ?? 'U'

  return (
    <nav className="sticky top-0 z-50 bg-[#0f2544] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center text-lg">🛒</div>
          <span className="text-white font-bold text-xl hidden sm:block">Shop<span className="text-amber-400">Hub</span></span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="flex w-full bg-white/10 border border-white/20 rounded-xl overflow-hidden focus-within:bg-white/20 transition-all">
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="flex-1 px-4 py-2.5 text-sm bg-transparent text-white placeholder-blue-200/60 outline-none"
            />
            <button type="submit" className="px-4 text-blue-200/60 hover:text-white transition-colors">
              <Search size={17} />
            </button>
          </div>
        </form>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <Link to="/catalogue" className="text-blue-200/75 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium transition-all">Produits</Link>

          {/* Cart */}
          <Link to="/panier" className="relative text-blue-200/75 hover:text-white p-2.5 rounded-lg hover:bg-white/10 transition-all">
            <ShoppingCart size={20} />
            {itemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {itemsCount > 99 ? '99+' : itemsCount}
              </span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 ml-1 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
                <span className="text-white text-sm font-medium">{firstName}</span>
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/commandes" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                      <Package size={15}/> Mes commandes
                    </Link>
                    <Link to="/profil" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                      <User size={15}/> Mon profil
                    </Link>
                    {isVendor && (
                      <Link to="/vendor" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                        <LayoutDashboard size={15}/> Dashboard vendeur
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                        <Settings size={15}/> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                        <LogOut size={15}/> Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/login" className="text-blue-200/75 hover:text-white px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-all">Connexion</Link>
              <Link to="/register" className="btn btn-accent btn-sm">S'inscrire</Link>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2 ml-auto">
          <Link to="/panier" className="relative text-white p-2">
            <ShoppingCart size={22} />
            {itemsCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{itemsCount}</span>}
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-2">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a1a36] border-t border-white/10 px-4 py-4 space-y-1">
          <form onSubmit={handleSearch} className="flex mb-3 bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…"
              className="flex-1 px-3 py-2.5 text-sm bg-transparent text-white placeholder-blue-200/50 outline-none" />
            <button type="submit" className="px-3 text-white"><Search size={17} /></button>
          </form>
          {[['/', 'Accueil'], ['/catalogue', 'Produits'], ['/panier', 'Panier']].map(([to, label]) => (
            <Link key={to} to={to} className="block text-blue-200 py-2.5 text-sm font-medium hover:text-white" onClick={() => setMobileOpen(false)}>{label}</Link>
          ))}
          {user ? (
            <>
              <Link to="/commandes" className="block text-blue-200 py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Mes commandes</Link>
              {isVendor && <Link to="/vendor" className="block text-blue-200 py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Dashboard vendeur</Link>}
              {isAdmin  && <Link to="/admin"  className="block text-blue-200 py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Admin</Link>}
              <button onClick={handleLogout} className="block text-red-400 py-2.5 text-sm font-medium text-left w-full">Déconnexion</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn btn-outline btn-sm flex-1 justify-center" onClick={() => setMobileOpen(false)}>Connexion</Link>
              <Link to="/register" className="btn btn-accent btn-sm flex-1 justify-center" onClick={() => setMobileOpen(false)}>S'inscrire</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
