import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { toast } from 'sonner';
import { differenceInHours, differenceInDays } from 'date-fns';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, reservationDetails?: ReservationDetails) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateReservationDetails: (productId: string, details: ReservationDetails) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getPlatformFee: () => number;
  getGrandTotal: () => number;
}

interface ReservationDetails {
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee

function calculateReservationPrice(
  product: Product,
  startDate: Date,
  startTime: string,
  endDate: Date,
  endTime: string
): { price: number; duration: number; unit: string } {
  const start = new Date(startDate);
  start.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
  
  const end = new Date(endDate);
  end.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

  let duration = 0;
  let price = 0;
  let unit = '';

  switch (product.price_unit) {
    case 'per_hour':
      duration = Math.max(1, differenceInHours(end, start));
      price = duration * Number(product.price);
      unit = duration === 1 ? 'hour' : 'hours';
      break;
    case 'per_day':
      duration = Math.max(1, differenceInDays(end, start));
      price = duration * Number(product.price);
      unit = duration === 1 ? 'day' : 'days';
      break;
    case 'per_night':
      duration = Math.max(1, differenceInDays(end, start));
      price = duration * Number(product.price);
      unit = duration === 1 ? 'night' : 'nights';
      break;
    default:
      price = Number(product.price);
      duration = 1;
      unit = 'booking';
  }

  return { price, duration, unit };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert date strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        endDate: item.endDate ? new Date(item.endDate) : undefined,
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1, reservationDetails?: ReservationDetails) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      
      if (reservationDetails) {
        const { price, duration, unit } = calculateReservationPrice(
          product,
          reservationDetails.startDate,
          reservationDetails.startTime,
          reservationDetails.endDate,
          reservationDetails.endTime
        );
        
        if (existing) {
          toast.success(`Updated ${product.name} reservation`);
          return prev.map(item =>
            item.product.id === product.id
              ? { 
                  ...item, 
                  quantity: 1,
                  ...reservationDetails,
                  calculatedPrice: price,
                  duration,
                  durationUnit: unit
                }
              : item
          );
        }
        
        toast.success(`Added ${product.name} to cart`);
        return [...prev, { 
          product, 
          quantity: 1,
          ...reservationDetails,
          calculatedPrice: price,
          duration,
          durationUnit: unit
        }];
      }
      
      if (existing) {
        toast.success(`Updated ${product.name} quantity`);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateReservationDetails = (productId: string, details: ReservationDetails) => {
    setItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const { price, duration, unit } = calculateReservationPrice(
            item.product,
            details.startDate,
            details.startTime,
            details.endDate,
            details.endTime
          );
          return {
            ...item,
            ...details,
            calculatedPrice: price,
            duration,
            durationUnit: unit
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    items.reduce((sum, item) => {
      // For reservable items, use calculated price
      if (item.calculatedPrice !== undefined) {
        return sum + item.calculatedPrice;
      }
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

  const getPlatformFee = () => getTotalPrice() * PLATFORM_FEE_PERCENTAGE;

  const getGrandTotal = () => getTotalPrice() + getPlatformFee();

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateReservationDetails,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getPlatformFee,
        getGrandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
