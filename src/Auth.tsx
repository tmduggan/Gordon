import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import React from 'react';
import { auth, googleProvider, signInWithPopup } from './firebase';

export default function Auth(): JSX.Element {
  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <img
          src="/exercise-favicon.png"
          alt="Goliath Logo"
          className="mx-auto mb-6 w-28 h-28"
        />
        <h1
          className="text-5xl font-extrabold mb-8 tracking-widest"
          style={{ fontFamily: 'Bebas Neue, Impact, sans-serif' }}
        >
          GOLIATH
        </h1>
        <Button onClick={handleGoogleSignIn} size="lg">
          <Chrome className="mr-2 h-4 w-4" /> Login with Google
        </Button>
      </div>
    </div>
  );
} 