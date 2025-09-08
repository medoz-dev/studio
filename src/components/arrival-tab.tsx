
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Boisson } from '@/lib/data';
import { Trash2, PlusCircle, Save, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


export interface ArrivalItem {
  id: string; // Firestore ID is a string
  date: string;
  total: number;
  details: {
    nom: string;
    quantite: number;
    valeur: number;
  }[];
}

interface ArrivalTabProps {
  onArrivalUpdate: (total: number, details: ArrivalItem[]) => void;
  boissons: Boisson[];
}

export default function ArrivalTab({ onArrivalUpdate, boissons }: ArrivalTabProps) {
  const [allArrivals, setAllArrivals] = useState<ArrivalItem[]>([]);
  const [selectedArrival, setSelectedArrival] = useState<ArrivalItem | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        setAllArrivals([]);
        return;
    };

    const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
    const unsubscribe = onSnapshot(arrivalsColRef, (snapshot) => {
      const arrivalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArrivalItem));
      setAllArrivals(arrivalsData);
    });
    
    return () => unsubscribe();
  }, [user]);

  const totalArrivalValue = useMemo(() => {
      const total = allArrivals.reduce((acc, arrival) => acc + arrival.total, 0);
      onArrivalUpdate(total, allArrivals);
      return total;
  }, [allArrivals, onArrivalUpdate]);

  const handleAddArrival = async (newArrival: Omit<ArrivalItem, 'id'>) => {
    if (!user) return;
    const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
    await addDoc(arrivalsColRef, newArrival);
    toast({ title: "Succès", description: "La liste des arrivages a été mise à jour." });
  };

  const handleDeleteArrival = async (id: string) => {
    if (!user) return;
    const arrivalDocRef = doc(db, 'users', user.uid, 'currentArrivals', id);
    await deleteDoc(arrivalDocRef);
    toast({ title: "Succès", description: "Arrivage supprimé." });
  };

  return (
    <>
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
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedArrival(arrival)}>
                              <Eye className="mr-2 h-4 w-4" /> Voir les détails
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteArrival(arrival.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
      <ArrivalDetailsDialog
        isOpen={!!selectedArrival}
        setIsOpen={() => setSelectedArrival(null)}
        arrival={selectedArrival}
      />
    </>
  );
}


function calculateArrivalValue(quantity: number, boisson: Boisson, caseSize?: number): number {
    const selectedCaseSize = Array.isArray(boisson.trous) 
        ? (caseSize ?? boisson.trous[0]) 
        : (boisson.trous as number);

    const totalUnits = quantity * selectedCaseSize;
    if (totalUnits === 0) return 0;

    if (boisson.special) {
        // Special calculation: (units / 3) * 1000, then rounded.
        const rawValue = (totalUnits / 3) * 1000;
        return Math.ceil(rawValue / 50) * 50;
    }

    if (boisson.type === 'unite') {
        return quantity * boisson.prix;
    }
    
    return totalUnits * boisson.prix;
}


// Dialog Component for adding a new arrival
interface NewArrivalDialogProps {
    boissons: Boisson[];
    onAddArrival: (newArrival: Omit<ArrivalItem, 'id'>) => Promise<void>;
}

