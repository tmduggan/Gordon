import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Trophy } from 'lucide-react';
import React from 'react';

const PersonalBestsDisplay = ({ exerciseId, exerciseDetails, userProfile }) => {
  if (!userProfile?.personalBests?.[exerciseId]) {
    return null;
  }

  const bests = userProfile.personalBests[exerciseId];
  const { name } = exerciseDetails;

  const formatValue = (best) => {
    if (!best) return 'N/A';

    switch (best.type) {
      case '1rm':
        return `${Math.round(best.value)} lbs`;
      case 'reps':
        return `${Math.round(best.value)} reps`;
      case 'duration':
        return `${Math.round(best.value)} min`;
      case 'pace':
        return `${best.value.toFixed(1)} min/unit`;
      default:
        return `${Math.round(best.value)}`;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Personal Bests - {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Current (1 month):</span>
            </div>
            <div className="pl-6">
              <div className="text-lg font-bold">
                {formatValue(bests.current)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(bests.current?.date)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">Quarter (3 months):</span>
            </div>
            <div className="pl-6">
              <div className="text-lg font-bold">
                {formatValue(bests.quarter)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(bests.quarter?.date)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Year:</span>
            </div>
            <div className="pl-6">
              <div className="text-lg font-bold">{formatValue(bests.year)}</div>
              <div className="text-xs text-gray-500">
                {formatDate(bests.year?.date)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">All Time:</span>
            </div>
            <div className="pl-6">
              <div className="text-lg font-bold">
                {formatValue(bests.allTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(bests.allTime?.date)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalBestsDisplay;
