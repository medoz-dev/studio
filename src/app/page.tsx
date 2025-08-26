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
import { Settings } from "lucide-react";

export default function Home() {
  const [stockTotal, setStockTotal] = useState(0);
  const [arrivalTotal, setArrivalTotal] = useState(0);
  const [oldStock, setOldStock] = useState(0);
  const { toast } = useToast();
  const { boissons, isLoading } = useBoissons();

  useEffect(() => {
    try {
      const previousStockData = localStorage.getItem("stockData");
      if (previousStockData) {
        const parsedData = JSON.parse(previousStockData);
        setOldStock(parsedData.total || 0);
      }
      const previousArrivalData = localStorage.getItem("arrivalData");
      if (previousArrivalData) {
        const parsedData = JSON.parse(previousArrivalData);
        setArrivalTotal(parsedData.total || 0);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const handleSaveResults = (currentStockTotal: number) => {
    try {
      const stockData = {
          date: new Date().toISOString().split('T')[0],
          total: currentStockTotal,
      };
      localStorage.setItem('stockData', JSON.stringify(stockData));
      toast({
        title: "Succès!",
        description: "Résultats enregistrés! Le stock actuel est sauvegardé comme stock ancien.",
      });
      setOldStock(currentStockTotal);
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
           <div className="absolute top-1/2 -translate-y-1/2 right-4">
             <Link href="/admin">
                <Button variant="secondary" size="icon">
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
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="stock">Stock Restant</TabsTrigger>
            <TabsTrigger value="arrival">Arrivage</TabsTrigger>
            <TabsTrigger value="calculations">Calculs Généraux</TabsTrigger>
          </TabsList>
          <TabsContent value="stock">
            <StockTab onStockUpdate={setStockTotal} boissons={boissons} />
          </TabsContent>
          <TabsContent value="arrival">
            <ArrivalTab onArrivalUpdate={setArrivalTotal} boissons={boissons} />
          </TabsContent>
          <TabsContent value="calculations">
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
