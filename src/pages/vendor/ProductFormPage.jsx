import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Upload, X, ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { LoadingPage } from '../../components/ui'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { slug:'electronique', label:'📱 Électronique' },
  { slug:'mode',         label:'👗 Mode' },
  { slug:'maison',       label:'🏠 Maison' },
  { slug:'livres',       label:'📚 Livres' },
  { slug:'sport',        label:'⚽ Sport' },
  { slug:'gaming',       label:'🎮 Gaming' },
  { slug:'beaute',       label:'💄 Beauté' },
  { slug:'alimentation', label:'🥗 Alimentation' },
]

const EMPTY_FORM = {
  name:'', description:'', price:'', compare_price:'',
  stock:'', sku:'', status:'published', category_id:'', image_url:''
}

export default function ProductFormPage() {
  const { id }            = useParams()
  const { vendor }        = useAuth()
  const navigate          = useNavigate()
  const isEdit            = Boolean(id)

  const [form,      setForm]      = useState(EMPTY_FORM)
  const [cats,      setCats]      = useState([])
  const [loading,   setLoading]   = useState(isEdit)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState('')

  /* Load categories */
  useEffect(() => {
    supabase.from('categories').select('id,name,slug').then(({ data }) => setCats(data || []))
  }, [])

  /* Load product for edit */
  useEffect(() => {
    if (!isEdit) return
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error('Produit introuvable'); navigate('/vendor/produits'); return }
        setForm({
          name:          data.name || '',
          description:   data.description || '',
          price:         data.price?.toString() || '',
          compare_price: data.compare_price?.toString() || '',
          stock:         data.stock?.toString() || '',
          sku:           data.sku || '',
          status:        data.status || 'published',
          category_id:   data.category_id || '',
          image_url:     data.image_url || '',
        })
        setPreview(data.image_url || '')
        setLoading(false)
      })
  }, [id, isEdit, navigate])

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  /* Upload image to Supabase Storage */
  const uploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop grande (max 5 Mo)'); return }
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${vendor.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('products').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: publicUrl }))
      setPreview(publicUrl)
      toast.success('Image uploadée !')
    } catch (err) {
      toast.error('Erreur upload : ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setForm(f => ({ ...f, image_url: '' }))
    setPreview('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!vendor) return
    if (!form.name.trim())  { toast.error('Le nom est obligatoire'); return }
    if (!form.price)        { toast.error('Le prix est obligatoire'); return }
    if (parseFloat(form.price) <= 0) { toast.error('Le prix doit être supérieur à 0'); return }
    if (!form.category_id)  { toast.error('La catégorie est obligatoire'); return }

    setSaving(true)
    const payload = {
      vendor_id:     vendor.id,
      name:          form.name.trim(),
      description:   form.description.trim(),
      price:         parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      stock:         parseInt(form.stock) || 0,
      sku:           form.sku.trim() || null,
      status:        form.status,
      category_id:   form.category_id || null,
      image_url:     form.image_url || null,
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from('products').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase.from('products').insert(payload))
    }

    if (error) {
      toast.error('Erreur : ' + error.message)
    } else {
      toast.success(isEdit ? '✅ Produit mis à jour !' : '✅ Produit créé !')
      navigate('/vendor/produits')
    }
    setSaving(false)
  }

  if (loading) return <LoadingPage />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/vendor/produits" className="inline-flex items-center gap-1 text-blue-600 text-sm mb-6 hover:underline">
        <ChevronLeft size={16} /> Mes produits
      </Link>
      <h1 className="page-title">{isEdit ? '✏️ Modifier le produit' : '➕ Nouveau produit'}</h1>

      <form onSubmit={submit}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Left: infos ── */}
          <div className="space-y-5">
            <div className="card p-6 space-y-4">
              <h2 className="section-title">Informations du produit</h2>

              <div>
                <label className="label">Nom du produit *</label>
                <input name="name" value={form.name} onChange={handle} required
                  className="input" placeholder="Ex : Chemise en coton bleu marine" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea name="description" value={form.description} onChange={handle}
                  className="input" rows={4} placeholder="Décrivez votre produit en détail…" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prix (Ar) *</label>
                  <input name="price" type="number" min="0" step="1" value={form.price} onChange={handle}
                    required className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">Prix barré (Ar)</label>
                  <input name="compare_price" type="number" min="0" step="1" value={form.compare_price} onChange={handle}
                    className="input" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stock *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handle}
                    required className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">SKU / Référence</label>
                  <input name="sku" value={form.sku} onChange={handle}
                    className="input" placeholder="REF-001" />
                </div>
              </div>

              <div>
                <label className="label">Catégorie *</label>
                <select name="category_id" value={form.category_id} onChange={handle} required className="select">
                  <option value="">Sélectionner une catégorie…</option>
                  {cats.map(c => (
                    <option key={c.id} value={c.id}>
                      {CATEGORIES.find(x => x.slug === c.slug)?.label ?? c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Statut de publication</label>
                <div className="flex gap-3">
                  {[
                    { val:'published', label:'✅ Publié',   cls:'border-emerald-400 bg-emerald-50 text-emerald-700' },
                    { val:'draft',     label:'📝 Brouillon', cls:'border-amber-400 bg-amber-50 text-amber-700' },
                  ].map(({ val, label, cls }) => (
                    <label key={val} className={`flex-1 text-center py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                      form.status === val ? cls : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="status" value={val} checked={form.status === val}
                        onChange={handle} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="btn btn-success flex-1 py-3 justify-center">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                ) : (
                  isEdit ? '✅ Mettre à jour' : '✅ Publier le produit'
                )}
              </button>
              <Link to="/vendor/produits" className="btn btn-ghost px-5">Annuler</Link>
            </div>
          </div>

          {/* ── Right: image ── */}
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="section-title">🖼️ Image du produit</h2>

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden aspect-square mb-4 border border-gray-100">
                  <img src={preview} alt="Aperçu"
                    className="w-full h-full object-cover"
                    onError={() => setPreview('')} />
                  <button type="button" onClick={removeImage}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-lg hover:bg-red-50 transition-all">
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <label className={`block border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all mb-4 ${
                  uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}>
                  <input type="file" accept="image/*" onChange={uploadImage} className="sr-only" disabled={uploading} />
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3" style={{borderWidth:3}} />
                      <p className="text-blue-600 font-semibold text-sm">Upload en cours…</p>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-400 mb-3" />
                      <p className="text-gray-600 font-semibold text-sm">Cliquer ou glisser une image</p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG — max 5 Mo</p>
                    </>
                  )}
                </label>
              )}

              <div>
                <label className="label">Ou coller une URL</label>
                <input name="image_url" value={form.image_url} onChange={e => {
                  handle(e); setPreview(e.target.value)
                }} className="input" placeholder="https://exemple.com/image.jpg" />
              </div>
            </div>

            {/* Tips */}
            <div className="card p-6 bg-blue-50 border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3">💡 Conseils vendeur</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>✅ Titre précis incluant la marque et le modèle</li>
                <li>✅ Photos de qualité sur fond blanc</li>
                <li>✅ Mentionnez les dimensions, matières, couleurs</li>
                <li>✅ Prix compétitif par rapport au marché</li>
                <li>✅ Stock à jour pour éviter les ruptures</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
