import React from 'react';
import { auth, googleProvider, signInWithPopup } from './firebase';
import { Button } from "@/components/ui/button";
import { Chrome } from 'lucide-react';

export default function Auth() {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">GORDON</h1>
        <p className="text-lg text-gray-600 mb-8">Your Personal Nutrition and Fitness Coach</p>
        <Button onClick={handleGoogleSignIn} size="lg">
          <Chrome className="mr-2 h-4 w-4" /> Login with Google
        </Button>
      </div>
    </div>
  );
} 