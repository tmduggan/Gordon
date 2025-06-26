import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { logFoodEntry } from '../firebase/firestore/logFoodEntry';
import { useToast } from './use-toast';

export default function useFoodLogging(foodLibrary, cart, search, dateTimePicker) {
    const { user, addXP } = useAuthStore();
    const [showAllHistory, setShowAllHistory] = useState(false);
    const { toast } = useToast();

    const handleSelect = async (food) => {
        let foodToLog = food;
        if (food.isPreview) {
            const savedFood = await foodLibrary.fetchAndSave(food);
            if (savedFood) foodToLog = savedFood;
        }
        cart.addToCart(foodToLog);
        search.clearSearch();
    };

    const handleNutrientsAdd = async (foods) => {
        console.log('[handleNutrientsAdd] Adding foods to cart:', foods.length);
        // Add all foods to cart with default quantities
        foods.forEach(food => {
            cart.addToCart(food);
        });
        
        // Show success toast
        if (foods.length === 1) {
            toast({
                title: "Food Added",
                description: `Added ${foods[0].food_name || foods[0].label} to your cart`,
            });
        } else {
            toast({
                title: "Foods Added",
                description: `Added ${foods.length} foods to your cart`,
            });
        }
        
        if (search && search.clearSearch) {
            search.clearSearch();
        }
    };

    const logCart = async () => {
        const timestamp = dateTimePicker.getLogTimestamp();
        let totalXP = 0;
        
        for (const item of cart.cart) {
            let food = foodLibrary.items.find(f => f.id === item.id);
            if (!food) {
                const newFoodId = await foodLibrary.fetchAndSave(item);
                if (newFoodId) food = { ...item, id: newFoodId };
                else { 
                    console.warn("Could not save new food for cart item:", item); 
                    continue; 
                }
            }
            try {
                const loggedEntry = await logFoodEntry(food, user, item.quantity, timestamp);
                totalXP += loggedEntry.xp || 0;
            } catch (error) { 
                console.error("Error adding food log from cart:", error, item); 
            }
        }
        
        // Add total XP to user's profile
        if (totalXP > 0) {
            await addXP(totalXP);
        }
        
        cart.clearCart();
    };

    return {
        handleSelect,
        handleNutrientsAdd,
        logCart,
        showAllHistory,
        setShowAllHistory
    };
} 