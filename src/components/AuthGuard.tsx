
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { addMonths } from 'date-fns';


const publicPaths = ['/login', '/payment-status'];
const CONTACT_PHONE = "+22961170017";

function SubscriptionModal({ isOpen }: { isOpen: boolean }) {

  return (
    <Dialog open={isOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-md">
            <DialogHeader>
                <DialogTitle>Abonnement Expiré ou Inactif</DialogTitle>
                <DialogDescription>
                    Votre abonnement a expiré ou votre période d'essai est terminée. Pour continuer à utiliser l'application, veuillez renouveler votre abonnement.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                 <p className="text-muted-foreground">Contactez Melchior Codex pour procéder au renouvellement.</p>
                 <a href={`https://wa.me/${CONTACT_PHONE.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full mt-2 bg-green-500 hover:bg-green-600">
                        Contacter sur WhatsApp
                    </Button>
                 </a>
                  <a href="mailto:melchiorganglo@gmail.com">
                    <Button variant="outline" className="w-full mt-2">
                        Envoyer un Email
                    </Button>
                 </a>
            </div>
            <DialogFooter className="text-xs text-muted-foreground text-center justify-center pt-4 border-t">
              <p>Contact: {CONTACT_PHONE}</p>
              <p>Email: melchiorganglo@gmail.com</p>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    const pathIsPublic = publicPaths.includes(pathname);
    
    if (!user) {
      if (!pathIsPublic) {
        router.push('/login');
      }
      setIsCheckingSubscription(false);
      return;
    }
    
    // User is logged in
    if (pathIsPublic) {
      router.push('/');
      setIsCheckingSubscription(false);
      return;
    }

    // For other protected routes, check subscription
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      let isActive = false;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.finAbonnement && data.finAbonnement instanceof Timestamp) {
          const finAbonnement = data.finAbonnement.toDate();
          if (finAbonnement >= new Date()) {
            isActive = true;
          }
        }
      } 
      
      if (!isActive && user.metadata.creationTime) {
        // Fallback to trial period if no active subscription
        const creationTime = new Date(user.metadata.creationTime);
        const trialEndDate = addMonths(creationTime, 1);
        trialEndDate.setHours(23, 59, 59, 999);
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

  }, [user, authLoading, router, pathname]);

  const isChecking = authLoading || (isCheckingSubscription && !publicPaths.includes(pathname));

  if (isChecking) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Chargement...</p>
        </div>
    );
  }
  
  if (user) {
     if (publicPaths.includes(pathname)) {
        return null;
    }
    
    if (!isSubscriptionActive) {
      return <SubscriptionModal isOpen={true} />;
    }
    
    return <>{children}</>;
  }

  // User is not logged in
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  return null;
}
