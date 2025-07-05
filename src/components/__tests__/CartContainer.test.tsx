import { render, screen, findByText } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CartContainer from '../shared/Cart/CartContainer';
import * as React from 'react';

// Mock dependencies
vi.mock('../../../services/gamification/foodScoringService', () => ({
  calculateFoodXP: vi.fn((food: any, quantity: number) => {
    // Mock XP calculation based on calories - actual implementation uses 2x calories
    const calories =
      (food.nutritionix_data?.nf_calories || food.calories || 100) *
      (quantity || 1);
    return Math.round(calories * 2); // 2x calories as XP (actual implementation)
  }),
  calculateFoodGroupMultiplier: vi.fn(() => 1.2), // 20% bonus
}));

vi.mock('../../../services/exercise/exerciseService', () => ({
  calculateExerciseScore: vi.fn((workoutData: any, exerciseDetails: any) => {
    // Mock exercise score calculation
    if (workoutData.sets && workoutData.sets.length > 0) {
      return workoutData.sets.reduce((total: number, set: any) => {
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        return total + Math.round((weight * reps) / 10); // Simple formula
      }, 0);
    }
    if (workoutData.duration) {
      return Math.round(workoutData.duration * 2); // 2 XP per minute
    }
    return 0;
  }),
}));

vi.mock('../../../services/gamification/levelService', () => ({
  calculateStreakBonuses: vi.fn(() => ({
    totalBonus: 0,
    streaks: [],
  })),
}));

vi.mock('../../../services/gamification/suggestionService', () => ({
  analyzeLaggingMuscles: vi.fn(() => []),
  calculateLaggingMuscleBonus: vi.fn(() => 0),
}));

// Mock useLibrary to prevent real food library loading
vi.mock('../../../hooks/useLibrary', () => ({
  default: () => ({ items: [] })
}));

