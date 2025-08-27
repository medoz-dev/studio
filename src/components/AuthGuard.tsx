
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';

const publicPaths = ['/login', '/signup'];

function SubscriptionModal({ isOpen, contactInfo }: { isOpen: boolean, contactInfo: string }) {
  return (
    <Dialog open={isOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Abonnement Expiré ou Inactif</DialogTitle>
                <DialogDescription>
                    Votre abonnement a expiré ou vous êtes en fin de période d'essai. Pour continuer à utiliser toutes les fonctionnalités, veuillez renouveler votre abonnement.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <p className="font-semibold text-center text-lg">Contactez le support pour réactiver votre compte :</p>
                <p className="text-center text-2xl font-bold text-primary mt-2">{contactInfo}</p>
            </div>
        </DialogContent>
    </Dialog>
  )
}


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const pathIsPublic = publicPaths.includes(pathname);

    if (!user && !pathIsPublic) {
      router.push('/login');
      return;
    } 
    
    if (user && pathIsPublic) {
      router.push('/');
      return;
    }

    if (user && !pathIsPublic) {
      setIsCheckingSubscription(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        let isActive = false;
        if (docSnap.exists() && docSnap.data().finAbonnement) {
          const finAbonnement = new Date(docSnap.data().finAbonnement);
          if (finAbonnement >= new Date()) {
            isActive = true;
          }
        } else {
          // Default 3-day trial period if no subscription date is set
          const creationTime = new Date(user.metadata.creationTime || Date.now());
          const trialEndDate = new Date(creationTime.setDate(creationTime.getDate() + 3));
          if (trialEndDate >= new Date()) {
            isActive = true;
          }
        }
        setIsSubscriptionActive(isActive);
        setIsCheckingSubscription(false);
      });

      return () => unsubscribe();
    } else {
      setIsCheckingSubscription(false);
    }

  }, [user, isLoading, router, pathname]);

  if (isLoading || isCheckingSubscription) {
    return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
  }
  
  const pathIsPublic = publicPaths.includes(pathname);

  if (!user && pathIsPublic) {
    return <>{children}</>;
  }
  
  if (user && !pathIsPublic) {
    if(isSubscriptionActive) {
      return <>{children}</>;
    } else {
      // Show subscription expired modal instead of content
      return <SubscriptionModal isOpen={true} contactInfo="contact@inventairepro.com" />;
    }
  }

  return null;
}
