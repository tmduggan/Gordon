import { useState, useCallback } from 'react';

export function useExerciseCart() {
  const [exerciseCart, setExerciseCart] = useState([]);
  const [currentLogData, setCurrentLogData] = useState({});

  // Time and date state for the cart
  const now = new Date();
  const [datePart, setDatePart] = useState(() => now.toISOString().slice(0, 10));
  const [timePart, setTimePart] = useState(() => now.toTimeString().slice(0, 5));
    
  const addToExerciseCart = useCallback((exercise) => {
    setExerciseCart(cart => {
      const isPresent = cart.some(item => item.id === exercise.id);
      if (isPresent) {
        return cart;
      }

      // When adding a new exercise, also initialize its log data with a default set.
      setCurrentLogData(prevLogData => {
        const isBodyweight = exercise.equipment === 'body weight';
        const defaultSet = isBodyweight
            ? { reps: '' }
            : { weight: '', reps: '', duration: '' };

        return {
          ...prevLogData,
          [exercise.id]: [defaultSet]
        };
      });

      return [...cart, { ...exercise }];
    });
  }, []);

  const removeFromExerciseCart = useCallback((exerciseId) => {
    setExerciseCart(cart => cart.filter(item => item.id !== exerciseId));
    setCurrentLogData(prev => {
        const newLogData = { ...prev };
        delete newLogData[exerciseId];
        return newLogData;
    });
  }, []);

  const handleLogDataChange = useCallback((exerciseId, logData) => {
    setCurrentLogData(prev => ({ ...prev, [exerciseId]: logData }));
  }, []);

  const clearCart = useCallback(() => {
    setExerciseCart([]);
    setCurrentLogData({});
  }, []);

  return {
    exerciseCart,
    currentLogData,
    datePart,
    setDatePart,
    timePart,
    setTimePart,
    addToExerciseCart,
    removeFromExerciseCart,
    handleLogDataChange,
    clearCart,
  };
} 