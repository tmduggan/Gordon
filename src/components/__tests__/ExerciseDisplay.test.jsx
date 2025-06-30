import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseDisplay from '../exercise/ExerciseDisplay'

// Mock dependencies
vi.mock('../../store/useAuthStore', () => ({
  default: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    userProfile: { 
      totalXP: 100, 
      muscleReps: {},
      pinnedExercises: [],
      hiddenExercises: []
    },
    togglePinExercise: vi.fn()
  }))
}))

vi.mock('../../hooks/useHistory', () => ({
  default: vi.fn(() => ({
    logs: [],
    loading: false,
    fetchLogs: vi.fn()
  }))
}))

vi.mock('../../hooks/useLibrary', () => ({
  default: vi.fn(() => ({
    items: [],
    loading: false,
    fetchItems: vi.fn()
  }))
}))

describe('ExerciseDisplay', () => {
  const mockExercise = {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'strength',
    target: 'chest',
    secondaryMuscles: ['triceps'],
    equipment: 'barbell',
    instructions: 'Lie on bench and press barbell'
  }

  const mockProps = {
    exercise: mockExercise,
    onSelect: vi.fn(),
    isSelected: false,
    showEquipment: true,
    showCategory: true,
    showInstructions: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render exercise name', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('should render equipment when showEquipment is true', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    expect(screen.getByText('barbell')).toBeInTheDocument()
  })

  it('should not render equipment when showEquipment is false', () => {
    render(<ExerciseDisplay {...mockProps} showEquipment={false} />)
    
    expect(screen.queryByText('barbell')).not.toBeInTheDocument()
  })

  it('should render category when showCategory is true', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    expect(screen.getByText('strength')).toBeInTheDocument()
  })

  it('should not render category when showCategory is false', () => {
    render(<ExerciseDisplay {...mockProps} showCategory={false} />)
    
    expect(screen.queryByText('strength')).not.toBeInTheDocument()
  })

  it('should render instructions when showInstructions is true', () => {
    render(<ExerciseDisplay {...mockProps} showInstructions={true} />)
    
    expect(screen.getByText('Lie on bench and press barbell')).toBeInTheDocument()
  })

  it('should not render instructions when showInstructions is false', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    expect(screen.queryByText('Lie on bench and press barbell')).not.toBeInTheDocument()
  })

  it('should call onSelect when clicked', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    const exerciseElement = screen.getByText('Bench Press').closest('div')
    fireEvent.click(exerciseElement)
    
    expect(mockProps.onSelect).toHaveBeenCalledWith(mockExercise)
  })

  it('should show selected state when isSelected is true', () => {
    render(<ExerciseDisplay {...mockProps} isSelected={true} />)
    
    const exerciseElement = screen.getByText('Bench Press').closest('div')
    expect(exerciseElement).toHaveClass('bg-primary')
  })

  it('should show unselected state when isSelected is false', () => {
    render(<ExerciseDisplay {...mockProps} isSelected={false} />)
    
    const exerciseElement = screen.getByText('Bench Press').closest('div')
    expect(exerciseElement).not.toHaveClass('bg-primary')
  })

  it('should handle exercise without equipment', () => {
    const exerciseWithoutEquipment = {
      ...mockExercise,
      equipment: null
    }

    render(<ExerciseDisplay {...mockProps} exercise={exerciseWithoutEquipment} />)
    
    expect(screen.queryByText('barbell')).not.toBeInTheDocument()
  })

  it('should handle exercise without category', () => {
    const exerciseWithoutCategory = {
      ...mockExercise,
      category: null
    }

    render(<ExerciseDisplay {...mockProps} exercise={exerciseWithoutCategory} />)
    
    expect(screen.queryByText('strength')).not.toBeInTheDocument()
  })

  it('should handle exercise without instructions', () => {
    const exerciseWithoutInstructions = {
      ...mockExercise,
      instructions: null
    }

    render(<ExerciseDisplay {...mockProps} exercise={exerciseWithoutInstructions} showInstructions={true} />)
    
    expect(screen.queryByText('Lie on bench and press barbell')).not.toBeInTheDocument()
  })

  it('should render target muscles', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    expect(screen.getByText('chest')).toBeInTheDocument()
  })

  it('should render secondary muscles', () => {
    render(<ExerciseDisplay {...mockProps} />)
    
    expect(screen.getByText('triceps')).toBeInTheDocument()
  })

  it('should handle exercise without secondary muscles', () => {
    const exerciseWithoutSecondary = {
      ...mockExercise,
      secondaryMuscles: null
    }

    render(<ExerciseDisplay {...mockProps} exercise={exerciseWithoutSecondary} />)
    
    expect(screen.queryByText('triceps')).not.toBeInTheDocument()
  })
}) 