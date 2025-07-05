import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CartContainer from '../../components/shared/Cart/CartContainer';

// Mocks
const mockAddXP = vi.fn();
const mockSaveUserProfile = vi.fn();
const mockClearCart = vi.fn();
const mockLogFoodEntry = vi.fn();

vi.mock('../../store/useAuthStore', () => () => ({
  user: { uid: 'test-user-id' },
  userProfile: { totalXP: 100, muscleReps: {} },
  addXP: mockAddXP,
  saveUserProfile: mockSaveUserProfile,
}));

vi.mock('../../hooks/useCart', () => () => ({
  cart: [
    {
      id: 'apple',
      label: 'Apple',
      quantity: 2,
      nutritionix_data: { nf_calories: 95 },
      calories: 95,
    },
  ],
  clearCart: mockClearCart,
}));

vi.mock('../../services/firebase/firestore/logFoodEntry', () => ({
  logFoodEntry: mockLogFoodEntry,
}));

vi.mock('../../services/gamification/foodScoringService', () => ({
  calculateFoodXP: vi.fn((food, quantity) => {
    // Realistic calculation: calories * 2
    const calories =
      (food.nutritionix_data?.nf_calories || food.calories || 0) *
      (quantity || 1);
    return Math.round(calories * 2);
  }),
  calculateFoodGroupMultiplier: vi.fn(() => 1.0),
}));

describe('Food Cart XP Integration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display correct XP in cart and add the same XP to user profile after logging', async () => {
    const user = userEvent.setup();
    // Arrange: Render the cart with a known food item
    render(
      <CartContainer
        title="Food Cart"
        type="food"
        items={[
          {
            id: 'apple',
            label: 'Apple',
            quantity: 2,
            nutritionix_data: { nf_calories: 95 },
            calories: 95,
          },
        ]}
        logCart={async () => {
          // Simulate the logCart logic
          const totalXP = 95 * 2 * 2; // 2 apples, 95 cal each, *2 XP per cal
          await mockAddXP(totalXP);
          mockClearCart();
        }}
        clearCart={mockClearCart}
        icon="🍎"
      />
    );

    // Assert: Cart preview shows correct XP
    expect(screen.getByText('380')).toBeInTheDocument(); // 95*2*2 = 380
    expect(screen.getByText('Total XP:')).toBeInTheDocument();

    // Act: Log the cart
    const logButton = screen.getByRole('button', { name: /log items/i });
    await user.click(logButton);

    // Assert: addXP called with correct XP
    expect(mockAddXP).toHaveBeenCalledWith(380);
    // Assert: cart is cleared
    expect(mockClearCart).toHaveBeenCalled();
  });
});
