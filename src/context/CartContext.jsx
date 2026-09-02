import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('aydara_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('aydara_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, size, color, quantity = 1, stitchingOption = '', customPrice = null) => {
    const finalPrice = customPrice !== null && customPrice !== undefined
      ? Number(customPrice)
      : (product.salePrice || product.price);

    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === product.id &&
             i.size === size &&
             i.color === color &&
             i.stitchingOption === stitchingOption
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: finalPrice,
          originalPrice: product.price,
          image: product.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200',
          size: size || (product.sizes ? product.sizes[0] : 'Standard'),
          color: color || (product.colors ? product.colors[0]?.name : ''),
          stitchingOption: stitchingOption || '',
          quantity
        }
      ];
    });
    setIsDrawerOpen(true);
  };

  const updateQuantity = (productId, size, color, newQty, stitchingOption = '') => {
    if (newQty <= 0) {
      removeFromCart(productId, size, color, stitchingOption);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId &&
        item.size === size &&
        item.color === color &&
        item.stitchingOption === stitchingOption
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const removeFromCart = (productId, size, color, stitchingOption = '') => {
    setItems(prev =>
      prev.filter(
        item => !(
          item.productId === productId &&
          item.size === size &&
          item.color === color &&
          item.stitchingOption === stitchingOption
        )
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalCount,
        isDrawerOpen,
        setIsDrawerOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      items: [],
      addToCart: () => {},
      updateQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      subtotal: 0,
      totalCount: 0,
      isDrawerOpen: false,
      setIsDrawerOpen: () => {}
    };
  }
  return context;
};
