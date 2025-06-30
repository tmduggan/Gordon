import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import ExercisePage from '../../pages/ExercisePage'
import useExerciseLogging from '../../hooks/useExerciseLogging'
import { saveWorkoutLog } from '../../firebase/firestore/logExerciseEntry'

// Mock all dependencies
vi.mock('../../store/useAuthStore', () => ({
  default: vi.fn(() => ({
    user: { uid: 'test-user-id', metadata: { creationTime: '2024-01-01T00:00:00Z' } },
    userProfile: { 
      totalXP: 100, 
      muscleReps: {},
      pinnedExercises: [],
      hiddenExercises: [],
      availableEquipment: {
        gym: ['barbell', 'dumbbell'],
        bodyweight: ['body weight'],
        cardio: ['treadmill']
      }
    },
    saveUserProfile: vi.fn(),
    addXP: vi.fn(),
    togglePinExercise: vi.fn()
  }))
}))

vi.mock('../../hooks/useHistory', () => ({
  default: vi.fn(() => ({
    logs: [],
    loading: false,
    fetchLogs: vi.fn(),
    updateLog: vi.fn(),
    deleteLog: vi.fn()
  }))
}))

vi.mock('../../hooks/useLibrary', () => ({
  default: vi.fn(() => ({
    items: [
      {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'strength',
        target: 'chest',
        secondaryMuscles: ['triceps'],
        equipment: 'barbell'
      },
      {
        id: 'squats',
        name: 'Squats',
        category: 'strength',
        target: 'quads',
        secondaryMuscles: ['glutes'],
        equipment: 'body weight'
      }
    ],
    loading: false,
    fetchItems: vi.fn()
  }))
}))

vi.mock('../../hooks/useCart', () => ({
  default: vi.fn(() => ({
    cart: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    updateQuantity: vi.fn()
  }))
}))

vi.mock('../../hooks/useSearch', () => ({
  default: vi.fn(() => ({
    query: '',
    results: [],
    loading: false,
    search: vi.fn(),
    clearSearch: vi.fn()
  }))
}))

vi.mock('../../hooks/useDateTimePicker', () => ({
  useDateTimePicker: vi.fn(() => ({
    date: new Date('2024-01-15'),
    setDate: vi.fn(),
    timePeriod: 'morning',
    setTimePeriod: vi.fn(),
    getLogTimestamp: vi.fn().mockReturnValue(new Date('2024-01-15T10:00:00')),
    timePeriods: { morning: 6, afternoon: 12, evening: 18, night: 22 }
  }))
}))

vi.mock('../../firebase/firestore/logExerciseEntry', () => ({
  saveWorkoutLog: vi.fn().mockResolvedValue('test-log-id')
}))

vi.mock('../../services/gamification/exerciseScoringService', () => ({
  addWorkoutToMuscleReps: vi.fn().mockReturnValue({ chest: 50, triceps: 30 })
}))

vi.mock('../../services/gamification/exerciseBestsService', () => ({
  updatePersonalBests: vi.fn().mockReturnValue({})
}))

vi.mock('../../services/exercise/exerciseService', () => ({
  calculateExerciseScore: vi.fn().mockReturnValue(25)
}))

