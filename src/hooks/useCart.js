import { create } from 'zustand';
import { getInitialScaledNutrition } from '../utils/dataUtils';

const useCartStore = create((set) => ({
  carts: {
    food: [],
    exercise: [],
  },

  addToCart: (type, item, quantity = 1) => set((state) => {
    const newCarts = { ...state.carts };
    const cart = [...newCarts[type]];
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
      if (updateObj.quantity !== undefined && updateObj.quantity <= 0) {
        cart.splice(itemIndex, 1); // Remove if quantity is 0 or less
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