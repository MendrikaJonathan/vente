import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#0f2544] text-blue-200/70 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🛒</span>
            <span className="text-white font-bold text-lg">Shop<span className="text-amber-400">Hub</span></span>
          </div>
          <p className="text-sm leading-relaxed">Marketplace multi-vendeurs Madagascar. Achetez, vendez, prospérez.</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
            <li><Link to="/catalogue" className="hover:text-white transition-colors">Catalogue</Link></li>
            <li><Link to="/panier" className="hover:text-white transition-colors">Panier</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Vendeurs</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/register" className="hover:text-white transition-colors">Devenir vendeur</Link></li>
            <li><Link to="/vendor" className="hover:text-white transition-colors">Mon dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Contact</h4>
          <p className="text-sm">📧 support@shophub.mg</p>
          <p className="text-sm mt-1">📍 Antananarivo, Madagascar</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} ShopHub — Plateforme E-commerce Multi-Vendeurs
      </div>
    </footer>
  )
}
