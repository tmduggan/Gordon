import { create } from 'zustand';
import { getInitialScaledNutrition } from '../utils/dataUtils';

const useCartStore = create((set) => ({
  carts: {
    food: [],
    exercise: [],
  },

  addToCart: (type, item, quantity = 1) => set((state) => {
    // Debug: Log relevant fields when adding to cart
    // console.log('[Cart Add]', {...});
    const newCarts = { ...state.carts };
    const cart = [...newCarts[type]];

    // Handle recipes - expand them into individual food items
    if (type === 'food' && item.items && Array.isArray(item.items)) {
      // This is a recipe, expand it into individual items
      const recipeItems = item.items.map(recipeItem => {
        const scaledQuantity = recipeItem.quantity * quantity;
        const scaledMacros = {
          calories: (recipeItem.macros.calories || 0) * quantity,
          protein: (recipeItem.macros.protein || 0) * quantity,
          carbs: (recipeItem.macros.carbs || 0) * quantity,
          fat: (recipeItem.macros.fat || 0) * quantity,
          fiber: (recipeItem.macros.fiber || 0) * quantity,
        };

        return {
          id: `${item.id}_${recipeItem.id}`,
          food_name: recipeItem.name,
          label: recipeItem.name,
          quantity: scaledQuantity,
          units: recipeItem.unit,
          serving_unit: recipeItem.unit,
          calories: scaledMacros.calories,
          protein: scaledMacros.protein,
          carbs: scaledMacros.carbs,
          fat: scaledMacros.fat,
          fiber: scaledMacros.fiber,
          isRecipeItem: true,
          recipeName: item.name,
          recipeId: item.id,
          originalFoodId: recipeItem.id
        };
      });

      // Add each recipe item to cart
      recipeItems.forEach(recipeItem => {
        const existingItemIndex = cart.findIndex((i) => i.id === recipeItem.id);
        if (existingItemIndex > -1) {
          cart[existingItemIndex].quantity += recipeItem.quantity;
          // Update macros proportionally
          cart[existingItemIndex].calories += recipeItem.calories;
          cart[existingItemIndex].protein += recipeItem.protein;
          cart[existingItemIndex].carbs += recipeItem.carbs;
          cart[existingItemIndex].fat += recipeItem.fat;
          cart[existingItemIndex].fiber += recipeItem.fiber;
        } else {
          cart.push(recipeItem);
        }
      });
    } else {
      // Handle regular food items
      const existingItemIndex = cart.findIndex((i) => i.id === item.id);

      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
      } else {
        // For food items, calculate initial scaled nutrition
        if (type === 'food' && item.label) {
          const initialNutrition = getInitialScaledNutrition(item);
          cart.push({ 
            ...item, 
            quantity,
            units: item.serving_unit || 'g',
            ...initialNutrition
          });
        } else {
          cart.push({ ...item, quantity });
        }
      }
    }
    
    newCarts[type] = cart;
    return { carts: newCarts };
  }),

  removeFromCart: (type, itemId) => set((state) => {
    const newCarts = { ...state.carts };
    newCarts[type] = newCarts[type].filter((item) => item.id !== itemId);
    return { carts: newCarts };
  }),

  updateCartItem: (type, itemId, updateObj) => set((state) => {
    const newCarts = { ...state.carts };
    const cart = [...newCarts[type]];
    const itemIndex = cart.findIndex((i) => i.id === itemId);

    if (itemIndex > -1) {
      // Allow quantity 0 during editing - only remove if explicitly requested
      // or if quantity is negative (which shouldn't happen with proper input validation)
      if (updateObj.quantity !== undefined && updateObj.quantity < 0) {
        cart.splice(itemIndex, 1); // Remove if quantity is negative
      } else {
        cart[itemIndex] = { ...cart[itemIndex], ...updateObj };
      }
    }
    newCarts[type] = cart;
    return { carts: newCarts };
  }),

  clearCart: (type) => set((state) => {
    const newCarts = { ...state.carts };
    newCarts[type] = [];
    return { carts: newCarts };
  }),
}));

// Custom hook that provides a simplified interface for a specific cart type
const useCart = (type) => {
  const { carts, ...actions } = useCartStore();
  
  // Bind the actions to the specific cart type
  const boundActions = {
    addToCart: (item, quantity) => actions.addToCart(type, item, quantity),
    removeFromCart: (itemId) => actions.removeFromCart(type, itemId),
    updateCartItem: (itemId, updateObj) => actions.updateCartItem(type, itemId, updateObj),
    clearCart: () => actions.clearCart(type),
  };

  return {
    cart: carts[type] || [],
    ...boundActions,
  };
};

export default useCart; 