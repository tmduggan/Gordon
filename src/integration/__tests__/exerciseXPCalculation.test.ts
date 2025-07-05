import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CartContainer from '../../components/shared/Cart/CartContainer';

// Mock dependencies
const mockAddXP = vi.fn();
const mockClearCart = vi.fn();

vi.mock('../../store/useAuthStore', () => ({
  default: () => ({
    user: { uid: 'test-user-id' },
    userProfile: { totalXP: 100, muscleReps: {} },
    addXP: mockAddXP,
    saveUserProfile: vi.fn(),
  }),
}));

vi.mock('../../services/firebase/firestore/logExerciseEntry', () => ({
  saveWorkoutLog: vi.fn(),
}));

const mockCalculateExerciseScore = vi.fn();
vi.mock('../../services/exercise/exerciseService', () => ({
  calculateExerciseScore: mockCalculateExerciseScore,
}));

vi.mock('../../services/gamification/levelService', () => ({
  calculateStreakBonuses: vi.fn(() => ({ totalBonus: 0, streaks: [] })),
}));

vi.mock('../../services/gamification/suggestionService', () => ({
  analyzeLaggingMuscles: vi.fn(() => []),
  calculateLaggingMuscleBonus: vi.fn(() => 0),
}));

// Helper function to match the app's XP logic
function calculateExpectedXP(sets: any[] = [], duration: number | null = null) {
  let totalXP = 0;
  if (sets && sets.length > 0) {
    sets.forEach((set) => {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps) || 0;
      if (weight > 0) {
        totalXP += Math.round(reps * weight * 0.1);
      } else if (reps > 0) {
        totalXP += reps;
      }
    });
  }
  if (duration) {
    totalXP += parseInt(duration.toString()) * 2;
  }
  return totalXP;
}

