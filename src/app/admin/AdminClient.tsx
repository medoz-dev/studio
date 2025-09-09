
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
import { Trash2, Edit, PlusCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminClientProps {
    initialBoissons: Boisson[];
}

export default function AdminClient({ initialBoissons }: AdminClientProps) {
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
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Chargement de l'administration...</p>
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
                                        <TableHead>Spécial</TableHead>
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
                                            <TableCell>{boisson.special ? 'Oui' : 'Non'}</TableCell>
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
                                                            <AlertDialogAction onClick={async () => {
                                                                await deleteBoisson(boisson.nom);
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
                existingBoissons={boissons}
            />
        </>
    );
}


interface BoissonFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    boisson: Boisson | null;
    addBoisson: (boisson: Boisson) => Promise<void>;
    updateBoisson: (nom: string, boisson: Boisson) => Promise<void>;
    existingBoissons: Boisson[];
}

function BoissonFormDialog({ isOpen, setIsOpen, boisson, addBoisson, updateBoisson, existingBoissons }: BoissonFormDialogProps) {
    const [formData, setFormData] = useState<Partial<Boisson> & { trous: string | number }>({});
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (boisson) {
                setFormData({
                    ...boisson,
                    trous: Array.isArray(boisson.trous) ? boisson.trous.join(',') : (boisson.trous?.toString() ?? '')
                });
            } else {
                setFormData({
                    nom: '',
                    prix: 0,
                    type: 'casier',
                    trous: '',
                    special: false,
                });
            }
        }
    }, [boisson, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        setFormData(prev => ({ ...prev, special: !!checked }));
    }

    const handleSubmit = async () => {
        const nom = formData.nom?.trim();
        if (!nom) {
            toast({ title: "Erreur", description: "Le nom de la boisson est requis.", variant: "destructive" });
            return;
        }

        if (!boisson && existingBoissons.some(b => b.nom.toLowerCase() === nom.toLowerCase())) {
            toast({ title: "Erreur", description: "Une boisson avec ce nom existe déjà.", variant: "destructive" });
            return;
        }

        const prix = Number(formData.prix);
        if (isNaN(prix) || prix < 0) {
            toast({ title: "Erreur", description: "Veuillez entrer un prix valide.", variant: "destructive" });
            return;
        }
        
        const trousString = String(formData.trous || '');
        let trousValue: number | number[];
        if (trousString.includes(',')) {
            trousValue = trousString.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
             if (trousValue.length === 0) {
                toast({ title: "Erreur", description: "Veuillez entrer des unités valides (ex: 12, 20).", variant: "destructive" });
                return;
            }
        } else {
            const numTrous = Number(trousString);
            if (isNaN(numTrous) || numTrous <= 0) {
                 toast({ title: "Erreur", description: "Veuillez entrer un nombre d'unités valide.", variant: "destructive" });
                 return;
            }
            trousValue = numTrous;
        }


        const finalBoisson: Boisson = {
            nom,
            prix,
            type: formData.type || 'casier',
            trous: trousValue,
            special: formData.special || false,
        };

        try {
            if (boisson) {
                await updateBoisson(boisson.nom, finalBoisson);
                toast({ title: "Succès", description: "Boisson mise à jour." });
            } else {
                await addBoisson(finalBoisson);
                toast({ title: "Succès", description: "Boisson ajoutée." });
            }
            setIsOpen(false);
        } catch (error: any) {
             toast({ title: "Erreur", description: error.message || "Une erreur est survenue lors de l'enregistrement.", variant: "destructive" });
        }
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
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="special" className="text-right col-span-1">Prix Spécial</Label>
                         <div className="col-span-3 flex items-center space-x-2">
                             <Checkbox id="special" name="special" checked={formData.special} onCheckedChange={handleCheckboxChange} />
                             <label
                                htmlFor="special"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Appliquer le calcul type Béninoise
                              </label>
                         </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{boisson ? 'Enregistrer les modifications' : 'Ajouter la boisson'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

