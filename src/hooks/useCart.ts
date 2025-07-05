import { create } from 'zustand';
import { getFoodMacros } from '../utils/dataUtils';
import type { Food, CartItem, Recipe } from '../types';
import { useState } from 'react';

export type CartType = 'food' | 'exercise';

interface RecipeCartItem {
  type: 'recipe';
  id: string;
  name: string;
  servings: number;
  recipe: Recipe;
}

interface FoodCartItem extends Food {
  quantity: number;
  units: string;
  [key: string]: any;
}

interface ExerciseCartItem {
  id: string;
  name: string;
  quantity: number;
  [key: string]: any;
}

type AnyCartItem = FoodCartItem | RecipeCartItem | ExerciseCartItem;

interface CartState {
  carts: {
    food: AnyCartItem[];
    exercise: AnyCartItem[];
  };
  addToCart: (
    type: CartType,
    item: any,
    quantity?: number,
    unitsOverride?: string
  ) => void;
  removeFromCart: (type: CartType, itemId: string) => void;
  updateCartItem: (type: CartType, itemId: string, updateObj: Partial<AnyCartItem>) => void;
  clearCart: (type: CartType) => void;
}

const useCartStore = create<CartState>((set) => ({
  carts: {
    food: [],
    exercise: [],
  },

  addToCart: (type, item, quantity = 1, unitsOverride) =>
    set((state) => {
      const newCarts = { ...state.carts };
      const cart = [...newCarts[type]];

      if (
        type === 'food' &&
        item.items &&
        Array.isArray(item.items) &&
        item.servings
      ) {
        // Recipe
        const existingRecipeIndex = cart.findIndex(
          (i: any) => i.type === 'recipe' && i.id === item.id
        );
        if (existingRecipeIndex > -1) {
          (cart[existingRecipeIndex] as RecipeCartItem).servings += quantity;
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
        // Regular food or exercise
        const existingItemIndex = cart.findIndex((i: any) => i.id === item.id);
        if (existingItemIndex > -1) {
          cart[existingItemIndex].quantity += quantity;
        } else {
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
      newCarts[type] = newCarts[type].filter((item: any) => item.id !== itemId);
      return { carts: newCarts };
    }),

  updateCartItem: (type, itemId, updateObj) =>
    set((state) => {
      const newCarts = { ...state.carts };
      const cart = [...newCarts[type]];
      const itemIndex = cart.findIndex((i: any) => i.id === itemId);
      if (itemIndex > -1) {
        if (updateObj.quantity !== undefined && updateObj.quantity < 0) {
          cart.splice(itemIndex, 1);
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

// Custom hook for a specific cart type
const useCart = (type: CartType) => {
  const { carts, ...actions } = useCartStore();
  const boundActions = {
    addToCart: (item: any, quantity?: number, unitsOverride?: string) =>
      actions.addToCart(type, item, quantity, unitsOverride),
    removeFromCart: (itemId: string) => actions.removeFromCart(type, itemId),
    updateCartItem: (itemId: string, updateObj: Partial<AnyCartItem>) =>
      actions.updateCartItem(type, itemId, updateObj),
    clearCart: () => actions.clearCart(type),
  };
  return {
    cart: carts[type] || [],
    ...boundActions,
  };
};

export default useCart; 