describe('Exercise XP Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateExerciseScore.mockImplementation(
      (workoutData: any, exerciseDetails: any) => {
        if (workoutData.sets && workoutData.sets.length > 0) {
          const set = workoutData.sets[0];
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          if (weight > 0) {
            return Math.round(reps * weight * 0.1);
          } else if (reps > 0) {
            return reps;
          }
        }
        if (workoutData.duration) {
          return parseInt(workoutData.duration) * 2;
        }
        return 0;
      }
    );
  });

  it('calculates XP for weighted strength exercises', async () => {
    const user = userEvent.setup();
    const exerciseItems = [{ id: 'bench-press', name: 'Bench Press' }];
    const sets = [
      { weight: 135, reps: 10 },
      { weight: 155, reps: 8 },
    ];
    const logData = { 'bench-press': { sets } };
    const exerciseLibrary = [
      { id: 'bench-press', name: 'Bench Press', target: 'chest' },
    ];
    const expectedXP = calculateExpectedXP(sets);
    render(
      <CartContainer
        title="Exercise Cart"
        type="exercise"
        items={exerciseItems}
        logCart={async () => {
          await mockAddXP(expectedXP);
          mockClearCart();
        }}
        clearCart={mockClearCart}
        icon="💪"
        logData={logData}
        exerciseLibrary={exerciseLibrary}
        onLogDataChange={vi.fn()}
      />
    );
    const xpElement = screen.getByText(expectedXP.toString());
    expect(parseInt(xpElement.textContent || '0')).toBe(expectedXP);
    const logButton = screen.getByRole('button', { name: /log items/i });
    await user.click(logButton);
    expect(mockAddXP).toHaveBeenCalledWith(expectedXP);
  });

  it('calculates XP for bodyweight strength exercises', async () => {
    const user = userEvent.setup();
    const exerciseItems = [{ id: 'pushups', name: 'Push-ups' }];
    const sets = [
      { weight: 0, reps: 15 },
      { weight: 0, reps: 12 },
      { weight: 0, reps: 10 },
    ];
    const logData = { pushups: { sets } };
    const exerciseLibrary = [
      { id: 'pushups', name: 'Push-ups', target: 'chest' },
    ];
    const expectedXP = calculateExpectedXP(sets);
    render(
      <CartContainer
        title="Exercise Cart"
        type="exercise"
        items={exerciseItems}
        logCart={async () => {
          await mockAddXP(expectedXP);
          mockClearCart();
        }}
        clearCart={mockClearCart}
        icon="💪"
        logData={logData}
        exerciseLibrary={exerciseLibrary}
        onLogDataChange={vi.fn()}
      />
    );
    const xpElement = screen.getByText(expectedXP.toString());
    expect(parseInt(xpElement.textContent || '0')).toBe(expectedXP);
    const logButton = screen.getByRole('button', { name: /log items/i });
    await user.click(logButton);
    expect(mockAddXP).toHaveBeenCalledWith(expectedXP);
  });

  it('calculates XP for cardio (duration-based) exercises', async () => {
    const user = userEvent.setup();
    const exerciseItems = [{ id: 'running', name: 'Running' }];
    const duration = 30;
    const logData = { running: { duration } };
    const exerciseLibrary = [
      { id: 'running', name: 'Running', target: 'cardio' },
    ];
    const expectedXP = calculateExpectedXP([], duration);
    render(
      <CartContainer
        title="Exercise Cart"
        type="exercise"
        items={exerciseItems}
        logCart={async () => {
          await mockAddXP(expectedXP);
          mockClearCart();
        }}
        clearCart={mockClearCart}
        icon="🏃"
        logData={logData}
        exerciseLibrary={exerciseLibrary}
        onLogDataChange={vi.fn()}
      />
    );
    const xpElement = screen.getByText(expectedXP.toString());
    expect(parseInt(xpElement.textContent || '0')).toBe(expectedXP);
    const logButton = screen.getByRole('button', { name: /log items/i });
    await user.click(logButton);
    expect(mockAddXP).toHaveBeenCalledWith(expectedXP);
  });

  it('calculates XP for mixed strength and cardio', async () => {
    const user = userEvent.setup();
    const exerciseItems = [
      { id: 'bench-press', name: 'Bench Press' },
      { id: 'running', name: 'Running' },
    ];
    const logData = {
      'bench-press': { sets: [{ weight: 135, reps: 10 }] },
      running: { duration: 20 },
    };
    const exerciseLibrary = [
      { id: 'bench-press', name: 'Bench Press', target: 'chest' },
      { id: 'running', name: 'Running', target: 'cardio' },
    ];
    const expectedXP =
      calculateExpectedXP(logData['bench-press'].sets) +
      calculateExpectedXP([], logData['running'].duration);
    render(
      <CartContainer
        title="Exercise Cart"
        type="exercise"
        items={exerciseItems}
        logCart={async () => {
          await mockAddXP(expectedXP);
          mockClearCart();
        }}
        clearCart={mockClearCart}
        icon="💪"
        logData={logData}
        exerciseLibrary={exerciseLibrary}
        onLogDataChange={vi.fn()}
      />
    );
    const xpElement = screen.getByText(expectedXP.toString());
    expect(parseInt(xpElement.textContent || '0')).toBe(expectedXP);
    const logButton = screen.getByRole('button', { name: /log items/i });
    await user.click(logButton);
    expect(mockAddXP).toHaveBeenCalledWith(expectedXP);
  });

  it('handles exercises with no sets or duration', async () => {
    const user = userEvent.setup();
    const exerciseItems = [{ id: 'stretching', name: 'Stretching' }];
    const logData = { stretching: {} };
    const exerciseLibrary = [
      { id: 'stretching', name: 'Stretching', target: 'flexibility' },
    ];
    const expectedXP = 0;
    render(
      <CartContainer
        title="Exercise Cart"
        type="exercise"
        items={exerciseItems}
        logCart={async () => {
          await mockAddXP(expectedXP);
          mockClearCart();
        }}
        clearCart={mockClearCart}
        icon="🧘"
        logData={logData}
        exerciseLibrary={exerciseLibrary}
        onLogDataChange={vi.fn()}
      />
    );
    const xpElement = screen.getByText(expectedXP.toString());
    expect(parseInt(xpElement.textContent || '0')).toBe(expectedXP);
    const logButton = screen.getByRole('button', { name: /log items/i });
    await user.click(logButton);
    expect(mockAddXP).toHaveBeenCalledWith(expectedXP);
  });
}); 