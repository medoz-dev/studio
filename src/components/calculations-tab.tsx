
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save, Printer, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CalculationData } from '@/lib/types';

export interface Expense {
    id: number;
    motif: string;
    montant: number;
}

interface CalculationsTabProps {
    initialOldStock: number;
    setInitialOldStock: (value: number) => void;
    arrivalTotal: number;
    currentStockTotal: number;
    onSaveResults: (calculationData: CalculationData, expenses: Expense[]) => void;
}

const SummaryItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
    </div>
);

export default function CalculationsTab({ initialOldStock, setInitialOldStock, arrivalTotal, currentStockTotal, onSaveResults }: CalculationsTabProps) {
    const [calculationDate, setCalculationDate] = useState(new Date().toISOString().split('T')[0]);
    const [managerName, setManagerName] = useState('');
    const [oldStockInput, setOldStockInput] = useState(initialOldStock.toString());
    const [encaissement, setEncaissement] = useState(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [newExpenseMotif, setNewExpenseMotif] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [especeGerant, setEspeceGerant] = useState(0);
    const [showFinalResult, setShowFinalResult] = useState(false);
    const { toast } = useToast();


    useEffect(() => {
        setOldStockInput(initialOldStock.toString());
    }, [initialOldStock]);

    useEffect(() => {
        // Reset calculation when totals change
        setShowFinalResult(false);
    }, [initialOldStock, arrivalTotal, currentStockTotal, encaissement, expenses, especeGerant]);


    const handleUpdateOldStock = () => {
        const newValue = Number(oldStockInput);
        if (!isNaN(newValue)) {
            setInitialOldStock(newValue);
            toast({ title: "Succès", description: "Le stock ancien a été mis à jour." });
        }
    };

    const generalStock = useMemo(() => initialOldStock + arrivalTotal, [initialOldStock, arrivalTotal]);
    const theoreticalSales = useMemo(() => generalStock - currentStockTotal, [generalStock, currentStockTotal]);
    const reste = useMemo(() => theoreticalSales - encaissement, [theoreticalSales, encaissement]);
    
    const totalExpenses = useMemo(() => expenses.reduce((acc, exp) => acc + exp.montant, 0), [expenses]);
    const finalReste = useMemo(() => reste - totalExpenses, [reste, totalExpenses]);
    const finalResult = useMemo(() => especeGerant - finalReste, [especeGerant, finalReste]);

    const addExpense = () => {
        const montant = parseFloat(newExpenseAmount);
        if (newExpenseMotif && !isNaN(montant) && montant > 0) {
            setExpenses(prev => [...prev, { id: Date.now(), motif: newExpenseMotif, montant }]);
            setNewExpenseMotif('');
            setNewExpenseAmount('');
        } else {
            toast({ title: "Erreur", description: "Veuillez entrer un motif et un montant valide.", variant: "destructive" });
        }
    };
    
    const removeExpense = (id: number) => {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
    };

    const handleCalculateFinal = () => {
        if (!managerName.trim()) {
            toast({ title: "Attention", description: "Veuillez entrer le nom du gérant avant de calculer.", variant: "destructive" });
            return;
        }
        setShowFinalResult(true);
    };

    const handleSave = () => {
        if (!managerName.trim() || !showFinalResult) {
            toast({ title: "Attention", description: "Veuillez d'abord entrer le nom du gérant et cliquer sur 'Calculer' avant d'enregistrer.", variant: "destructive" });
            return;
        }
        const calculationData: CalculationData = {
            date: calculationDate,
            managerName,
            oldStock: initialOldStock,
            arrivalTotal,
            generalStock,
            currentStockTotal,
            theoreticalSales,
            encaissement,
            reste,
            totalExpenses,
            finalReste,
            especeGerant,
            finalResult
        };
        onSaveResults(calculationData, expenses);

        // Reset fields for next session, but keep old stock which is now the current stock
        setManagerName('');
        setEncaissement(0);
        setExpenses([]);
        setEspeceGerant(0);
        setShowFinalResult(false);
    }
    
    const printReport = () => {
        if (!managerName.trim()) {
            toast({
                title: "Attention",
                description: "Veuillez entrer le nom du gérant avant d'imprimer.",
                variant: "destructive"
            });
            return;
        }
        window.print();
    }

    const formattedDate = new Date(calculationDate).toLocaleDateString('fr-FR');
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Résumé des données</CardTitle>
                        <CardDescription>
                            Date du calcul: {formattedDate}
                            <span className="block text-xs text-red-500 italic print:hidden mt-2">
                                <strong>Note:</strong> Seul cet onglet de calculs sera imprimé.<br />
                                Lors de l'enregistrement en PDF, nommez le fichier comme ceci : <br/>
                                <strong className="break-all">"Inventaire du {formattedDate} pour {managerName || '(nom du gérant)'}"</strong>
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="managerName">Nom du Gérant</Label>
                             <Input id="managerName" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Entrez le nom du gérant de caisse..." />
                        </div>
                        <Separator />
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <Label htmlFor="oldStockInput">Stock Ancien (FCFA)</Label>
                                <Input type="number" id="oldStockInput" value={oldStockInput} onChange={(e) => setOldStockInput(e.target.value)} placeholder="Valeur du stock ancien..." />
                            </div>
                            <Button onClick={handleUpdateOldStock} className="no-print"><RefreshCw className="mr-2 h-4 w-4"/> Mettre à jour</Button>
                        </div>
                        <div className="border-l-4 border-accent p-4 rounded-r-md bg-secondary/30 space-y-2">
                            <SummaryItem label="Stock Ancien" value={`${initialOldStock.toLocaleString()} FCFA`} />
                            <SummaryItem label="Arrivage Total" value={`${arrivalTotal.toLocaleString()} FCFA`} />
                            <Separator />
                            <SummaryItem label="Stock Général" value={`${generalStock.toLocaleString()} FCFA`} />
                            <SummaryItem label="Stock Restant Actuel" value={`${currentStockTotal.toLocaleString()} FCFA`} />
                            <Separator />
                            <SummaryItem label="Vente Théorique" value={`${theoreticalSales.toLocaleString()} FCFA`} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Encaissement</CardTitle></CardHeader>
                    <CardContent>
                        <div>
                            <Label htmlFor="encaissement">Somme encaissée</Label>
                            <Input type="number" id="encaissement" value={encaissement || ''} onChange={(e) => setEncaissement(Number(e.target.value))} placeholder="Entrez la somme encaissée..." />
                        </div>
                        <div className="border-l-4 border-accent p-4 mt-4 rounded-r-md bg-secondary/30 space-y-2">
                            <SummaryItem label="Vente Théorique" value={`${theoreticalSales.toLocaleString()} FCFA`} />
                            <SummaryItem label="Somme Encaissée" value={`${encaissement.toLocaleString()} FCFA`} />
                            <Separator />
                            <SummaryItem label="Reste" value={`${reste.toLocaleString()} FCFA`} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Dépenses</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-2 mb-4 no-print">
                            <Input type="text" value={newExpenseMotif} onChange={e => setNewExpenseMotif(e.target.value)} placeholder="Motif de la dépense..." />
                            <Input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} placeholder="Montant..." className="md:w-40" />
                            <Button onClick={addExpense} className="shrink-0">Ajouter</Button>
                        </div>
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                            {expenses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune dépense ajoutée.</p>}
                            {expenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center bg-secondary/50 p-2 rounded-md">
                                    <span>{exp.motif}: {exp.montant.toLocaleString()} FCFA</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 no-print" onClick={() => removeExpense(exp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-4"/>
                        <SummaryItem label="Total des Dépenses" value={`${totalExpenses.toLocaleString()} FCFA`} />
                        <div className="border-l-4 border-accent p-4 mt-4 rounded-r-md bg-secondary/30 space-y-2">
                            <SummaryItem label="Reste après vente" value={`${reste.toLocaleString()} FCFA`} />
                            <SummaryItem label="Total des Dépenses" value={`${totalExpenses.toLocaleString()} FCFA`} />
                            <Separator />
                            <SummaryItem label="Reste Final" value={`${finalReste.toLocaleString()} FCFA`} />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Résultat Final</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <Label htmlFor="especeGerant">Espèce disponible chez le gérant</Label>
                                <Input type="number" id="especeGerant" value={especeGerant || ''} onChange={(e) => setEspeceGerant(Number(e.target.value))} placeholder="Entrez le montant..."/>
                            </div>
                            <Button onClick={handleCalculateFinal} className="no-print">Calculer</Button>
                        </div>
                        {showFinalResult && (
                            <div className="mt-4 text-center p-4 rounded-md bg-secondary/30">
                                <h3 className="font-semibold text-lg">Résultat Final pour {managerName}</h3>
                                <p className="text-muted-foreground">
                                    {finalResult > 0 ? "Le gérant a un SURPLUS de:" : finalResult < 0 ? "Le gérant a un MANQUANT de:" : "Le point est BON. Le gérant a remis le montant exact."}
                                </p>
                                <div className={`text-3xl font-bold mt-2 ${finalResult > 0 ? 'text-green-600' : finalResult < 0 ? 'text-destructive' : 'text-primary'}`}>
                                    {Math.abs(finalResult).toLocaleString()} FCFA
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 no-print">
                        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Enregistrer les Résultats</Button>
                        <Button variant="outline" onClick={printReport}><Printer className="mr-2 h-4 w-4" />Imprimer le Rapport</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
