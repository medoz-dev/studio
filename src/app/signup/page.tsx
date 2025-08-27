
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Succès", description: "Compte créé avec succès! Vous pouvez maintenant vous connecter." });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Inscription</CardTitle>
          <CardDescription>
            Créez un compte pour commencer à gérer votre inventaire.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Création en cours...' : "S'inscrire"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Vous avez déjà un compte?{' '}
              <Link href="/login" className="underline font-semibold">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
