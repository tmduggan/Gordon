import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PersonalBestsDisplay from './PersonalBestsDisplay';
import useAuthStore from '../../store/useAuthStore';

const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between text-sm py-2 border-b last:border-b-0">
            <span className="font-semibold text-gray-600 capitalize">{label}</span>
            <span className="text-right capitalize">{Array.isArray(value) ? value.join(', ') : value}</span>
        </div>
    );
};

const ExerciseInfoCard = ({ exercise }) => {
    const { userProfile } = useAuthStore();
    
    if (!exercise) return null;

    return (
        <div className="w-80">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="capitalize text-lg">{exercise.name || 'Exercise Details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <InfoRow label="Target Muscle" value={exercise.target} />
                    <InfoRow label="Body Part" value={exercise.bodyPart} />
                    <InfoRow label="Secondary Muscles" value={exercise.secondaryMuscles} />
                    <InfoRow label="Equipment" value={exercise.equipment} />
                    <InfoRow label="Difficulty" value={exercise.difficulty} />
                    <InfoRow label="Category" value={exercise.category} />
                </CardContent>
            </Card>
            
            <PersonalBestsDisplay 
                exerciseId={exercise.id} 
                exerciseDetails={exercise} 
                userProfile={userProfile} 
            />
        </div>
    );
};

export default ExerciseInfoCard; 