import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider }          from './context/CartContext'
import Navbar   from './components/layout/Navbar'
import Footer   from './components/layout/Footer'
import { LoadingPage } from './components/ui'

// Pages publiques
import HomePage      from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ProductPage   from './pages/ProductPage'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Client
import CartPage        from './pages/client/CartPage'
import CheckoutPage    from './pages/client/CheckoutPage'
import OrdersPage      from './pages/client/OrdersPage'
import OrderDetailPage from './pages/client/OrderDetailPage'
import ProfilePage     from './pages/client/ProfilePage'

// Vendor
import VendorDashboard  from './pages/vendor/DashboardPage'
import VendorProducts   from './pages/vendor/ProductsPage'
import ProductFormPage  from './pages/vendor/ProductFormPage'
import VendorOrders     from './pages/vendor/OrdersPage'
import VendorSetup      from './pages/vendor/SetupPage'

// Admin
import AdminDashboard from './pages/admin/DashboardPage'
import AdminUsers     from './pages/admin/UsersPage'
import AdminProducts  from './pages/admin/ProductsPage'
import AdminOrders    from './pages/admin/OrdersPage'

// ── Guard ──────────────────────────────────────────────────────
function Guard({ children, roles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile?.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/catalogue"   element={<CataloguePage />} />
          <Route path="/produit/:id" element={<ProductPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />

          {/* Client */}
          <Route path="/panier"       element={<Guard><CartPage /></Guard>} />
          <Route path="/checkout"     element={<Guard><CheckoutPage /></Guard>} />
          <Route path="/commandes"    element={<Guard><OrdersPage /></Guard>} />
          <Route path="/commandes/:id" element={<Guard><OrderDetailPage /></Guard>} />
          <Route path="/profil"       element={<Guard><ProfilePage /></Guard>} />

          {/* Vendor */}
          <Route path="/vendor/setup"    element={<Guard roles={['vendor']}><VendorSetup /></Guard>} />
          <Route path="/vendor"          element={<Guard roles={['vendor']}><VendorDashboard /></Guard>} />
          <Route path="/vendor/produits" element={<Guard roles={['vendor']}><VendorProducts /></Guard>} />
          <Route path="/vendor/produits/nouveau" element={<Guard roles={['vendor']}><ProductFormPage /></Guard>} />
          <Route path="/vendor/produits/:id"     element={<Guard roles={['vendor']}><ProductFormPage /></Guard>} />
          <Route path="/vendor/commandes"        element={<Guard roles={['vendor']}><VendorOrders /></Guard>} />

          {/* Admin */}
          <Route path="/admin"           element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
          <Route path="/admin/users"     element={<Guard roles={['admin']}><AdminUsers /></Guard>} />
          <Route path="/admin/produits"  element={<Guard roles={['admin']}><AdminProducts /></Guard>} />
          <Route path="/admin/commandes" element={<Guard roles={['admin']}><AdminOrders /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}
