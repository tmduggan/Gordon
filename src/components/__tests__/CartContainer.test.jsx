import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CartContainer from '../shared/Cart/CartContainer'

// Mock dependencies
vi.mock('../../../services/gamification/foodScoringService', () => ({
  calculateFoodXP: vi.fn((food, quantity) => {
    // Mock XP calculation based on calories - actual implementation uses 2x calories
    const calories = (food.nutritionix_data?.nf_calories || food.calories || 100) * (quantity || 1)
    return Math.round(calories * 2) // 2x calories as XP (actual implementation)
  }),
  calculateFoodGroupMultiplier: vi.fn(() => 1.2) // 20% bonus
}))

vi.mock('../../../services/exercise/exerciseService', () => ({
  calculateExerciseScore: vi.fn((workoutData, exerciseDetails) => {
    // Mock exercise score calculation
    if (workoutData.sets && workoutData.sets.length > 0) {
      return workoutData.sets.reduce((total, set) => {
        const weight = set.weight || 0
        const reps = set.reps || 0
        return total + Math.round((weight * reps) / 10) // Simple formula
      }, 0)
    }
    if (workoutData.duration) {
      return Math.round(workoutData.duration * 2) // 2 XP per minute
    }
    return 0
  })
}))

vi.mock('../../../services/gamification/levelService', () => ({
  calculateStreakBonuses: vi.fn(() => ({
    totalBonus: 0,
    streaks: []
  }))
}))

vi.mock('../../../services/gamification/suggestionService', () => ({
  analyzeLaggingMuscles: vi.fn(() => []),
  calculateLaggingMuscleBonus: vi.fn(() => 0)
}))

