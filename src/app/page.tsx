
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockTab from "@/components/stock-tab";
import ArrivalTab from "@/components/arrival-tab";
import CalculationsTab from "@/components/calculations-tab";
import { useToast } from "@/hooks/use-toast";
import { useBoissons } from "@/hooks/useBoissons";
import { Button } from "@/components/ui/button";
import { Settings, History, LogOut } from "lucide-react";
import { auth } from '@/lib/firebase';
import type { StockItem } from "@/components/stock-tab";
import type { ArrivalItem } from "@/components/arrival-tab";
import type { Expense } from "@/components/calculations-tab";
import type { CalculationData, HistoryEntry } from "@/lib/types";


export default function Home() {
  const [stockTotal, setStockTotal] = useState(0);
  const [stockDetails, setStockDetails] = useState<StockItem[]>([]);
  const [arrivalTotal, setArrivalTotal] = useState(0);
  const [arrivalDetails, setArrivalDetails] = useState<ArrivalItem[]>([]);
  const [oldStock, setOldStock] = useState(0);
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { boissons, isLoading } = useBoissons();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listener for current stock quantities
    const quantitiesDocRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
    const unsubQuantities = onSnapshot(quantitiesDocRef, (doc) => {
      if (doc.exists()) {
        setStockQuantities(doc.data() || {});
      }
    });

    // Listener for all arrivals
    const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
    const unsubArrivals = onSnapshot(arrivalsColRef, (snapshot) => {
      const arrivalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArrivalItem));
      const total = arrivalsData.reduce((acc, arrival) => acc + arrival.total, 0);
      setArrivalTotal(total);
      setArrivalDetails(arrivalsData);
    });
    
    // Get latest stock value from history to set as oldStock
    const historyColRef = collection(db, 'users', user.uid, 'history');
    const q = query(historyColRef, orderBy('date', 'desc'), limit(1));
    const unsubHistory = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const lastEntry = snapshot.docs[0].data() as HistoryEntry;
            setOldStock(lastEntry.currentStockTotal || 0);
        } else {
            setOldStock(0);
        }
    });


    return () => {
      unsubQuantities();
      unsubArrivals();
      unsubHistory();
    };
  }, [user]);

  const handleStockQuantitiesChange = useCallback(async (quantities: Record<string, number>) => {
    setStockQuantities(quantities);
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
      await setDoc(docRef, quantities, { merge: true });
    }
  }, [user]);


  const handleSaveResults = async (calculationData: CalculationData, expenses: Expense[]) => {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté.", variant: "destructive" });
      return;
    }
    try {
        const historyEntry: Omit<HistoryEntry, 'id'> = {
            ...calculationData,
            stockDetails: stockDetails,
            arrivalDetails: arrivalDetails,
            expenseDetails: expenses,
        };

        // Add to history collection
        await addDoc(collection(db, 'users', user.uid, 'history'), historyEntry);

        // Clear current arrivals
        const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
        const arrivalsSnapshot = await getDoc(arrivalsColRef);
        // Firebase does not support deleting a collection from the client.
        // We delete documents one by one.
        arrivalDetails.forEach(async (arrival) => {
          await deleteDoc(doc(arrivalsColRef, arrival.id.toString()));
        });
        
        // Clear stock quantities
        const quantitiesDocRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
        await setDoc(quantitiesDocRef, {});

        toast({
            title: "Succès!",
            description: `Résultats pour ${calculationData.managerName} enregistrés dans l'historique!`,
        });

        // State will be reset by listeners
    } catch (error) {
        console.error("Failed to save results to Firestore", error);
        toast({
            title: "Erreur",
            description: "Impossible d'enregistrer les résultats.",
            variant: "destructive",
        });
    }
  };
  
  const handleLogout = async () => {
    await auth.signOut();
  }

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
            <Button variant="destructive" size="icon" title="Déconnexion" onClick={handleLogout}>
                <LogOut />
                <span className="sr-only">Déconnexion</span>
            </Button>
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