vi.mock('../../hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

describe('Exercise Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Exercise Selection and Logging', () => {
    it('should allow selecting an exercise and adding to cart', async () => {
      const { result } = renderHook(() => useExerciseLogging(
        { items: [{ id: 'bench-press', name: 'Bench Press', category: 'strength' }] },
        { logs: [] },
        { cart: [], addToCart: vi.fn(), clearCart: vi.fn() },
        { clearSearch: vi.fn() },
        { getLogTimestamp: vi.fn().mockReturnValue(new Date()) }
      ))

      const exercise = { id: 'bench-press', name: 'Bench Press', category: 'strength' }

      act(() => {
        result.current.handleSelect(exercise)
      })

      expect(result.current.cartProps.logData['bench-press']).toBeDefined()
    })

    it('should log exercise with sets data', async () => {
      const mockAddToCart = vi.fn()
      const mockClearCart = vi.fn()
      const mockAddXP = vi.fn()

      const { default: useAuthStore } = await import('../../store/useAuthStore')
      useAuthStore.mockReturnValue({
        user: { uid: 'test-user-id' },
        userProfile: { totalXP: 100, muscleReps: {} },
        saveUserProfile: vi.fn(),
        addXP: mockAddXP
      })

      const { result } = renderHook(() => useExerciseLogging(
        { items: [{ id: 'bench-press', name: 'Bench Press', category: 'strength' }] },
        { logs: [] },
        { cart: [{ id: 'bench-press', name: 'Bench Press' }], addToCart: mockAddToCart, clearCart: mockClearCart },
        { clearSearch: vi.fn() },
        { getLogTimestamp: vi.fn().mockReturnValue(new Date()) }
      ))

      // Set up exercise data
      act(() => {
        result.current.handleSelect({ id: 'bench-press', name: 'Bench Press', category: 'strength' })
      })

      // Add sets data
      act(() => {
        result.current.cartProps.onLogDataChange('bench-press', {
          sets: [
            { weight: 135, reps: 10 },
            { weight: 155, reps: 8 }
          ]
        })
      })

      // Log the exercise
      await act(async () => {
        await result.current.logCart()
      })

      expect(saveWorkoutLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          exerciseId: 'bench-press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 155, reps: 8 }
          ]
        })
      )

      expect(mockAddXP).toHaveBeenCalledWith(25)
      expect(mockClearCart).toHaveBeenCalled()
    })

    it('should handle cardio exercises with duration', async () => {
      const mockAddXP = vi.fn()

      const { default: useAuthStore } = await import('../../store/useAuthStore')
      useAuthStore.mockReturnValue({
        user: { uid: 'test-user-id' },
        userProfile: { totalXP: 100, muscleReps: {} },
        saveUserProfile: vi.fn(),
        addXP: mockAddXP
      })

      const { result } = renderHook(() => useExerciseLogging(
        { items: [{ id: 'running', name: 'Running', category: 'cardio' }] },
        { logs: [] },
        { cart: [{ id: 'running', name: 'Running' }], addToCart: vi.fn(), clearCart: vi.fn() },
        { clearSearch: vi.fn() },
        { getLogTimestamp: vi.fn().mockReturnValue(new Date()) }
      ))

      // Set up cardio exercise
      act(() => {
        result.current.handleSelect({ id: 'running', name: 'Running', category: 'cardio' })
      })

      // Add duration data
      act(() => {
        result.current.cartProps.onLogDataChange('running', {
          duration: 30
        })
      })

      // Log the exercise
      await act(async () => {
        await result.current.logCart()
      })

      expect(saveWorkoutLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          exerciseId: 'running',
          duration: 30
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      saveWorkoutLog.mockRejectedValueOnce(new Error('Firebase connection failed'))

      const { result } = renderHook(() => useExerciseLogging(
        { items: [{ id: 'bench-press', name: 'Bench Press', category: 'strength' }] },
        { logs: [] },
        { cart: [{ id: 'bench-press', name: 'Bench Press' }], addToCart: vi.fn(), clearCart: vi.fn() },
        { clearSearch: vi.fn() },
        { getLogTimestamp: vi.fn().mockReturnValue(new Date()) }
      ))

      // Set up exercise data
      act(() => {
        result.current.handleSelect({ id: 'bench-press', name: 'Bench Press', category: 'strength' })
      })

      // Try to log the exercise
      await act(async () => {
        await result.current.logCart()
      })

      // Should still clear cart even with error
      expect(result.current.cartProps.logData).toEqual({})
    })
  })

  describe('Data Persistence', () => {
    it('should update user profile with new muscle reps', async () => {
      const mockSaveUserProfile = vi.fn()

      const { default: useAuthStore } = await import('../../store/useAuthStore')
      useAuthStore.mockReturnValue({
        user: { uid: 'test-user-id' },
        userProfile: { totalXP: 100, muscleReps: { chest: 20 } },
        saveUserProfile: mockSaveUserProfile,
        addXP: vi.fn()
      })

      const { result } = renderHook(() => useExerciseLogging(
        { items: [{ id: 'bench-press', name: 'Bench Press', category: 'strength', target: 'chest' }] },
        { logs: [] },
        { cart: [{ id: 'bench-press', name: 'Bench Press' }], addToCart: vi.fn(), clearCart: vi.fn() },
        { clearSearch: vi.fn() },
        { getLogTimestamp: vi.fn().mockReturnValue(new Date()) }
      ))

      // Set up exercise data
      act(() => {
        result.current.handleSelect({ id: 'bench-press', name: 'Bench Press', category: 'strength' })
      })

      // Add sets data
      act(() => {
        result.current.cartProps.onLogDataChange('bench-press', {
          sets: [{ weight: 135, reps: 10 }]
        })
      })

      // Log the exercise
      await act(async () => {
        await result.current.logCart()
      })

      expect(mockSaveUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          muscleReps: { chest: 50, triceps: 30 }
        })
      )
    })
  })
}) 