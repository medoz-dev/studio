
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { addDays, isBefore } from 'date-fns';


const publicPaths = ['/login', '/payment-status', '/'];
const CONTACT_PHONE = "+22961170017";

function SubscriptionBlockPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Abonnement Expiré</CardTitle>
          <CardDescription>
            Votre abonnement ou votre période d'essai est terminé. Pour continuer à utiliser Inventaire Pro, veuillez renouveler.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-muted-foreground mb-4">Contactez Melchior Codex pour procéder au renouvellement.</p>
          <div className="flex flex-col gap-2">
            <a href={`https://wa.me/${CONTACT_PHONE.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-green-500 hover:bg-green-600">
                Contacter sur WhatsApp
              </Button>
            </a>
            <a href="mailto:melchiorganglo@gmail.com">
              <Button variant="outline" className="w-full">
                Envoyer un Email
              </Button>
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-1 pt-6 text-xs text-muted-foreground">
          <p><strong>Contact:</strong> {CONTACT_PHONE}</p>
          <p><strong>Email:</strong> melchiorganglo@gmail.com</p>
        </CardFooter>
      </Card>
    </main>
  );
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
    
    // L'utilisateur est connecté
    if (pathIsPublic) {
      router.push('/dashboard');
      setIsCheckingSubscription(false);
      return;
    }

    // Pour les autres routes protégées, on vérifie l'abonnement
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      let isActive = false;
      const today = new Date();

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.finAbonnement && data.finAbonnement instanceof Timestamp) {
          if (isBefore(today, data.finAbonnement.toDate())) {
            isActive = true;
          }
        }
      } 
      
      // Si pas d'abonnement actif, on vérifie la période d'essai (fallback)
      if (!isActive && user.metadata.creationTime) {
        const creationTime = new Date(user.metadata.creationTime);
        const trialEndDate = addDays(creationTime, 5);
        if (isBefore(today, trialEndDate)) {
          isActive = true;
        }
      }

      setIsSubscriptionActive(isActive);
      setIsCheckingSubscription(false);
    }, (error) => {
      console.error("Erreur de vérification de l'abonnement:", error);
      setIsSubscriptionActive(false);
      setIsCheckingSubscription(false);
    });

    return () => unsubscribe();

  }, [user, authLoading, router, pathname]);


  const isChecking = authLoading || (user && isCheckingSubscription);

  // Écran de chargement pendant que l'authentification et la vérification de l'abonnement sont en cours
  if (isChecking && !publicPaths.includes(pathname)) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Vérification de l'accès...</p>
        </div>
    );
  }
  
  const pathIsPublic = publicPaths.includes(pathname);

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    // Si la page est publique, on l'affiche (ex: /login)
    if (pathIsPublic) {
      return <>{children}</>;
    }
    // Sinon (l'utilisateur tente d'accéder à une page protégée sans être connecté), on ne rend rien, useEffect a déjà redirigé.
    return null;
  }

  // Si l'utilisateur est connecté
  // Si l'abonnement est actif, on affiche l'application (pages non-publiques)
  if (isSubscriptionActive && !pathIsPublic) {
    return <>{children}</>;
  }
  
  // Si l'utilisateur est connecté mais tente d'accéder à une page publique, useEffect a déjà redirigé.
  if (pathIsPublic) {
      return null;
  }


  // Si l'abonnement N'EST PAS actif, on affiche UNIQUEMENT la page de blocage.
  return <SubscriptionBlockPage />;
}

    