import React from 'react';
import useScoreProgress from '../../hooks/useScoreProgress';
import useAuthStore from '../../store/useAuthStore';
import useLibrary from '../../hooks/useLibrary';
import useCart from '../../hooks/useCart';
import useHistory from '../../hooks/useHistory';

export default function ScoreDisplay({ type, className = "" }) {
  const { user, userProfile } = useAuthStore();
  const { logs } = useHistory(type);
  const library = useLibrary(type);
  const cart = useCart(type);
  const { dailyScore } = useScoreProgress(logs, library.items, cart, userProfile);
  
  return (
    <div className={`text-right ${className}`}>
      <div className="text-lg font-bold text-green-600">{dailyScore}</div>
      <div className="text-xs text-gray-500">Points Today</div>
    </div>
  );
} 