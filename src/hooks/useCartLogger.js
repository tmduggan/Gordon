import { useState, useCallback } from 'react';
import { logFoodEntry } from '../firebase/firestore/logFoodEntry';

export default function useCartLogger(type, { user, foodList, saveFoodIfNeeded, setLogs }) {
    const [cart, setCart] = useState([]);

    const addToCart = useCallback((food, quantity = 1) => {
        setCart(currentCart => {
            const idx = currentCart.findIndex(item => item.label === food.label && item.units === food.units);
            if (idx !== -1) {
                const updated = [...currentCart];
                updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
                return updated;
            } else {
                return [...currentCart, { ...food, quantity }];
            }
        });
    }, []);

    const removeFromCart = useCallback((label, units) => {
        setCart(currentCart => currentCart.filter(item => !(item.label === label && item.units === units)));
    }, []);

    const updateCartItem = useCallback((label, currentUnits, newValues) => {
        setCart(currentCart => currentCart.map(item =>
            item.label === label && item.units === currentUnits
                ? { ...item, ...newValues }
                : item
        ));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const logCart = useCallback(async ({ cartDate, cartHour12, cartMinute, cartAmPm }) => {
        for (const item of cart) {
            let food = foodList.find(f => f.label === item.label && (f.units === item.units || f.default_serving?.label === item.units));
            if (!food) {
                const newFoodId = await saveFoodIfNeeded(item);
                if (newFoodId) {
                    food = { ...item, id: newFoodId };
                } else {
                    console.warn("Could not save new food for cart item:", item);
                    continue;
                }
            }

            for (let i = 0; i < item.quantity; i++) {
                try {
                    const newLog = await logFoodEntry(item, {
                        user, cartDate, cartHour12, cartMinute, cartAmPm, foodId: food.id
                    });
                    setLogs(logs => [newLog, ...logs]);
                } catch (error) {
                    console.error("Error adding food log from cart:", error, item);
                }
            }
        }
        clearCart();
    }, [cart, foodList, saveFoodIfNeeded, setLogs, user, clearCart]);


    return {
        cart,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        logCart,
    };
} 