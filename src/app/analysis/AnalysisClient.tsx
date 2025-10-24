
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useManagers } from "@/hooks/useManagers";
import { useAuth } from "@/context/AuthContext";
import { type Manager, type HistoryEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AnalysisResult {
    netBalance: number;
    totalMissing: number;
    totalSurplus: number;
    entries: HistoryEntry[];
    managerName: string;
    startDate: string;
    endDate: string;
}

const SummaryCard = ({ label, value, colorClass = 'text-foreground' }: { label: string, value: string, colorClass?: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardDescription>{label}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        </CardContent>
    </Card>
);

export default function AnalysisClient() {
    const { managers, isLoading: managersLoading } = useManagers();
    const { user } = useAuth();
    const { toast } = useToast();

    const [selectedManagerId, setSelectedManagerId] = useState<string>('all');
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const handleAnalysis = async () => {
        if (!user) {
            toast({ title: "Erreur", description: "Utilisateur non connecté.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);

        try {
            const historyRef = collection(db, 'users', user.uid, 'history');
            
            let q = query(
                historyRef,
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'desc')
            );

            const selectedManager = managers.find(m => m.id === selectedManagerId);
            if (selectedManagerId !== 'all' && selectedManager) {
                q = query(q, where('managerName', '==', selectedManager.nom));
            }

            const querySnapshot = await getDocs(q);
            const entries = querySnapshot.docs.map(doc => doc.data() as HistoryEntry);

            let netBalance = 0;
            let totalMissing = 0;
            let totalSurplus = 0;

            entries.forEach(entry => {
                netBalance += entry.finalResult;
                if (entry.finalResult < 0) {
                    totalMissing += Math.abs(entry.finalResult);
                } else {
                    totalSurplus += entry.finalResult;
                }
            });

            setAnalysisResult({
                netBalance,
                totalMissing,
                totalSurplus,
                entries,
                managerName: selectedManager ? selectedManager.nom : 'Tous les gérants',
                startDate,
                endDate
            });

        } catch (error: any) {
            console.error("Erreur lors de l'analyse:", error);
            toast({ title: "Erreur", description: error.message || "Impossible de récupérer les données.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-6 text-center relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-4">
                        <Link href="/dashboard">
                            <Button variant="secondary" size="icon">
                                <ArrowLeft />
                                <span className="sr-only">Retour</span>
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold font-headline">Analyse des Performances</h1>
                    <p className="text-lg mt-2">Évaluez la performance de vos gérants sur une période donnée.</p>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Filtres d'Analyse</CardTitle>
                        <CardDescription>Sélectionnez un gérant et une période pour lancer l'analyse.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="manager">Gérant</Label>
                            {managersLoading ? <Loader2 className="animate-spin" /> : (
                                <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                                    <SelectTrigger id="manager">
                                        <SelectValue placeholder="Sélectionnez un gérant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les gérants</SelectItem>
                                        {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Date de début</Label>
                            <Input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Date de fin</Label>
                            <Input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <Button onClick={handleAnalysis} disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours...</> : "Lancer l'Analyse"}
                        </Button>
                    </CardContent>
                </Card>

                {analysisResult && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Résultats pour {analysisResult.managerName}</CardTitle>
                            <CardDescription>
                                Période du {format(new Date(analysisResult.startDate), 'd MMMM yyyy', { locale: fr })} au {format(new Date(analysisResult.endDate), 'd MMMM yyyy', { locale: fr })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {analysisResult.entries.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">Aucun inventaire trouvé pour cette sélection.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <SummaryCard label="Bilan Net" value={`${analysisResult.netBalance.toLocaleString()} FCFA`} colorClass={analysisResult.netBalance < 0 ? 'text-destructive' : 'text-green-600'} />
                                        <SummaryCard label="Total des Manquants" value={`${analysisResult.totalMissing.toLocaleString()} FCFA`} colorClass="text-destructive" />
                                        <SummaryCard label="Total des Surplus" value={`${analysisResult.totalSurplus.toLocaleString()} FCFA`} colorClass="text-green-600" />
                                    </div>

                                    <h3 className="text-lg font-semibold mb-4">Détail des inventaires</h3>
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Gérant</TableHead>
                                                    <TableHead className="text-right">Résultat</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analysisResult.entries.map(entry => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>{format(new Date(entry.date), 'd MMMM yyyy', { locale: fr })}</TableCell>
                                                        <TableCell>{entry.managerName}</TableCell>
                                                        <TableCell className={`text-right font-medium ${entry.finalResult < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                            {entry.finalResult.toLocaleString()} FCFA
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}