describe('CartContainer', () => {
  const mockLogCart = vi.fn()
  const mockClearCart = vi.fn()
  const mockOnLogDataChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Food Cart XP Display', () => {
    const mockFoodItems = [
      {
        id: 'chicken-breast',
        label: 'Chicken Breast',
        quantity: 2,
        nutritionix_data: { nf_calories: 165 },
        calories: 165
      },
      {
        id: 'brown-rice',
        label: 'Brown Rice',
        quantity: 1,
        nutritionix_data: { nf_calories: 110 },
        calories: 110
      }
    ]

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
      )

      // Should display total XP (165*2*2 + 110*1*2 = 660 + 220 = 880)
      expect(screen.getByText('880')).toBeInTheDocument()
      expect(screen.getByText('Total XP:')).toBeInTheDocument()
    })

    it('should show XP breakdown in tooltip for food items', async () => {
      const user = userEvent.setup()
      
      render(
        <CartContainer
          title="Food Cart"
          type="food"
          items={mockFoodItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      )

      // Find and hover over the XP display to show tooltip
      const xpDisplay = screen.getByText('880')
      await user.hover(xpDisplay)

      // Should show breakdown in tooltip
      expect(screen.getByText('Cart Breakdown:')).toBeInTheDocument()
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
      expect(screen.getByText('Brown Rice')).toBeInTheDocument()
    })

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
      )

      // Should not render anything for empty cart
      expect(screen.queryByText('Total XP:')).not.toBeInTheDocument()
    })

    it('should calculate XP correctly with different quantities', () => {
      const itemsWithQuantities = [
        {
          id: 'apple',
          label: 'Apple',
          quantity: 3,
          nutritionix_data: { nf_calories: 95 },
          calories: 95
        }
      ]

      render(
        <CartContainer
          title="Food Cart"
          type="food"
          items={itemsWithQuantities}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      )

      // Should display XP for 3 apples (95*3*2 = 570)
      expect(screen.getByText('570')).toBeInTheDocument()
    })
  })

  describe('Exercise Cart XP Display', () => {
    const mockExerciseItems = [
      {
        id: 'bench-press',
        name: 'Bench Press'
      },
      {
        id: 'squats',
        name: 'Squats'
      }
    ]

    const mockLogData = {
      'bench-press': {
        sets: [
          { weight: 135, reps: 10 },
          { weight: 155, reps: 8 }
        ]
      },
      'squats': {
        duration: 30
      }
    }

    const mockExerciseLibrary = [
      {
        id: 'bench-press',
        name: 'Bench Press',
        target: 'chest'
      },
      {
        id: 'squats',
        name: 'Squats',
        target: 'quads'
      }
    ]

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
          onLogDataChange={mockOnLogDataChange}
        />
      )

      // Should display total XP for exercises
      // Bench press: (135*10 + 155*8)/10 = (1350 + 1240)/10 = 259
      // Squats: 30*2 = 60
      // Total: 259 + 60 = 319
      expect(screen.getByText('319')).toBeInTheDocument()
      expect(screen.getByText('Total XP:')).toBeInTheDocument()
    })

    it('should show XP breakdown in tooltip for exercise items', async () => {
      const user = userEvent.setup()
      
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
          onLogDataChange={mockOnLogDataChange}
        />
      )

      // Find and hover over the XP display to show tooltip
      const xpDisplay = screen.getByText('319')
      await user.hover(xpDisplay)

      // Should show breakdown in tooltip
      expect(screen.getByText('Cart Breakdown:')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Squats')).toBeInTheDocument()
    })

    it('should handle exercises with no data', () => {
      const itemsWithNoData = [
        {
          id: 'bench-press',
          name: 'Bench Press'
        }
      ]

      const emptyLogData = {
        'bench-press': {}
      }

      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={itemsWithNoData}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
          logData={emptyLogData}
          exerciseLibrary={mockExerciseLibrary}
          onLogDataChange={mockOnLogDataChange}
        />
      )

      // Should display 0 XP when no data
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle mixed exercise data (sets and duration)', () => {
      const mixedLogData = {
        'bench-press': {
          sets: [{ weight: 100, reps: 5 }]
        },
        'running': {
          duration: 20
        }
      }

      const mixedItems = [
        { id: 'bench-press', name: 'Bench Press' },
        { id: 'running', name: 'Running' }
      ]

      const mixedLibrary = [
        { id: 'bench-press', name: 'Bench Press' },
        { id: 'running', name: 'Running' }
      ]

      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={mixedItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
          logData={mixedLogData}
          exerciseLibrary={mixedLibrary}
          onLogDataChange={mockOnLogDataChange}
        />
      )

      // Should calculate XP for both types
      // Bench press: (100*5)/10 = 50
      // Running: 20*2 = 40
      // Total: 50 + 40 = 90
      expect(screen.getByText('90')).toBeInTheDocument()
    })

    it('should handle empty exercise cart', () => {
      render(
        <CartContainer
          title="Exercise Cart"
          type="exercise"
          items={[]}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="💪"
        />
      )

      // Should not render anything for empty cart
      expect(screen.queryByText('Total XP:')).not.toBeInTheDocument()
    })
  })

  describe('Cart Actions', () => {
    const mockItems = [
      {
        id: 'test-item',
        name: 'Test Item',
        quantity: 1
      }
    ]

    it('should call logCart when log button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      )

      const logButton = screen.getByRole('button', { name: /log items/i })
      await user.click(logButton)

      expect(mockLogCart).toHaveBeenCalledTimes(1)
    })

    it('should call clearCart when clear button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <CartContainer
          title="Test Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🍽️"
        />
      )

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(mockClearCart).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cart Display', () => {
    const mockItems = [
      {
        id: 'item-1',
        name: 'Item 1',
        quantity: 1
      },
      {
        id: 'item-2',
        name: 'Item 2',
        quantity: 2
      }
    ]

    it('should display cart title and icon', () => {
      render(
        <CartContainer
          title="My Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🛒"
        />
      )

      expect(screen.getByText('My Cart')).toBeInTheDocument()
      expect(screen.getByText('🛒')).toBeInTheDocument()
    })

    it('should display all cart items', () => {
      render(
        <CartContainer
          title="My Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🛒"
        />
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('should display item quantities', () => {
      render(
        <CartContainer
          title="My Cart"
          type="food"
          items={mockItems}
          logCart={mockLogCart}
          clearCart={mockClearCart}
          icon="🛒"
        />
      )

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
}) 