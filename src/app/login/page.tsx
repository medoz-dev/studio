
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Succès", description: "Connexion réussie!" });
      router.push('/');
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({
            title: "Erreur",
            description: "Veuillez entrer votre adresse e-mail.",
            variant: "destructive",
        });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: "Succès",
            description: "Un e-mail de réinitialisation a été envoyé à votre adresse.",
        });
    } catch (error: any) {
        toast({
            title: "Erreur",
            description: "Impossible d'envoyer l'e-mail. Vérifiez l'adresse.",
            variant: "destructive",
        });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez votre email et mot de passe pour accéder à votre inventaire.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@exemple.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
               <div className="text-right text-sm">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button type="button" className="underline font-semibold text-primary">Mot de passe oublié ?</button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Entrez votre adresse e-mail ci-dessous. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="reset-email" className="sr-only">Email</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="m@exemple.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePasswordReset}>Envoyer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Vous n'avez pas de compte?{' '}
              <Link href="/signup" className="underline font-semibold">
                S'inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
