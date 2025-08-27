
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Boisson } from '@/lib/data';
import { Trash2, PlusCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ARRIVALS_STORAGE_KEY = 'allArrivalsData';

interface ArrivalItem {
  id: number;
  date: string;
  total: number;
  details: {
    nom: string;
    quantite: number;
    valeur: number;
  }[];
}

interface ArrivalTabProps {
  onArrivalUpdate: (total: number) => void;
  boissons: Boisson[];
}

export default function ArrivalTab({ onArrivalUpdate, boissons }: ArrivalTabProps) {
  const [allArrivals, setAllArrivals] = useState<ArrivalItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedArrivals = localStorage.getItem(ARRIVALS_STORAGE_KEY);
      if (storedArrivals) {
        setAllArrivals(JSON.parse(storedArrivals));
      }
    } catch (error) {
      console.error("Failed to load arrivals from localStorage", error);
    }
  }, []);

  const saveAllArrivals = useCallback((arrivals: ArrivalItem[]) => {
    try {
      localStorage.setItem(ARRIVALS_STORAGE_KEY, JSON.stringify(arrivals));
      toast({ title: "Succès", description: "La liste des arrivages a été mise à jour." });
    } catch (error) {
      console.error("Failed to save arrivals", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder les arrivages.", variant: "destructive" });
    }
  }, [toast]);

  const totalArrivalValue = useMemo(() => {
    const total = allArrivals.reduce((acc, arrival) => acc + arrival.total, 0);
    onArrivalUpdate(total);
    return total;
  }, [allArrivals, onArrivalUpdate]);

  const handleAddArrival = (newArrival: Omit<ArrivalItem, 'id'>) => {
    const arrivalWithId = { ...newArrival, id: Date.now() };
    const updatedArrivals = [...allArrivals, arrivalWithId];
    setAllArrivals(updatedArrivals);
    saveAllArrivals(updatedArrivals);
  };

  const handleDeleteArrival = (id: number) => {
    const updatedArrivals = allArrivals.filter(arrival => arrival.id !== id);
    setAllArrivals(updatedArrivals);
    saveAllArrivals(updatedArrivals);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Liste des Arrivages</CardTitle>
                <CardDescription>Ajoutez et suivez tous les arrivages de stock.</CardDescription>
            </div>
            <NewArrivalDialog boissons={boissons} onAddArrival={handleAddArrival} />
        </CardHeader>
        <CardContent>
          {allArrivals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun arrivage enregistré pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {allArrivals.map(arrival => (
                <Card key={arrival.id} className="bg-secondary/30">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Arrivage du {new Date(arrival.date).toLocaleDateString('fr-FR')}</CardTitle>
                        <CardDescription>Total: {arrival.total.toLocaleString()} FCFA</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteArrival(arrival.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end items-center gap-4 font-bold text-lg border-t pt-6 mt-6">
            <span>Total de tous les arrivages:</span>
            <span>{totalArrivalValue.toLocaleString()} FCFA</span>
        </CardFooter>
      </Card>
    </div>
  );
}

// Dialog Component for adding a new arrival
interface NewArrivalDialogProps {
    boissons: Boisson[];
    onAddArrival: (newArrival: Omit<ArrivalItem, 'id'>) => void;
}

function NewArrivalDialog({ boissons, onAddArrival }: NewArrivalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
    const [arrivalQuantities, setArrivalQuantities] = useState<Record<string, { quantity: number; caseSize?: number }>>({});
    
    const arrivalDetails = useMemo(() => {
        return boissons.map(boisson => {
            const { quantity = 0, caseSize } = arrivalQuantities[boisson.nom] || {};
            let selectedCaseSize = Array.isArray(boisson.trous) ? (caseSize ?? boisson.trous[0]) : (boisson.trous as number);
            
            let value = 0;
            if (boisson.type === 'unite') {
                value = quantity * boisson.prix;
            } else {
                value = quantity * selectedCaseSize * boisson.prix;
            }

            return { boisson, quantity, caseSize: selectedCaseSize, value };
        }).filter(item => item.quantity > 0);
    }, [arrivalQuantities, boissons]);

    const totalArrivalValue = useMemo(() => {
        return arrivalDetails.reduce((acc, item) => acc + item.value, 0);
    }, [arrivalDetails]);

    const handleQuantityChange = (nom: string, value: string) => {
        const quantity = Number(value);
        if (!isNaN(quantity) && quantity >= 0) {
            setArrivalQuantities(prev => ({ ...prev, [nom]: { ...prev[nom], quantity } }));
        }
    };

    const handleCaseSizeChange = (nom: string, value: string) => {
        const caseSize = Number(value);
        setArrivalQuantities(prev => ({ ...prev, [nom]: { ...prev[nom], caseSize } }));
    };

    const handleSubmit = () => {
        if (arrivalDetails.length === 0) {
            alert("Veuillez ajouter au moins une boisson à l'arrivage.");
            return;
        }
        onAddArrival({
            date: arrivalDate,
            total: totalArrivalValue,
            details: arrivalDetails.map(item => ({
                nom: item.boisson.nom,
                quantite: item.quantity,
                valeur: item.value
            }))
        });
        setIsOpen(false);
        setArrivalQuantities({}); // Reset for next entry
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Nouvel Arrivage</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Enregistrer un nouvel arrivage</DialogTitle>
                    <DialogDescription>
                        Saisissez les quantités pour chaque boisson arrivée à cette date.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="max-w-sm">
                        <Label htmlFor="arrivalDate">Date d'arrivage:</Label>
                        <Input type="date" id="arrivalDate" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Boisson</TableHead>
                                    <TableHead>Unités par Casier/Sachet</TableHead>
                                    <TableHead className="min-w-64">Nombre Arrivé</TableHead>
                                    <TableHead className="text-right">Valeur</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {boissons.map(boisson => {
                                    const { quantity = 0, caseSize } = arrivalQuantities[boisson.nom] || {};
                                    const selectedCaseSize = Array.isArray(boisson.trous) ? (caseSize ?? boisson.trous[0]) : (boisson.trous as number);
                                    const value = boisson.type === 'unite' ? (quantity * boisson.prix) : (quantity * selectedCaseSize * boisson.prix);

                                    return (
                                        <TableRow key={boisson.nom}>
                                            <TableCell className="font-medium whitespace-nowrap">{boisson.nom}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {Array.isArray(boisson.trous) ? `${boisson.trous.join(' ou ')} unités` : boisson.type === 'unite' ? 'Unité' : `${boisson.trous} unités`}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={quantity === 0 ? '' : quantity}
                                                        onChange={(e) => handleQuantityChange(boisson.nom, e.target.value)}
                                                        placeholder='0'
                                                        className="text-center w-24"
                                                    />
                                                    {Array.isArray(boisson.trous) && (
                                                        <Select value={String(selectedCaseSize)} onValueChange={(val) => handleCaseSizeChange(boisson.nom, val)}>
                                                            <SelectTrigger className="w-48">
                                                                <SelectValue placeholder="Type de casier" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {boisson.trous.map(size => <SelectItem key={size} value={String(size)}>{size} trous</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">{boisson.prix > 0 ? `${value.toLocaleString()} FCFA` : 'N/A'}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter className="border-t pt-4 flex justify-between sm:justify-between">
                    <div className="font-bold text-lg">Total de l'arrivage: {totalArrivalValue.toLocaleString()} FCFA</div>
                    <Button onClick={handleSubmit}><Save className="mr-2 h-4 w-4" />Enregistrer l'Arrivage</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
