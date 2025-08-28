
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFoot } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { HistoryEntry } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SummaryItem = ({ label, value, className = '' }: { label: string, value: string, className?: string }) => (
    <div className={`flex justify-between items-center py-2 ${className}`}>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
    </div>
);

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };

        const historyColRef = collection(db, 'users', user.uid, 'history');
        const q = query(historyColRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryEntry));
            setHistory(historyData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, 'history', id);
        await deleteDoc(docRef);
    };
    
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
                    <h1 className="text-4xl font-bold font-headline">Historique des Inventaires</h1>
                    <p className="text-lg mt-2">Consultez les rapports des inventaires passés.</p>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Enregistrements</CardTitle>
                        <CardDescription>Liste de tous les inventaires finalisés et enregistrés.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-center text-muted-foreground py-12">Chargement de l'historique...</p>
                        ) : history.length === 0 ? (
                            <p className="text-center text-muted-foreground py-12">Aucun historique trouvé.</p>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Gérant</TableHead>
                                            <TableHead>Résultat</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map(entry => (
                                            <TableRow key={entry.id}>
                                                <TableCell>{new Date(entry.date).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell className="font-medium">{entry.managerName}</TableCell>
                                                <TableCell className={entry.finalResult > 0 ? 'text-green-600' : entry.finalResult < 0 ? 'text-destructive' : ''}>
                                                    {entry.finalResult > 0 ? `Surplus de ${entry.finalResult.toLocaleString()} FCFA` : entry.finalResult < 0 ? `Manquant de ${Math.abs(entry.finalResult).toLocaleString()} FCFA` : 'Bon'}
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedEntry(entry)}>
                                                        <Eye className="mr-2 h-4 w-4" /> Détails
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
                                                                    Cette action est irréversible et supprimera définitivement cet enregistrement de l'historique.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(entry.id)}>Supprimer</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
            <HistoryDetailsDialog
                isOpen={!!selectedEntry}
                setIsOpen={() => setSelectedEntry(null)}
                entry={selectedEntry}
            />
        </>
    );
}

function HistoryDetailsDialog({ isOpen, setIsOpen, entry }: { isOpen: boolean, setIsOpen: (open: boolean) => void, entry: HistoryEntry | null }) {
    if (!entry) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Détails de l'inventaire du {new Date(entry.date).toLocaleDateString('fr-FR')}</DialogTitle>
                    <DialogDescription>Gérant: {entry.managerName}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
                    <Accordion type="single" collapsible className="w-full" defaultValue="summary">
                        <AccordionItem value="summary">
                            <AccordionTrigger className="text-lg font-semibold">Résumé des Calculs</AccordionTrigger>
                            <AccordionContent className="space-y-2 pr-2">
                                <SummaryItem label="Stock Ancien" value={`${entry.oldStock.toLocaleString()} FCFA`} />
                                <SummaryItem label="Arrivage Total" value={`${entry.arrivalTotal.toLocaleString()} FCFA`} />
                                <Separator />
                                <SummaryItem label="Stock Général" value={`${entry.generalStock.toLocaleString()} FCFA`} />
                                <SummaryItem label="Stock Restant" value={`${entry.currentStockTotal.toLocaleString()} FCFA`} />
                                <Separator />
                                <SummaryItem label="Vente Théorique" value={`${entry.theoreticalSales.toLocaleString()} FCFA`} />
                                <SummaryItem label="Somme Encaissée" value={`${entry.encaissement.toLocaleString()} FCFA`} />
                                <SummaryItem label="Reste" value={`${entry.reste.toLocaleString()} FCFA`} />
                                <SummaryItem label="Total des Dépenses" value={`${entry.totalExpenses.toLocaleString()} FCFA`} />
                                <Separator />
                                <SummaryItem label="Reste Final" value={`${entry.finalReste.toLocaleString()} FCFA`} />
                                <SummaryItem label="Espèce disponible (gérant)" value={`${entry.especeGerant.toLocaleString()} FCFA`} />
                                <Separator />
                                 <div className={`text-xl font-bold mt-2 p-4 rounded-md text-center ${entry.finalResult > 0 ? 'bg-green-100 text-green-800' : entry.finalResult < 0 ? 'bg-red-100 text-red-800' : 'bg-secondary text-secondary-foreground'}`}>
                                    {entry.finalResult > 0 ? "SURPLUS" : entry.finalResult < 0 ? "MANQUANT" : "POINT BON"} : {Math.abs(entry.finalResult).toLocaleString()} FCFA
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="stock">
                            <AccordionTrigger className="text-lg font-semibold">Détails du Stock Restant</AccordionTrigger>
                            <AccordionContent>
                               <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Boisson</TableHead>
                                            <TableHead>Quantité</TableHead>
                                            <TableHead className="text-right">Valeur</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entry.stockDetails.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{item.boisson.nom}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.value.toLocaleString()} FCFA</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFoot>
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-bold text-base">Total Stock</TableCell>
                                            <TableCell className="text-right font-bold text-base">{entry.currentStockTotal.toLocaleString()} FCFA</TableCell>
                                        </TableRow>
                                    </TableFoot>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="arrivals">
                             <AccordionTrigger className="text-lg font-semibold">Détails des Arrivages</AccordionTrigger>
                             <AccordionContent>
                                {entry.arrivalDetails.length === 0 ? <p>Aucun arrivage pour cette période.</p> :
                                    entry.arrivalDetails.map(arrival => (
                                        <div key={arrival.id} className="mb-4 border p-4 rounded-md">
                                            <h4 className="font-semibold mb-2">Arrivage du {new Date(arrival.date).toLocaleDateString('fr-FR')} - Total: {arrival.total.toLocaleString()} FCFA</h4>
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Boisson</TableHead><TableHead>Quantité</TableHead><TableHead className="text-right">Valeur</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {arrival.details.map((d, i) => <TableRow key={i}><TableCell>{d.nom}</TableCell><TableCell>{d.quantite}</TableCell><TableCell className="text-right">{d.valeur.toLocaleString()} FCFA</TableCell></TableRow>)}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ))
                                }
                             </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="expenses">
                            <AccordionTrigger className="text-lg font-semibold">Détails des Dépenses</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Motif</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {entry.expenseDetails.map(exp => <TableRow key={exp.id}><TableCell>{exp.motif}</TableCell><TableCell className="text-right">{exp.montant.toLocaleString()} FCFA</TableCell></TableRow>)}
                                    </TableBody>
                                     <TableFoot>
                                        <TableRow>
                                            <TableCell className="font-bold text-base">Total Dépenses</TableCell>
                                            <TableCell className="text-right font-bold text-base">{entry.totalExpenses.toLocaleString()} FCFA</TableCell>
                                        </TableRow>
                                    </TableFoot>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
