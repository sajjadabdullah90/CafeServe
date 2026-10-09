import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cafeserve-cart";

function readStoredCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The cart remains usable for this session if storage is unavailable.
    }
  }, [items]);

  const addItem = (item) => {
    setItems((current) => {
      const existing = current.find((entry) => String(entry.id) === String(item.id));
      if (existing) {
        return current.map((entry) => String(entry.id) === String(item.id) ? { ...entry, quantity: entry.quantity + 1 } : entry);
      }
      return [...current, {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image || "",
        category: item.category?.name || "Cafe favourite",
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      setItems((current) => current.filter((item) => String(item.id) !== String(id)));
      return;
    }
    setItems((current) => current.map((item) => String(item.id) === String(id) ? { ...item, quantity } : item));
  };

  const removeItem = (id) => setItems((current) => current.filter((item) => String(item.id) !== String(id)));
  const clearCart = () => setItems([]);

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
