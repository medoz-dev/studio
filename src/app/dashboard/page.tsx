
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { doc, getDocs, setDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, addDoc, writeBatch, getDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockTab from "@/components/stock-tab";
import ArrivalTab from "@/components/arrival-tab";
import CalculationsTab from "@/components/calculations-tab";
import { useToast } from "@/hooks/use-toast";
import { useBoissons } from "@/hooks/useBoissons";
import { Button } from "@/components/ui/button";
import { Settings, History, LogOut, LifeBuoy, Home, AlertTriangle } from "lucide-react";
import { auth } from '@/lib/firebase';
import type { StockItem } from "@/components/stock-tab";
import type { ArrivalItem } from "@/components/arrival-tab";
import type { Expense } from "@/components/calculations-tab";
import type { CalculationData, HistoryEntry } from "@/lib/types";
import { differenceInDays, format, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import HelpDialog from "@/components/HelpDialog";
import { ThemeToggle } from "@/components/ThemeToggle";


function SubscriptionStatus({ subscriptionEndDate, creationDate }: { subscriptionEndDate: Date | null, creationDate: string | null }) {
    const today = new Date();
    
    if (subscriptionEndDate) {
        if (isBefore(today, subscriptionEndDate)) {
             const remainingDays = differenceInDays(subscriptionEndDate, today);
             const formattedEndDate = format(subscriptionEndDate, 'd MMMM yyyy', { locale: fr });
             if (remainingDays <= 5) {
                 return <p className="text-sm mt-2 text-yellow-300">Votre abonnement expire le {formattedEndDate} ({remainingDays} jour(s) restant(s)).</p>;
             }
             return <p className="text-sm mt-2">Actif jusqu'au {formattedEndDate} ({remainingDays} jours restants).</p>;
        } else {
             return <p className="text-sm mt-2 text-red-300 font-bold">Abonnement expiré.</p>;
        }
    }
    
    if (creationDate) {
        const trialEndDate = addDays(new Date(creationDate), 30);
        if(isBefore(today, trialEndDate)) {
            const remainingDays = differenceInDays(trialEndDate, today);
            const formattedEndDate = format(trialEndDate, 'd MMMM yyyy', { locale: fr });
            return <p className="text-sm mt-2 text-yellow-300">Essai gratuit jusqu'au {formattedEndDate} ({remainingDays} jour(s) restant(s)).</p>;
        } else {
            return <p className="text-sm mt-2 text-red-300 font-bold">Période d'essai terminée.</p>;
        }
    }

    return null;
}


export default function DashboardPage() {
  const [stockTotal, setStockTotal] = useState(0);
  const [stockDetails, setStockDetails] = useState<StockItem[]>([]);
  const [arrivalTotal, setArrivalTotal] = useState(0);
  const [arrivalDetails, setArrivalDetails] = useState<ArrivalItem[]>([]);
  const [oldStock, setOldStock] = useState(0);
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { boissons, isLoading } = useBoissons();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // State for correction mode
  const [correctionEntry, setCorrectionEntry] = useState<HistoryEntry | null>(null);

  // State for CalculationsTab lifted up to DashboardPage
  const [calculationDate, setCalculationDate] = useState(new Date().toISOString().split('T')[0]);
  const [managerName, setManagerName] = useState('');
  const [encaissement, setEncaissement] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [especeGerant, setEspeceGerant] = useState(0);


  useEffect(() => {
    if (!user) return;
    
    // Check for correction data on page load
    const correctionDataString = sessionStorage.getItem('correctionData');
    if (correctionDataString) {
        const data = JSON.parse(correctionDataString) as HistoryEntry;
        setCorrectionEntry(data);
        
        // Populate state from reloaded data
        setCalculationDate(data.date);
        setManagerName(data.managerName);
        setEncaissement(data.encaissement);
        setExpenses(data.expenseDetails);
        setEspeceGerant(data.especeGerant);
        setOldStock(data.oldStock);

        // Populate stock quantities from reloaded data
        const reloadedQuantities = data.stockDetails.reduce((acc, item) => {
            acc[item.boisson.nom] = item.quantity;
            return acc;
        }, {} as Record<string, number>);
        setStockQuantities(reloadedQuantities);

        // Populate arrivals from reloaded data
        // This is tricky because arrivals are in a subcollection. We'll add them.
        const addRechargedArrivals = async () => {
            if (!user) return;
            const batch = writeBatch(db);
            const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
            data.arrivalDetails.forEach(arrival => {
                const docRef = doc(arrivalsColRef, arrival.id); // Use original ID to avoid duplicates on re-recharge
                batch.set(docRef, arrival);
            });
            await batch.commit();
        };
        addRechargedArrivals();

        sessionStorage.removeItem('correctionData'); // Clean up
    }


    // Listener for user's data (name and subscription)
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.name || '');
            if (data.finAbonnement && data.finAbonnement instanceof Timestamp) {
                setSubscriptionEndDate(data.finAbonnement.toDate());
            } else {
                setSubscriptionEndDate(null);
            }
        }
    });


    // Listener for current stock quantities (unless in correction mode)
    let unsubQuantities = () => {};
    if (!correctionEntry) {
       const quantitiesDocRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
       unsubQuantities = onSnapshot(quantitiesDocRef, (doc) => {
         if (doc.exists()) {
           setStockQuantities(doc.data() || {});
         }
       });
    }

    // Listener for all arrivals
    const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
    const unsubArrivals = onSnapshot(arrivalsColRef, (snapshot) => {
      const arrivalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArrivalItem));
      const total = arrivalsData.reduce((acc, arrival) => acc + arrival.total, 0);
      setArrivalTotal(total);
      setArrivalDetails(arrivalsData);
    });
    
    // Get latest stock value from history to set as oldStock (unless in correction mode)
    let unsubHistory = () => {};
    if (!correctionEntry) {
      const historyColRef = collection(db, 'users', user.uid, 'history');
      const q = query(historyColRef, orderBy('date', 'desc'), limit(1));
      unsubHistory = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
              const lastEntry = snapshot.docs[0].data() as HistoryEntry;
              setOldStock(lastEntry.currentStockTotal || 0);
          } else {
              setOldStock(0);
          }
      });
    }


    return () => {
      unsubUser();
      unsubQuantities();
      unsubArrivals();
      unsubHistory();
    };
  }, [user, correctionEntry]);

  const handleStockQuantitiesChange = useCallback(async (quantities: Record<string, number>) => {
    setStockQuantities(quantities);
    if (user && !correctionEntry) { // Only save to Firestore if not in correction mode
      const docRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
      await setDoc(docRef, quantities, { merge: true });
    }
  }, [user, correctionEntry]);

  const handleStockUpdate = useCallback((total: number, details: StockItem[]) => {
      setStockTotal(total);
      setStockDetails(details);
  }, []);

  const handleArrivalUpdate = useCallback((total: number, details: ArrivalItem[]) => {
      setArrivalTotal(total);
      setArrivalDetails(details);
  }, []);

  const handleCancelCorrection = () => {
      // Clear all transient data and state related to the correction
      if (user) {
          const clearData = async () => {
              const batch = writeBatch(db);
              const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
              const arrivalsSnapshot = await getDocs(arrivalsColRef);
              arrivalsSnapshot.forEach((doc) => batch.delete(doc.ref));
              
              const quantitiesDocRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
              batch.set(quantitiesDocRef, {});

              await batch.commit();

              setCorrectionEntry(null);
              // Force reload to get fresh data from listeners
              window.location.reload();
          };
          clearData();
      }
  };


  const handleSaveResults = async (calculationData: CalculationData) => {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté.", variant: "destructive" });
      return;
    }
    try {
        const batch = writeBatch(db);
        
        if (correctionEntry) {
            // ----- CORRECTION MODE -----
            const historyEntry: HistoryEntry = {
                ...calculationData,
                id: correctionEntry.id, // Use the existing ID
                stockDetails: stockDetails,
                arrivalDetails: arrivalDetails,
                expenseDetails: expenses,
                modifieLe: new Date().toISOString(), // Add modification date
            };
            const historyDocRef = doc(db, 'users', user.uid, 'history', correctionEntry.id);
            batch.set(historyDocRef, historyEntry); // Overwrite the existing document
            toast({
                title: "Succès!",
                description: `L'inventaire du ${format(new Date(calculationData.date), "d MMM yyyy", {locale: fr})} a été corrigé.`,
            });
        } else {
            // ----- NORMAL SAVE MODE -----
            const historyEntry: Omit<HistoryEntry, 'id'> = {
                ...calculationData,
                stockDetails: stockDetails,
                arrivalDetails: arrivalDetails,
                expenseDetails: expenses,
            };
            const historyColRef = collection(db, 'users', user.uid, 'history');
            const newHistoryDoc = doc(historyColRef);
            batch.set(newHistoryDoc, historyEntry);
            toast({
                title: "Succès!",
                description: `Résultats pour ${calculationData.managerName} enregistrés dans l'historique!`,
            });
        }

        // Clear current arrivals by deleting all documents in the collection
        const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
        const arrivalsSnapshot = await getDocs(arrivalsColRef);
        arrivalsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // Clear stock quantities
        const quantitiesDocRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
        batch.set(quantitiesDocRef, {});

        await batch.commit();

        // Reset state after saving
        setManagerName('');
        setEncaissement(0);
setExpenses([]);
        setEspeceGerant(0);
        setCorrectionEntry(null); // Exit correction mode
        setCalculationDate(new Date().toISOString().split('T')[0]); // Reset date for next time

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
      <header className="bg-primary text-primary-foreground shadow-md no-print">
        <div className="container mx-auto py-6 text-center relative">
          <h1 className="text-4xl font-bold font-headline">Inventaire Pro</h1>
          <p className="text-lg mt-2">Bienvenue, {userName || user?.email}</p>
          <SubscriptionStatus subscriptionEndDate={subscriptionEndDate} creationDate={user?.metadata.creationTime ?? null} />
          <div className="absolute top-1/2 -translate-y-1/2 left-4">
             <Link href="/">
                <Button asChild variant="secondary" size="icon" title="Page d'accueil">
                    <Home />
                </Button>
            </Link>
          </div>
           <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-2">
             <ThemeToggle />
             <Button variant="secondary" size="icon" title="Aide et Infos" onClick={() => setIsHelpOpen(true)}>
                <LifeBuoy />
                <span className="sr-only">Aide</span>
             </Button>
             <Link href="/history">
                <Button asChild variant="secondary" size="icon" title="Historique">
                    <History />
                </Button>
            </Link>
             <Link href="/admin">
                <Button asChild variant="secondary" size="icon" title="Administration">
                    <Settings />
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
        {correctionEntry && (
            <div className="mb-6 p-4 border-l-4 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-r-lg flex justify-between items-center">
                <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 mr-3"/>
                    <div>
                        <h3 className="font-bold">Mode Correction</h3>
                        <p className="text-sm">Vous modifiez l'inventaire du {format(new Date(correctionEntry.date), "d MMMM yyyy", { locale: fr })}.</p>
                    </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleCancelCorrection}>Annuler la Correction</Button>
            </div>
        )}
        {isLoading ? (
          <p>Chargement des données sur les boissons...</p>
        ) : (
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-1 h-auto md:h-10 md:grid-cols-3 no-print">
            <TabsTrigger value="stock">Stock Restant</TabsTrigger>
            <TabsTrigger value="arrival">Arrivage</TabsTrigger>
            <TabsTrigger value="calculations">Calculs Généraux</TabsTrigger>
          </TabsList>
          <TabsContent value="stock" className="printable-area">
            <StockTab 
              onStockUpdate={handleStockUpdate} 
              boissons={boissons} 
              stockQuantities={stockQuantities}
              onQuantityChange={handleStockQuantitiesChange}
              isCorrectionMode={!!correctionEntry}
            />
          </TabsContent>
          <TabsContent value="arrival" className="printable-area">
            <ArrivalTab 
              onArrivalUpdate={handleArrivalUpdate} 
              boissons={boissons} 
              initialArrivals={correctionEntry?.arrivalDetails || null}
            />
          </TabsContent>
          <TabsContent value="calculations" className="printable-area">
            <CalculationsTab
              initialOldStock={oldStock}
              setInitialOldStock={setOldStock}
              arrivalTotal={arrivalTotal}
              currentStockTotal={stockTotal}
              onSaveResults={handleSaveResults}
              calculationDate={calculationDate}
              setCalculationDate={setCalculationDate}
              managerName={managerName}
              setManagerName={setManagerName}
              encaissement={encaissement}
              setEncaissement={setEncaissement}
              expenses={expenses}
              setExpenses={setExpenses}
              especeGerant={especeGerant}
              setEspeceGerant={setEspeceGerant}
              isCorrectionMode={!!correctionEntry}
            />
          </TabsContent>
        </Tabs>
        )}
      </main>
      <HelpDialog isOpen={isHelpOpen} setIsOpen={setIsHelpOpen} />
    </>
  );
}

    