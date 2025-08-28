
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { listUsers, updateUserSubscription, type UserInfo } from '@/ai/flows/user-management-flow';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SUPER_ADMIN_EMAIL = "melchiorganglo642@gmail.com";

export default function SuperAdminPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchUsers = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userList = await listUsers(user.email!);
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast({ title: "Erreur", description: "Impossible de charger la liste des utilisateurs.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!authLoading) {
            if (!user || user.email !== SUPER_ADMIN_EMAIL) {
                router.push('/'); // Redirect if not super admin
            } else {
                fetchUsers();
            }
        }
    }, [user, authLoading, router]);

    const handleUpdateSubscription = async (userId: string, duration: '1m' | '6m' | '1y') => {
        if (!user) return;
        try {
            await updateUserSubscription({ adminEmail: user.email!, userId, duration });
            toast({ title: "Succès", description: "Abonnement mis à jour." });
            fetchUsers(); // Refresh the user list
        } catch (error) {
             toast({ title: "Erreur", description: "La mise à jour de l'abonnement a échoué.", variant: "destructive" });
        }
    };
    
    const getSubscriptionStatus = (finAbonnement?: string, creationTime?: string) => {
        const today = new Date();
        
        if (finAbonnement) {
            const endDate = parseISO(finAbonnement);
            const remainingDays = differenceInDays(endDate, today);
            if (remainingDays >= 0) {
                return <span className="text-green-600 font-semibold">Actif ({remainingDays}j restants)</span>;
            }
            return <span className="text-red-600 font-semibold">Expiré</span>;
        }

        if (creationTime) {
            const trialEndDate = new Date(creationTime);
            trialEndDate.setDate(trialEndDate.getDate() + 3);
            const remainingTrialDays = differenceInDays(trialEndDate, today);
            if (remainingTrialDays >= 0) {
                return <span className="text-yellow-600 font-semibold">En Essai ({remainingTrialDays}j restants)</span>;
            }
             return <span className="text-red-600 font-semibold">Essai Terminé</span>;
        }
        
        return <span className="text-gray-500">N/A</span>;
    };


    if (authLoading || isLoading) {
        return <div className="container mx-auto p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" />Chargement...</div>;
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
                    <h1 className="text-4xl font-bold font-headline">Panneau Super Admin</h1>
                    <p className="text-lg mt-2">Gestion des abonnements utilisateurs</p>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Utilisateurs</CardTitle>
                        <CardDescription>Visualisez et gérez les abonnements de tous les clients.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Statut Abonnement</TableHead>
                                        <TableHead>Date d'expiration</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.uid}>
                                            <TableCell className="font-medium">{u.email}</TableCell>
                                            <TableCell>{getSubscriptionStatus(u.finAbonnement, u.creationTime)}</TableCell>
                                            <TableCell>
                                                {u.finAbonnement 
                                                    ? format(parseISO(u.finAbonnement), 'd MMMM yyyy', { locale: fr }) 
                                                    : '---'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                               <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline">
                                                            <KeyRound className="mr-2 h-4 w-4" />
                                                            Gérer l'abonnement
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => handleUpdateSubscription(u.uid, '1m')}>
                                                            Activer/Prolonger 1 Mois
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateSubscription(u.uid, '6m')}>
                                                            Activer/Prolonger 6 Mois
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateSubscription(u.uid, '1y')}>
                                                            Activer/Prolonger 1 An
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
