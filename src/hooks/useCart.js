import { create } from 'zustand';
import { getFoodMacros, getInitialScaledNutrition } from '../utils/dataUtils';

const useCartStore = create((set) => ({
  carts: {
    food: [],
    exercise: [],
  },

  addToCart: (type, item, quantity = 1, unitsOverride) =>
    set((state) => {
      // Debug: Log relevant fields when adding to cart
      // console.log('[Cart Add]', {...});
      const newCarts = { ...state.carts };
      const cart = [...newCarts[type]];

      // Handle recipes - add as a single item
      if (
        type === 'food' &&
        item.items &&
        Array.isArray(item.items) &&
        item.servings
      ) {
        // Check if recipe already in cart
        const existingRecipeIndex = cart.findIndex(
          (i) => i.type === 'recipe' && i.id === item.id
        );
        if (existingRecipeIndex > -1) {
          cart[existingRecipeIndex].servings += quantity;
        } else {
          cart.push({
            type: 'recipe',
            id: item.id,
            name: item.name,
            servings: quantity,
            recipe: item,
          });
        }
      } else {
        // Handle regular food items
        const existingItemIndex = cart.findIndex((i) => i.id === item.id);
        if (existingItemIndex > -1) {
          cart[existingItemIndex].quantity += quantity;
        } else {
          // For food items, calculate initial scaled nutrition using actual quantity and units
          if (type === 'food' && item.label) {
            const units =
              unitsOverride || item.units || item.serving_unit || 'g';
            const initialNutrition = getFoodMacros(item, quantity, units);
            cart.push({
              ...item,
              quantity,
              units,
              ...initialNutrition,
            });
          } else {
            cart.push({ ...item, quantity });
          }
        }
      }

      newCarts[type] = cart;
      return { carts: newCarts };
    }),

  removeFromCart: (type, itemId) =>
    set((state) => {
      const newCarts = { ...state.carts };
      newCarts[type] = newCarts[type].filter((item) => item.id !== itemId);
      return { carts: newCarts };
    }),

  updateCartItem: (type, itemId, updateObj) =>
    set((state) => {
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

  clearCart: (type) =>
    set((state) => {
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
    addToCart: (item, quantity, unitsOverride) =>
      actions.addToCart(type, item, quantity, unitsOverride),
    removeFromCart: (itemId) => actions.removeFromCart(type, itemId),
    updateCartItem: (itemId, updateObj) =>
      actions.updateCartItem(type, itemId, updateObj),
    clearCart: () => actions.clearCart(type),
  };

  return {
    cart: carts[type] || [],
    ...boundActions,
  };
};

export default useCart;
