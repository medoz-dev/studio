
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { addYears } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

// IMPORTANT: Remplacez cette adresse e-mail par la vôtre.
const SUPER_ADMIN_EMAIL = "admin@inventairepro.com";

interface AppUser {
    id: string;
    email: string;
    name?: string;
    finAbonnement?: Timestamp;
}

const getSubscriptionStatus = (finAbonnement?: Timestamp): { text: string; variant: "default" | "secondary" | "destructive" } => {
    if (!finAbonnement) {
        return { text: "Essai/Inactif", variant: "secondary" };
    }
    const expiryDate = finAbonnement.toDate();
    if (expiryDate >= new Date()) {
        return { text: "Actif", variant: "default" };
    }
    return { text: "Expiré", variant: "destructive" };
};


export default function SuperAdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (user?.email !== SUPER_ADMIN_EMAIL) return;

        const usersColRef = collection(db, 'users');
        const unsubscribe = onSnapshot(usersColRef, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
            setUsers(usersData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleActivateSubscription = async (userId: string) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const newExpiryDate = addYears(new Date(), 1);
            await updateDoc(userDocRef, {
                finAbonnement: Timestamp.fromDate(newExpiryDate)
            });
            toast({
                title: "Succès",
                description: "L'abonnement a été activé pour un an.",
            });
        } catch (error) {
            console.error("Erreur d'activation:", error);
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour l'abonnement.",
                variant: "destructive",
            });
        }
    };
    
    if (user?.email !== SUPER_ADMIN_EMAIL) {
        return (
            <div className="flex h-screen w-full items-center justify-center text-center">
                <div>
                    <h1 className="text-2xl font-bold text-destructive">Accès non autorisé</h1>
                    <p className="text-muted-foreground">Cette page est réservée à l'administrateur.</p>
                    <Link href="/" className="mt-4 inline-block">
                        <Button>Retour à l'accueil</Button>
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <>
           <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-6 text-center relative">
                     <div className="absolute top-1/2 -translate-y-1/2 left-4">
                        <Link href="/">
                            <Button variant="secondary" size="icon">
                                <ArrowLeft />
                                <span className="sr-only">Retour</span>
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold font-headline">Super Administration</h1>
                    <p className="text-lg mt-2">Gestion des utilisateurs et des abonnements</p>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Utilisateurs</CardTitle>
                        <CardDescription>Visualisez et gérez les abonnements de tous les utilisateurs inscrits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <p className="text-center text-muted-foreground py-12">Chargement des utilisateurs...</p>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Statut Abonnement</TableHead>
                                            <TableHead>Date d'expiration</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map(u => {
                                            const status = getSubscriptionStatus(u.finAbonnement);
                                            return (
                                                <TableRow key={u.id}>
                                                    <TableCell className="font-medium">{u.email}</TableCell>
                                                    <TableCell>{u.name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={status.variant}>{status.text}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {u.finAbonnement ? u.finAbonnement.toDate().toLocaleDateString('fr-FR') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" onClick={() => handleActivateSubscription(u.id)}>Activer pour 1 an</Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    )
}