function NewArrivalDialog({ boissons, onAddArrival }: NewArrivalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
    const [arrivalQuantities, setArrivalQuantities] = useState<Record<string, { quantity: number; caseSize?: number }>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const [entryOrder, setEntryOrder] = useState<string[]>([]);
    
    const boissonsMap = useMemo(() => new Map(boissons.map(b => [b.nom, b])), [boissons]);

    const filteredBoissons = useMemo(() => {
        if (!searchTerm) {
          return boissons;
        }
        return boissons.filter(b =>
          b.nom.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, boissons]);

    const arrivalDetails = useMemo(() => {
        return entryOrder.map(nom => {
            const boisson = boissonsMap.get(nom);
            if (!boisson) return null;

            const { quantity = 0, caseSize } = arrivalQuantities[nom] || {};
            if(quantity === 0) return null;

            const value = calculateArrivalValue(quantity, boisson, caseSize);
            return { boisson, quantity, caseSize, value };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [arrivalQuantities, entryOrder, boissonsMap]);

    const totalArrivalValue = useMemo(() => {
        return arrivalDetails.reduce((acc, item) => acc + item.value, 0);
    }, [arrivalDetails]);

    const handleQuantityChange = (nom: string, value: string) => {
        const quantity = Number(value);
        if (!isNaN(quantity) && quantity >= 0) {
            setArrivalQuantities(prev => ({ ...prev, [nom]: { ...prev[nom], quantity } }));
            
            if (quantity > 0 && !entryOrder.includes(nom)) {
                setEntryOrder(prev => [...prev, nom]);
            } else if (quantity === 0 && entryOrder.includes(nom)) {
                setEntryOrder(prev => prev.filter(n => n !== nom));
            }
        }
    };

    const handleCaseSizeChange = (nom: string, value: string) => {
        const caseSize = Number(value);
        setArrivalQuantities(prev => ({ ...prev, [nom]: { ...prev[nom], caseSize } }));
    };

    const handleSubmit = async () => {
        const finalArrivalDetails = entryOrder.map(nom => {
             const boisson = boissonsMap.get(nom);
             if (!boisson) return null;
             const { quantity = 0, caseSize } = arrivalQuantities[nom] || {};
             if (quantity === 0) return null;

             return {
                nom,
                quantite: quantity,
                valeur: calculateArrivalValue(quantity, boisson, caseSize)
             };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        if (finalArrivalDetails.length === 0) {
            toast({ title: "Erreur", description: "Veuillez ajouter au moins une boisson.", variant: "destructive" });
            return;
        }

        const total = finalArrivalDetails.reduce((acc, item) => acc + item.valeur, 0);

        await onAddArrival({
            date: arrivalDate,
            total: total,
            details: finalArrivalDetails
        });

        setIsOpen(false);
        setArrivalQuantities({});
        setSearchTerm('');
        setEntryOrder([]);
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
                    <div className="flex justify-between items-end gap-4">
                        <div className="max-w-sm">
                            <Label htmlFor="arrivalDate">Date d'arrivage:</Label>
                            <Input type="date" id="arrivalDate" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                        </div>
                        <div className="relative w-full max-w-xs">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                           <Input
                               type="text"
                               placeholder="Rechercher une boisson..."
                               value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               className="pl-10"
                           />
                       </div>
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
                                {filteredBoissons.map(boisson => {
                                    const { quantity = 0, caseSize } = arrivalQuantities[boisson.nom] || {};
                                    const value = calculateArrivalValue(quantity, boisson, caseSize);

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
                                                        <Select value={String(caseSize ?? boisson.trous[0])} onValueChange={(val) => handleCaseSizeChange(boisson.nom, val)}>
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
                                            <TableCell className="text-right whitespace-nowrap">{boisson.prix > 0 || boisson.special ? `${value.toLocaleString()} FCFA` : 'N/A'}</TableCell>
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


// Dialog Component for showing arrival details
interface ArrivalDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  arrival: ArrivalItem | null;
}

function ArrivalDetailsDialog({ isOpen, setIsOpen, arrival }: ArrivalDetailsDialogProps) {
  if (!arrival) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de l'arrivage du {new Date(arrival.date).toLocaleDateString('fr-FR')}</DialogTitle>
          <DialogDescription>
            Voici le résumé des boissons reçues pour cet arrivage.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boisson</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrival.details.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.nom}</TableCell>
                  <TableCell>{item.quantite}</TableCell>
                  <TableCell className="text-right">{item.valeur.toLocaleString()} FCFA</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="border-t pt-4 flex justify-between sm:justify-between items-center">
            <div className="font-bold text-lg">Total: {arrival.total.toLocaleString()} FCFA</div>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
