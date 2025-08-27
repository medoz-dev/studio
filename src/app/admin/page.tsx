"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBoissons } from "@/hooks/useBoissons";
import { type Boisson } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, PlusCircle, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminPage() {
    const { boissons, addBoisson, updateBoisson, deleteBoisson, isLoading } = useBoissons();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBoisson, setEditingBoisson] = useState<Boisson | null>(null);
    const { toast } = useToast();

    const openAddDialog = () => {
        setEditingBoisson(null);
        setIsFormOpen(true);
    };

    const openEditDialog = (boisson: Boisson) => {
        setEditingBoisson(boisson);
        setIsFormOpen(true);
    };

    if (isLoading) {
        return <div className="container mx-auto p-8">Chargement de l'administration...</div>;
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
                    <h1 className="text-4xl font-bold font-headline">Administration</h1>
                    <p className="text-lg mt-2">Gestion des boissons</p>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Liste des Boissons</CardTitle>
                                <CardDescription>Ajoutez, modifiez ou supprimez des boissons de votre inventaire.</CardDescription>
                            </div>
                            <Button onClick={openAddDialog}>
                                <PlusCircle className="mr-2" /> Ajouter une boisson
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Prix (FCFA)</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Unités</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {boissons.map((boisson) => (
                                        <TableRow key={boisson.nom}>
                                            <TableCell className="font-medium">{boisson.nom}</TableCell>
                                            <TableCell>{boisson.prix.toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{boisson.type}</TableCell>
                                            <TableCell>{Array.isArray(boisson.trous) ? boisson.trous.join(' ou ') : boisson.trous}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(boisson)}>
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
                                                                Cette action est irréversible. Cela supprimera définitivement la boisson "{boisson.nom}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => {
                                                                deleteBoisson(boisson.nom);
                                                                toast({ title: "Succès", description: "Boisson supprimée." });
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
            <BoissonFormDialog
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                boisson={editingBoisson}
                addBoisson={addBoisson}
                updateBoisson={updateBoisson}
            />
        </>
    );
}


interface BoissonFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    boisson: Boisson | null;
    addBoisson: (boisson: Boisson) => void;
    updateBoisson: (nom: string, boisson: Boisson) => void;
}

function BoissonFormDialog({ isOpen, setIsOpen, boisson, addBoisson, updateBoisson }: BoissonFormDialogProps) {
    const [formData, setFormData] = useState<Partial<Boisson>>({});
    const { toast } = useToast();

    useEffect(() => {
        if (boisson) {
            setFormData({
                ...boisson,
                trous: Array.isArray(boisson.trous) ? boisson.trous.join(',') : boisson.trous?.toString()
            });
        } else {
            setFormData({
                nom: '',
                prix: 0,
                type: 'casier',
                trous: '',
                special: false,
                specialPrice: 0,
                specialUnit: 0,
            });
        }
    }, [boisson, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        const nom = formData.nom?.trim();
        if (!nom) {
            toast({ title: "Erreur", description: "Le nom de la boisson est requis.", variant: "destructive" });
            return;
        }

        const prix = Number(formData.prix);
        if (isNaN(prix) || prix < 0) {
            toast({ title: "Erreur", description: "Veuillez entrer un prix valide.", variant: "destructive" });
            return;
        }
        
        const trousString = String(formData.trous || '');
        let trous: number | number[];
        if (trousString.includes(',')) {
            trous = trousString.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
        } else {
            trous = Number(trousString);
            if (isNaN(trous)) trous = 0;
        }


        const finalBoisson: Boisson = {
            nom,
            prix,
            type: formData.type || 'casier',
            trous: trous,
            special: formData.special || false,
            specialPrice: Number(formData.specialPrice) || 0,
            specialUnit: Number(formData.specialUnit) || 0,
        };

        if (boisson) {
            updateBoisson(boisson.nom, finalBoisson);
            toast({ title: "Succès", description: "Boisson mise à jour." });
        } else {
            addBoisson(finalBoisson);
            toast({ title: "Succès", description: "Boisson ajoutée." });
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{boisson ? 'Modifier la boisson' : 'Ajouter une nouvelle boisson'}</DialogTitle>
                    <DialogDescription>
                        Remplissez les détails de la boisson ci-dessous.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nom" className="text-right">Nom</Label>
                        <Input id="nom" name="nom" value={formData.nom || ''} onChange={handleChange} className="col-span-3" disabled={!!boisson} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="prix" className="text-right">Prix</Label>
                        <Input id="prix" name="prix" type="number" value={formData.prix || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select name="type" value={formData.type} onValueChange={(val) => handleSelectChange('type', val)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="casier">Casier</SelectItem>
                                <SelectItem value="sachet">Sachet</SelectItem>
                                <SelectItem value="carton">Carton</SelectItem>
                                <SelectItem value="unite">Unité</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="trous" className="text-right">Unités</Label>
                        <Input id="trous" name="trous" value={formData.trous as string || ''} onChange={handleChange} className="col-span-3" placeholder="Ex: 12 ou 12,20" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{boisson ? 'Enregistrer les modifications' : 'Ajouter la boisson'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
