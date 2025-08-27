
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockTab from "@/components/stock-tab";
import ArrivalTab from "@/components/arrival-tab";
import CalculationsTab from "@/components/calculations-tab";
import { useToast } from "@/hooks/use-toast";
import { useBoissons } from "@/hooks/useBoissons";
import { Button } from "@/components/ui/button";
import { Settings, History } from "lucide-react";
import type { StockItem } from "@/components/stock-tab";
import type { ArrivalItem } from "@/components/arrival-tab";
import type { Expense } from "@/components/calculations-tab";
import type { CalculationData } from "@/lib/types";


export default function Home() {
  const [stockTotal, setStockTotal] = useState(0);
  const [stockDetails, setStockDetails] = useState<StockItem[]>([]);
  const [arrivalTotal, setArrivalTotal] = useState(0);
  const [arrivalDetails, setArrivalDetails] = useState<ArrivalItem[]>([]);
  const [oldStock, setOldStock] = useState(0);
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { boissons, isLoading } = useBoissons();

  useEffect(() => {
    try {
      const previousStockData = localStorage.getItem("stockData");
      if (previousStockData) {
        const parsedData = JSON.parse(previousStockData);
        setOldStock(parsedData.total || 0);
      }
      const allArrivals = localStorage.getItem("allArrivalsData");
      if (allArrivals) {
        const parsedArrivals: ArrivalItem[] = JSON.parse(allArrivals);
        const total = parsedArrivals.reduce((acc, arrival) => acc + arrival.total, 0);
        setArrivalTotal(total);
        setArrivalDetails(parsedArrivals);
      }
      const currentStockQuantities = localStorage.getItem('currentStockQuantities');
      if (currentStockQuantities) {
        setStockQuantities(JSON.parse(currentStockQuantities));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const handleStockQuantitiesChange = (quantities: Record<string, number>) => {
      setStockQuantities(quantities);
      localStorage.setItem('currentStockQuantities', JSON.stringify(quantities));
  };


  const handleSaveResults = (calculationData: CalculationData, expenses: Expense[]) => {
    try {
        const historyEntry = {
            id: Date.now(),
            ...calculationData,
            stockDetails: stockDetails,
            arrivalDetails: arrivalDetails,
            expenseDetails: expenses,
        };

        const existingHistory = JSON.parse(localStorage.getItem('inventoryHistory') || '[]');
        const newHistory = [historyEntry, ...existingHistory];
        localStorage.setItem('inventoryHistory', JSON.stringify(newHistory));
        
        const stockData = {
            date: new Date().toISOString().split('T')[0],
            total: calculationData.currentStockTotal,
            manager: calculationData.managerName,
        };
        localStorage.setItem('stockData', JSON.stringify(stockData));
        localStorage.removeItem('allArrivalsData');
        localStorage.removeItem('currentStockDetails');
        localStorage.removeItem('currentStockQuantities');

        toast({
            title: "Succès!",
            description: `Résultats pour ${calculationData.managerName} enregistrés dans l'historique!`,
        });

        // Reset state for next inventory
        setOldStock(calculationData.currentStockTotal);
        setArrivalTotal(0);
        setArrivalDetails([]);
        setStockQuantities({});

    } catch (error) {
        console.error("Failed to save results to localStorage", error);
        toast({
            title: "Erreur",
            description: "Impossible d'enregistrer les résultats.",
            variant: "destructive",
        });
    }
  };

  return (
    <>
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto py-6 text-center relative">
          <h1 className="text-4xl font-bold font-headline">Inventaire Pro</h1>
          <p className="text-lg mt-2">Système de Gestion d'Inventaire</p>
           <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-2">
             <Link href="/history">
                <Button variant="secondary" size="icon" title="Historique">
                    <History />
                    <span className="sr-only">Historique</span>
                </Button>
            </Link>
             <Link href="/admin">
                <Button variant="secondary" size="icon" title="Administration">
                    <Settings />
                    <span className="sr-only">Administration</span>
                </Button>
            </Link>
           </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {isLoading ? (
          <p>Chargement des données sur les boissons...</p>
        ) : (
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 no-print">
            <TabsTrigger value="stock">Stock Restant</TabsTrigger>
            <TabsTrigger value="arrival">Arrivage</TabsTrigger>
            <TabsTrigger value="calculations">Calculs Généraux</TabsTrigger>
          </TabsList>
          <TabsContent value="stock" className="printable-area">
            <StockTab 
              onStockUpdate={(total, details) => { setStockTotal(total); setStockDetails(details); }} 
              boissons={boissons} 
              stockQuantities={stockQuantities}
              onQuantityChange={handleStockQuantitiesChange}
            />
          </TabsContent>
          <TabsContent value="arrival" className="printable-area">
            <ArrivalTab onArrivalUpdate={(total, details) => { setArrivalTotal(total); setArrivalDetails(details); }} boissons={boissons} />
          </TabsContent>
          <TabsContent value="calculations" className="printable-area">
            <CalculationsTab
              initialOldStock={oldStock}
              setInitialOldStock={setOldStock}
              arrivalTotal={arrivalTotal}
              currentStockTotal={stockTotal}
              onSaveResults={handleSaveResults}
            />
          </TabsContent>
        </Tabs>
        )}
      </main>
    </>
  );
}
