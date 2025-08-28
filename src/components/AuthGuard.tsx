
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
                 <p className="text-muted-foreground">Contactez le service client pour procéder au renouvellement.</p>
                 <a href={`https://wa.me/${contactInfo.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full mt-2 bg-green-500 hover:bg-green-600">
                        Contacter sur WhatsApp
                    </Button>
                 </a>
            </div>
            <DialogFooter className="text-xs text-muted-foreground text-center justify-center">
              Numéro de contact : {contactInfo}
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
    const isSuperAdminPage = pathname === '/superadmin';

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
      if (pathIsPublic) return <>{children}</>;
      return <SubscriptionModal isOpen={true} contactInfo="+229 0161170017" />;
    }
  }

  // Fallback for login pages when user is not logged in
  if (!user && (pathname === '/login')) {
    return <>{children}</>;
  }

  return null;
}
