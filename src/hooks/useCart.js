import { useState, useCallback } from 'react';

export default function useCart(type) {
    const [cart, setCart] = useState([]);

    const addToCart = useCallback((item, quantity = 1) => {
        setCart(currentCart => {
            if (type === 'food') {
                const idx = currentCart.findIndex(cartItem => cartItem.label === item.label && cartItem.units === item.units);
                if (idx !== -1) {
                    const updated = [...currentCart];
                    updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
                    return updated;
                } else {
                    return [...currentCart, { ...item, quantity }];
                }
            } else { // exercise
                const idx = currentCart.findIndex(cartItem => cartItem.id === item.id);
                if (idx === -1) {
                    return [...currentCart, item];
                }
                return currentCart; // Don't add duplicates
            }
        });
    }, [type]);

    const removeFromCart = useCallback((identifier, units) => {
        setCart(currentCart => {
            if (type === 'food') {
                return currentCart.filter(item => !(item.label === identifier && item.units === units));
            } else { // exercise
                return currentCart.filter(item => item.id !== identifier);
            }
        });
    }, [type]);

    const updateCartItem = useCallback((identifier, currentUnits, newValues) => {
        setCart(currentCart => currentCart.map(item => {
            if (type === 'food') {
                return item.label === identifier && item.units === currentUnits
                    ? { ...item, ...newValues }
                    : item;
            }
            // No update for exercise items in this simplified version
            return item;
        }));
    }, [type]);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    return {
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
    };
} 