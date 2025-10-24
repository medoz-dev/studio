
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Settings, History, LogOut, LifeBuoy, Home, AlertTriangle, Users, BarChart2 } from "lucide-react";
import { auth } from '@/lib/firebase';
import type { StockItem } from "@/components/stock-tab";
import type { ArrivalItem } from "@/components/arrival-tab";
import type { Expense } from "@/components/calculations-tab";
import type { CalculationData, HistoryEntry, CorrectionLog } from "@/lib/types";
import { differenceInDays, format, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import HelpDialog from "@/components/HelpDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useManagers } from "@/hooks/useManagers";


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
  const { managers } = useManagers();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // State for correction mode
  const [correctionEntry, setCorrectionEntry] = useState<HistoryEntry | null>(null);
  const originalCorrectionEntry = useRef<HistoryEntry | null>(null);


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
        originalCorrectionEntry.current = JSON.parse(correctionDataString); // Keep a pristine copy
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
        setArrivalDetails(data.arrivalDetails);

        sessionStorage.removeItem('correctionData'); // Clean up
    } else {
        originalCorrectionEntry.current = null;
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

    // Listener for all arrivals (unless in correction mode)
    let unsubArrivals = () => {};
     if (!correctionEntry) {
        const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
        unsubArrivals = onSnapshot(arrivalsColRef, (snapshot) => {
          const arrivalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArrivalItem));
          setArrivalDetails(arrivalsData);
        });
     }
    
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

  // Sync arrivalTotal when arrivalDetails changes
   useEffect(() => {
        const total = arrivalDetails.reduce((acc, arrival) => acc + arrival.total, 0);
        setArrivalTotal(total);
    }, [arrivalDetails]);


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
      // In correction mode, this is handled locally
      if(correctionEntry) {
          setArrivalDetails(details);
      }
      setArrivalTotal(total);
  }, [correctionEntry]);

  const handleCancelCorrection = () => {
      setCorrectionEntry(null);
      originalCorrectionEntry.current = null;
      window.location.reload();
  };

  const generateChangeLog = (original: HistoryEntry, current: CalculationData, currentStock: StockItem[], currentArrivals: ArrivalItem[], currentExpenses: Expense[]): string[] => {
      const changes: string[] = [];
      const f = (val: number) => val.toLocaleString() + ' FCFA';

      // Simple fields
      if(original.managerName !== current.managerName) changes.push(`Gérant : "${original.managerName}" ➔ "${current.managerName}"`);
      if(original.oldStock !== current.oldStock) changes.push(`Stock Ancien : ${f(original.oldStock)} ➔ ${f(current.oldStock)}`);
      if(original.encaissement !== current.encaissement) changes.push(`Encaissement : ${f(original.encaissement)} ➔ ${f(current.encaissement)}`);
      if(original.especeGerant !== current.especeGerant) changes.push(`Espèce Gérant : ${f(original.especeGerant)} ➔ ${f(current.especeGerant)}`);

      // Stock Details
      const originalStockMap = new Map(original.stockDetails.map(item => [item.boisson.nom, item.quantity]));
      const currentStockMap = new Map(currentStock.map(item => [item.boisson.nom, item.quantity]));
      const allStockKeys = new Set([...originalStockMap.keys(), ...currentStockMap.keys()]);
      allStockKeys.forEach(key => {
          const oldQty = originalStockMap.get(key) || 0;
          const newQty = currentStockMap.get(key) || 0;
          if(oldQty !== newQty) changes.push(`Stock "${key}" : ${oldQty} ➔ ${newQty}`);
      });
      
      // Expenses
      const originalExpenseMap = new Map(original.expenseDetails.map(e => [`${e.motif}-${e.montant}`, e]));
      const currentExpenseMap = new Map(currentExpenses.map(e => [`${e.motif}-${e.montant}`, e]));
      original.expenseDetails.forEach(exp => {
        if (!currentExpenseMap.has(`${exp.motif}-${exp.montant}`)) changes.push(`Dépense supprimée : "${exp.motif}" (${f(exp.montant)})`);
      });
      currentExpenses.forEach(exp => {
        if (!originalExpenseMap.has(`${exp.motif}-${exp.montant}`)) changes.push(`Dépense ajoutée : "${exp.motif}" (${f(exp.montant)})`);
      });

      // Arrivals (simplified: check if total is different)
      const originalArrivalTotal = original.arrivalDetails.reduce((sum, a) => sum + a.total, 0);
      if(originalArrivalTotal !== current.arrivalTotal) changes.push(`Total Arrivages : ${f(originalArrivalTotal)} ➔ ${f(current.arrivalTotal)}`);

      return changes;
  };


  const handleSaveResults = async (calculationData: CalculationData) => {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté.", variant: "destructive" });
      return;
    }
    try {
        const batch = writeBatch(db);
        
        if (correctionEntry && originalCorrectionEntry.current) {
            // ----- CORRECTION MODE -----
            const changes = generateChangeLog(originalCorrectionEntry.current, calculationData, stockDetails, arrivalDetails, expenses);

            const newCorrectionLog: CorrectionLog = {
                dateCorrection: new Date().toISOString(),
                detailsDesChangements: changes.length > 0 ? changes : ["Aucun changement détecté lors de cette sauvegarde."],
            };

            const historyEntry: HistoryEntry = {
                ...calculationData,
                id: correctionEntry.id, // Use the existing ID
                stockDetails: stockDetails,
                arrivalDetails: arrivalDetails,
                expenseDetails: expenses,
                modifieLe: new Date().toISOString(), // Add modification date
                historiqueCorrections: [...(correctionEntry.historiqueCorrections || []), newCorrectionLog],
            };
            const historyDocRef = doc(db, 'users', user.uid, 'history', correctionEntry.id);
            batch.set(historyDocRef, historyEntry); // Overwrite the existing document
            
            toast({
                title: changes.length > 0 ? "Succès!" : "Aucune modification",
                description: changes.length > 0 
                    ? `L'inventaire du ${format(new Date(calculationData.date), "d MMM yyyy", {locale: fr})} a été corrigé.`
                    : "Aucun changement n'a été détecté. Le journal a été mis à jour.",
            });

        } else {
            // ----- NORMAL SAVE MODE -----
             const historyColRef = collection(db, 'users', user.uid, 'history');
             const newHistoryDoc = doc(historyColRef); // Create a new doc with a generated ID
             
             const historyEntry: HistoryEntry = {
                 ...calculationData,
                 id: newHistoryDoc.id, // Assign the generated ID
                 stockDetails: stockDetails,
                 arrivalDetails: arrivalDetails,
                 expenseDetails: expenses,
             };
             batch.set(newHistoryDoc, historyEntry);

            toast({
                title: "Succès!",
                description: `Résultats pour ${calculationData.managerName} enregistrés dans l'historique!`,
            });

            // Clear current arrivals by deleting all documents in the collection
            const arrivalsColRef = collection(db, 'users', user.uid, 'currentArrivals');
            const arrivalsSnapshot = await getDocs(arrivalsColRef);
            arrivalsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            // Clear stock quantities
            const quantitiesDocRef = doc(db, 'users', user.uid, 'inventoryState', 'stockQuantities');
            batch.set(quantitiesDocRef, {});
        }

        await batch.commit();

        // Reset state after saving, only if it wasn't a correction
        if (!correctionEntry) {
            setManagerName('');
            setEncaissement(0);
            setExpenses([]);
            setEspeceGerant(0);
            setCalculationDate(new Date().toISOString().split('T')[0]); // Reset date for next time
        }
        
        // Always leave correction mode after saving
        setCorrectionEntry(null);
        originalCorrectionEntry.current = null;
        
        // Reload the page to ensure a clean state if it was a correction
        if(correctionEntry) {
            window.location.reload();
        }

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
             <Link href="/analysis">
                <Button asChild variant="secondary" size="icon" title="Analyse des Performances">
                    <BarChart2 />
                </Button>
            </Link>
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
              initialArrivals={correctionEntry ? arrivalDetails : null}
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
              managers={managers}
            />
          </TabsContent>
        </Tabs>
        )}
      </main>
      <HelpDialog isOpen={isHelpOpen} setIsOpen={setIsHelpOpen} />
    </>
  );
}

    