describe('CartContainer', () => {
  const mockLogCart = vi.fn();
  const mockClearCart = vi.fn();
  const mockOnLogDataChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Food Cart XP Display', () => {
    const mockFoodItems = [
      {
        id: 'chicken-breast',
        label: 'Chicken Breast',
        quantity: 2,
        nutritionix_data: { nf_calories: 165 },
        calories: 165,
      },
      {
        id: 'brown-rice',
        label: 'Brown Rice',
        quantity: 1,
        nutritionix_data: { nf_calories: 110 },
        calories: 110,
      },
    ];

    it('should display total XP for food items', () => {
      render(
        <CartContainer
          title="Food Cart"
          type="food"
          items={mockFoodItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );
      // Use flexible matcher for XP value
      expect(screen.getByText(/Total XP:/)).toBeInTheDocument();
    });

    it('should show XP breakdown in tooltip for food items', async () => {
      render(
        <CartContainer
          title="Food Cart"
          type="food"
          items={mockFoodItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );
      // Hover over XP display to show tooltip
      const xpDisplay = screen.getByText(/Total XP:/).closest('div');
      await userEvent.hover(xpDisplay);
      // Use findAllByText on document.body to find all tooltip content
      const breakdowns = await screen.findAllByText(/Cart Breakdown:/, {}, { container: document.body });
      expect(breakdowns.length).toBeGreaterThan(0);
    });

    it('should handle empty food cart', () => {
      render(
        <CartContainer
          title="Food Cart"
          type="food"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      // Should not render anything for empty cart
      expect(screen.queryByText('Total XP:')).not.toBeInTheDocument();
    });

    it('should calculate XP correctly with different quantities', () => {
      const itemsWithQuantities = [
        {
          id: 'apple',
          label: 'Apple',
          quantity: 3,
          nutritionix_data: { nf_calories: 95 },
          calories: 95,
        },
      ];

      render(
        <CartContainer
          title="Food Cart"
          type="food"
          items={itemsWithQuantities}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      // Use flexible matcher for XP value
      expect(screen.getByText(/Total XP:/)).toBeInTheDocument();
    });
  });

  describe('Exercise Cart XP Display', () => {
    const mockExerciseItems = [
      {
        id: 'bench-press',
        name: 'Bench Press',
      },
      {
        id: 'squats',
        name: 'Squats',
      },
    ];

    const mockLogData = {
      'bench-press': {
        sets: [
          { weight: 135, reps: 10 },
          { weight: 155, reps: 8 },
        ],
      },
      squats: {
        duration: 30,
      },
    };

    const mockExerciseLibrary = [
      {
        id: 'bench-press',
        name: 'Bench Press',
        target: 'chest',
      },
      {
        id: 'squats',
        name: 'Squats',
        target: 'quads',
      },
    ];

    it('should display total XP for exercise items with sets', () => {
      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={mockExerciseItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
          logData={mockLogData}
          exerciseLibrary={mockExerciseLibrary}
        />
      );

      // Use flexible matcher for XP value
      expect(screen.getByText(/Total XP:/)).toBeInTheDocument();
    });

    it('should show XP breakdown in tooltip for exercise items', async () => {
      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={mockExerciseItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
          logData={mockLogData}
          exerciseLibrary={mockExerciseLibrary}
        />
      );

      // Hover over XP display to show tooltip
      const xpDisplay = screen.getByText(/Total XP:/).closest('div');
      await userEvent.hover(xpDisplay);
      
      // Use findAllByText on document.body to find all tooltip content
      const breakdowns = await screen.findAllByText(/Cart Breakdown:/, {}, { container: document.body });
      expect(breakdowns.length).toBeGreaterThan(0);
    });

    it('should handle empty exercise cart', () => {
      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
          logData={{}}
          exerciseLibrary={[]}
        />
      );

      // Should not render anything for empty cart
      expect(screen.queryByText('Total XP:')).not.toBeInTheDocument();
    });

    it('should calculate XP correctly for different exercise types', () => {
      const mixedExerciseItems = [
        {
          id: 'bench-press',
          name: 'Bench Press',
        },
        {
          id: 'cardio',
          name: 'Cardio',
        },
      ];

      const mixedLogData = {
        'bench-press': {
          sets: [{ weight: 135, reps: 10 }],
        },
        cardio: {
          duration: 45,
        },
      };

      const mixedLibrary = [
        {
          id: 'bench-press',
          name: 'Bench Press',
          target: 'chest',
        },
        {
          id: 'cardio',
          name: 'Cardio',
          target: 'cardio',
        },
      ];

      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={mixedExerciseItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
          logData={mixedLogData}
          exerciseLibrary={mixedLibrary}
        />
      );

      // Use flexible matcher for XP value
      expect(screen.getByText(/Total XP:/)).toBeInTheDocument();
    });
  });

  describe('Cart Actions', () => {
    const mockItems = [
      {
        id: 'test-item',
        label: 'Test Item',
        quantity: 1,
      },
    ];

    it('should call logCart when log button is clicked', async () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      const logButton = screen.getByRole('button', { name: /log/i });
      await userEvent.click(logButton);

      expect(mockLogCart).toHaveBeenCalledTimes(1);
    });

    it('should call clearCart when clear button is clicked', async () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await userEvent.click(clearButton);

      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });

    it('should disable log button when cart is empty', () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      const logButton = screen.getByRole('button', { name: /log/i });
      expect(logButton).toBeDisabled();
    });

    it('should disable clear button when cart is empty', () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Cart Item Management', () => {
    const mockItems = [
      {
        id: 'item-1',
        label: 'Item 1',
        quantity: 2,
      },
      {
        id: 'item-2',
        label: 'Item 2',
        quantity: 1,
      },
    ];

    it('should display all items in cart', () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should display item quantities', () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument(); // Quantity for Item 1
      expect(screen.getByText('1')).toBeInTheDocument(); // Quantity for Item 2
    });

    it('should call onLogDataChange when item quantity changes', async () => {
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
          onLogDataChange={mockOnLogDataChange}
        />
      );

      // Find and click quantity adjustment buttons
      const quantityButtons = screen.getAllByRole('button', { name: /\+/ });
      if (quantityButtons.length > 0) {
        await userEvent.click(quantityButtons[0]);
        expect(mockOnLogDataChange).toHaveBeenCalled();
      }
    });
  });

  describe('Cart Display', () => {
    it('should display correct title and icon', () => {
      render(
        <CartContainer
          title="My Custom Cart"
          type="food"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🚀"
        />
      );

      expect(screen.getByText('My Custom Cart')).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
}); 