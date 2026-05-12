import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id, quantity,
          product:products (
            id, name, price, image_url, stock,
            vendor:vendors ( shop_name )
          )
        `)
        .eq('user_id', user.id)
      if (error) { console.error('fetchCart:', error.message); return }
      setItems(data || [])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = async (productId, quantity = 1) => {
    if (!user) { toast.error('Connectez-vous pour ajouter au panier'); return }
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: user.id, product_id: productId, quantity },
        { onConflict: 'user_id,product_id' }
      )
    if (error) { toast.error('Erreur : ' + error.message); return }
    toast.success('Ajouté au panier !')
    fetchCart()
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) { await removeItem(itemId); return }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
    if (!error) fetchCart()
  }

  const removeItem = async (itemId) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
    if (!error) fetchCart()
  }

  const clearCart = async () => {
    if (!user) return
    await supabase.from('cart_items').delete().eq('user_id', user.id)
    setItems([])
  }

  const subtotal   = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0)
  const shipping   = subtotal > 0 && subtotal < 50 ? 5 : 0
  const total      = subtotal + shipping
  const itemsCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, loading, fetchCart,
      addToCart, updateQuantity, removeItem, clearCart,
      subtotal, shipping, total, itemsCount
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
