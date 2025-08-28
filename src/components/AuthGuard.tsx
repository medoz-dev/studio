
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/login', '/payment-status'];

function SubscriptionModal({ isOpen, contactInfo }: { isOpen: boolean, contactInfo: string }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const handleRenew = () => {
    setIsRedirecting(true);
    // TODO: Remplacer par le vrai lien de paiement Lygos
    window.location.href = 'https://votre-lien-de-paiement.lygos.com'; 
  };

  return (
    <Dialog open={isOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-md">
            <DialogHeader>
                <DialogTitle>Abonnement Expiré ou Inactif</DialogTitle>
                <DialogDescription>
                    Votre abonnement a expiré ou votre période d'essai est terminée. Pour continuer à utiliser toutes les fonctionnalités, veuillez renouveler votre abonnement.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                 <p className="text-muted-foreground mb-4">Cliquez sur le bouton ci-dessous pour procéder au paiement sécurisé.</p>
                 <Button onClick={handleRenew} disabled={isRedirecting} className="w-full">
                   {isRedirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {isRedirecting ? 'Redirection vers le paiement...' : 'Renouveler mon abonnement'}
                 </Button>
            </div>
            <DialogFooter className="text-xs text-muted-foreground text-center justify-center">
              Pour toute question, contactez le support à {contactInfo}
            </DialogFooter>
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
    
    if (user && (pathname === '/login')) {
      router.push('/');
      return;
    }

    if (user && !pathIsPublic) {
      setIsCheckingSubscription(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        let isActive = false;
        if (docSnap.exists() && docSnap.data().finAbonnement) {
          const finAbonnementData = docSnap.data().finAbonnement;
          
          // Firestore Timestamps can be objects with toDate() method
          const finAbonnement = finAbonnementData instanceof Timestamp 
            ? finAbonnementData.toDate() 
            : new Date(finAbonnementData);
          
          if (finAbonnement instanceof Date && !isNaN(finAbonnement.getTime()) && finAbonnement >= new Date()) {
            isActive = true;
          }

        } else if (user.metadata.creationTime) {
          // Default 3-day trial period if no subscription date is set
          const creationTime = new Date(user.metadata.creationTime);
          const trialEndDate = new Date(creationTime.setDate(creationTime.getDate() + 3));
          if (trialEndDate >= new Date()) {
            isActive = true;
          }
        }
        setIsSubscriptionActive(isActive);
        setIsCheckingSubscription(false);
      }, (error) => {
          console.error("Error checking subscription:", error);
          setIsSubscriptionActive(false);
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
  
  if (user) {
    if(pathIsPublic || isSubscriptionActive) {
      return <>{children}</>;
    } else {
      // Don't show modal on public pages even if subscription is inactive
      if (pathIsPublic) return <>{children}</>;
      return <SubscriptionModal isOpen={true} contactInfo="contact@inventairepro.com" />;
    }
  }

  // Fallback for login pages when user is not logged in
  if (!user && (pathname === '/login')) {
    return <>{children}</>;
  }

  return null;
}
