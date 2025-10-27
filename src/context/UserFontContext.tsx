
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const UserFontContext = createContext({});

export const UserFontProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [fontClass, setFontClass] = useState('font-body');

  useEffect(() => {
    if (authLoading) return;

    let unsubscribe = () => {};

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const savedFont = data.preferences?.font || 'font-body';
          
          // Remove previous font class from body
          document.body.classList.remove(
            'font-body',
            'font-roboto',
            'font-merriweather',
            'font-lobster'
          );
          
          // Add new font class
          document.body.classList.add(savedFont);
          setFontClass(savedFont);
        }
      });
    } else {
        // Apply default font for logged-out users
        document.body.classList.remove(
          'font-roboto',
          'font-merriweather',
          'font-lobster'
        );
        document.body.classList.add('font-body');
        setFontClass('font-body');
    }

    return () => unsubscribe();
  }, [user, authLoading]);

  // We don't need to provide anything in the context value for this implementation
  // as it directly manipulates the body class. The wrapper itself is what's important.
  return (
    <UserFontContext.Provider value={{}}>
      {children}
    </UserFontContext.Provider>
  );
};

export const useUserFont = () => useContext(UserFontContext);
