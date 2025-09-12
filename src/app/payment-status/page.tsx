
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentStatusPage() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulating a delay to process payment status, in a real scenario
        // this might involve a check with your backend.
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Vérification du statut du paiement en cours...</p>
                </div>
            );
        }

        if (status === 'success') {
            return (
                <div className="flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl mb-2">Paiement Réussi !</CardTitle>
                    <CardDescription>
                        Votre abonnement a été activé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités.
                    </CardDescription>
                </div>
            );
        }
        
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <XCircle className="h-16 w-16 text-destructive mb-4" />
                <CardTitle className="text-2xl mb-2">Échec du Paiement</CardTitle>
                <CardDescription>
                    Une erreur est survenue lors de la transaction. Veuillez réessayer ou contacter le support si le problème persiste.
                </CardDescription>
            </div>
        );
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <h1 className="text-3xl font-bold text-primary">Inventaire Pro</h1>
                </CardHeader>
                <CardContent className="p-8">
                    {renderContent()}
                </CardContent>
                <div className="p-6 border-t">
                    {!isLoading && (
                         <Link href="/dashboard">
                            <Button className="w-full">
                                {status === 'success' ? "Accéder à l'application" : "Retourner à l'accueil"}
                            </Button>
                        </Link>
                    )}
                </div>
            </Card>
        </main>
    );
}

    