
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useManagers } from "@/hooks/useManagers";
import { type Manager } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, PlusCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ManagersClient() {
    const { managers, addManager, updateManager, deleteManager, isLoading } = useManagers();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingManager, setEditingManager] = useState<Manager | null>(null);
    const { toast } = useToast();

    const openAddDialog = () => {
        setEditingManager(null);
        setIsFormOpen(true);
    };

    const openEditDialog = (manager: Manager) => {
        setEditingManager(manager);
        setIsFormOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Chargement des gérants...</p>
            </div>
        );
    }

    return (
        <>
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-6 text-center relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-4">
                        <Link href="/admin">
                            <Button variant="secondary" size="icon">
                                <ArrowLeft />
                                <span className="sr-only">Retour</span>
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold font-headline">Gestion des Gérants</h1>
                    <p className="text-lg mt-2">Ajoutez ou modifiez les informations de vos gérants.</p>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Liste des Gérants</CardTitle>
                                <CardDescription>Gérez les employés qui peuvent être assignés aux inventaires.</CardDescription>
                            </div>
                            <Button onClick={openAddDialog}>
                                <PlusCircle className="mr-2" /> Ajouter un gérant
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Téléphone</TableHead>
                                        <TableHead>Date d'entrée</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {managers.map((manager) => (
                                        <TableRow key={manager.id}>
                                            <TableCell className="font-medium">{manager.nom}</TableCell>
                                            <TableCell>{manager.telephone}</TableCell>
                                            <TableCell>{format(new Date(manager.dateEntree), 'd MMMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(manager)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Cette action est irréversible. Cela supprimera définitivement le gérant "{manager.nom}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction onClick={async () => {
                                                                await deleteManager(manager.id);
                                                                toast({ title: "Succès", description: "Gérant supprimé." });
                                                            }}>Supprimer</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <ManagerFormDialog
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                manager={editingManager}
                addManager={addManager}
                updateManager={updateManager}
                existingManagers={managers}
            />
        </>
    );
}

interface ManagerFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    manager: Manager | null;
    addManager: (manager: Omit<Manager, 'id'>) => Promise<void>;
    updateManager: (id: string, manager: Partial<Manager>) => Promise<void>;
    existingManagers: Manager[];
}

function ManagerFormDialog({ isOpen, setIsOpen, manager, addManager, updateManager, existingManagers }: ManagerFormDialogProps) {
    const [formData, setFormData] = useState<Partial<Manager>>({});
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (manager) {
                setFormData(manager);
            } else {
                setFormData({
                    nom: '',
                    telephone: '',
                    dateEntree: new Date().toISOString().split('T')[0],
                });
            }
        }
    }, [manager, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const nom = formData.nom?.trim();
        if (!nom) {
            toast({ title: "Erreur", description: "Le nom du gérant est requis.", variant: "destructive" });
            return;
        }

        if (!manager && existingManagers.some(m => m.nom.toLowerCase() === nom.toLowerCase())) {
            toast({ title: "Erreur", description: "Un gérant avec ce nom existe déjà.", variant: "destructive" });
            return;
        }

        const finalManager = {
            nom,
            telephone: formData.telephone || '',
            dateEntree: formData.dateEntree || new Date().toISOString().split('T')[0],
        };

        try {
            if (manager) {
                await updateManager(manager.id, finalManager);
                toast({ title: "Succès", description: "Gérant mis à jour." });
            } else {
                await addManager(finalManager);
                toast({ title: "Succès", description: "Gérant ajouté." });
            }
            setIsOpen(false);
        } catch (error: any) {
             toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{manager ? 'Modifier le gérant' : 'Ajouter un nouveau gérant'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nom" className="text-right">Nom</Label>
                        <Input id="nom" name="nom" value={formData.nom || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="telephone" className="text-right">Téléphone</Label>
                        <Input id="telephone" name="telephone" value={formData.telephone || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dateEntree" className="text-right">Date d'entrée</Label>
                        <Input id="dateEntree" name="dateEntree" type="date" value={formData.dateEntree || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{manager ? 'Enregistrer les modifications' : 'Ajouter le gérant'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
