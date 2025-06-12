import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';

export default function Auth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <img 
          src={user.photoURL} 
          alt={user.displayName} 
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm">{user.displayName}</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
    >
      <img 
        src="https://www.google.com/favicon.ico" 
        alt="Google" 
        className="w-4 h-4"
      />
      Sign in with Google
    </button>
  );
} 