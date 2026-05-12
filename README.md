# 🛒 ShopHub — Marketplace Multi-Vendeurs

> React 18 + Tailwind CSS + Supabase + Vercel

---

## 🚀 Déploiement sur Vercel (ce soir)

### Étape 1 — Configurer Supabase

1. Allez sur **[supabase.com](https://supabase.com)** → New Project
2. **Settings → API** → copiez :
   - `Project URL`
   - `anon public key`
3. **SQL Editor** → New query → collez le contenu de `supabase/migrations/001_schema.sql` → **Run**
4. **Storage** → vérifiez que le bucket `products` est créé (public)

### Étape 2 — Pousser sur GitHub

```bash
git init
git add .
git commit -m "feat: ShopHub initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/shophub.git
git push -u origin main
```

### Étape 3 — Déployer sur Vercel

1. Allez sur **[vercel.com](https://vercel.com)** → New Project
2. Importez votre repo GitHub `shophub`
3. **Framework Preset** → Vite (détecté automatiquement)
4. **Environment Variables** → Ajoutez :

| Clé | Valeur |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

5. Cliquez **Deploy** → ✅ En ligne en ~2 minutes !

---

## 💻 Développement local

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer
npm run dev
# → http://localhost:5173
```

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **Client** | Catalogue, panier, commandes, profil |
| **Vendeur** | + Dashboard, CRUD produits, commandes reçues |
| **Admin** | + Panel admin complet |

> Pour créer un admin : dans Supabase → Table `profiles` → changer `role` en `admin`

---

## 📁 Structure

```
shophub/
├── src/
│   ├── components/
│   │   ├── layout/     # Navbar, Footer
│   │   ├── products/   # ProductCard
│   │   └── ui/         # Spinner, Stars, Empty
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── lib/supabase.js
│   ├── pages/
│   │   ├── auth/       # Login, Register
│   │   ├── client/     # Cart, Checkout, Orders, Profile
│   │   ├── vendor/     # Dashboard, Products, Orders
│   │   └── admin/      # Dashboard, Users, Products, Orders
│   └── App.jsx
├── supabase/migrations/001_schema.sql
├── vercel.json
└── .env.example
```
