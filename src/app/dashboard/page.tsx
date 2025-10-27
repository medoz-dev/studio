
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { doc, getDocs, setDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, addDoc, writeBatch, getDoc, Timestamp, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockTab from "@/components/stock-tab";
import ArrivalTab from "@/components/arrival-tab";
import CalculationsTab from "@/components/calculations-tab";
import { useToast } from "@/hooks/use-toast";
import { useBoissons } from "@/hooks/useBoissons";
import { Button } from "@/components/ui/button";
import { Settings, History, LogOut, LifeBuoy, Home, AlertTriangle, Users, BarChart2, Menu, User, KeyRound, SlidersHorizontal } from "lucide-react";
import { auth } from '@/lib/firebase';
import type { StockItem } from "@/components/stock-tab";
import type { ArrivalItem } from "@/components/arrival-tab";
import type { Expense } from "@/components/calculations-tab";
import type { CalculationData, HistoryEntry, ChangeLog, Modification } from "@/lib/types";
import { differenceInDays, format, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import HelpDialog from "@/components/HelpDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useManagers } from "@/hooks/useManagers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";


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


function AccountDialog({ isOpen, setIsOpen, user, userName, setUserNameState }: { isOpen: boolean, setIsOpen: (open: boolean) => void, user: any, userName: string, setUserNameState: (name: string) => void }) {
    const [name, setName] = useState(userName);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setName(userName);
    }, [userName]);

    const handleSave = async () => {
        if (!user) {
            toast({ title: "Erreur", description: "Utilisateur non trouvé.", variant: "destructive" });
            return;
        }
        if (!name.trim()) {
            toast({ title: "Erreur", description: "Le nom ne peut pas être vide.", variant: "destructive" });
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, { name: name.trim() });
            setUserNameState(name.trim()); 
            toast({ title: "Succès", description: "Votre nom a été mis à jour." });
            setIsOpen(false);
        } catch (error: any) {
            console.error("Error updating name:", error);
            toast({ title: "Erreur", description: "Impossible de mettre à jour le nom.", variant: "destructive" });
        }
    };
    
    const handleOpenPasswordDialog = () => {
        setIsOpen(false); // Close account dialog
        setIsPasswordDialogOpen(true); // Open password dialog
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mon Compte</DialogTitle>
                        <DialogDescription>Gérez les informations de votre profil.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom d'affichage</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="pt-4">
                             <Button variant="outline" onClick={handleOpenPasswordDialog} className="w-full">
                                <KeyRound className="mr-2 h-4 w-4" />
                                Changer mon mot de passe
                             </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PasswordChangeDialog
                isOpen={isPasswordDialogOpen}
                setIsOpen={setIsPasswordDialogOpen}
                user={user}
            />
        </>
    );
}


function PasswordChangeDialog({ isOpen, setIsOpen, user }: { isOpen: boolean, setIsOpen: (open: boolean) => void, user: any }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handlePasswordChange = async () => {
        if (!user || !user.email) {
            toast({ title: "Erreur", description: "Session utilisateur invalide.", variant: "destructive" });
            return;
        }
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Erreur", description: "Les nouveaux mots de passe ne correspondent pas.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
             toast({ title: "Erreur", description: "Le nouveau mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Re-authenticate the user for security
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);
            
            // If re-authentication is successful, update the password
            await updatePassword(user, newPassword);

            toast({ title: "Succès", description: "Votre mot de passe a été mis à jour." });
            setIsOpen(false);
            // Clear fields for next time
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            console.error("Error changing password:", error);
            let errorMessage = "Une erreur est survenue.";
            if (error.code === 'auth/wrong-password') {
                errorMessage = "L'ancien mot de passe est incorrect.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Le nouveau mot de passe est trop faible.";
            }
            toast({ title: "Échec de la modification", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                    <DialogDescription>Pour des raisons de sécurité, veuillez confirmer votre ancien mot de passe.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="oldPassword">Ancien mot de passe</Label>
                        <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Annuler</Button>
                    <Button onClick={handlePasswordChange} disabled={isSaving}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
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
  const [isAccountOpen, setIsAccountOpen] = useState(false);

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
        setArrivalDetails(data.arrivalDetails);

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
      window.location.reload();
  };

  const handleSaveResults = async (calculationData: CalculationData) => {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté.", variant: "destructive" });
      return;
    }
    try {
        const historyDocRef = correctionEntry 
            ? doc(db, 'users', user.uid, 'history', correctionEntry.id)
            : doc(collection(db, 'users', user.uid, 'history'));

        const batch = writeBatch(db);

        const newHistoryData: HistoryEntry = {
            ...calculationData,
            id: historyDocRef.id,
            stockDetails: stockDetails,
            arrivalDetails: arrivalDetails,
            expenseDetails: expenses,
            modificationLog: [], // Initialize for new entries
        };

        if (correctionEntry) {
            // --- CORRECTION MODE ---
            const originalData = correctionEntry;
            const changes: ChangeLog[] = [];

            // Compare main calculation fields
            (Object.keys(calculationData) as Array<keyof CalculationData>).forEach(key => {
                if (calculationData[key] !== originalData[key as keyof CalculationData]) {
                    changes.push({
                        champ: key,
                        ancienneValeur: originalData[key as keyof CalculationData],
                        nouvelleValeur: calculationData[key]
                    });
                }
            });
            
            // This is a simplified comparison logic. A more robust one would compare item by item.
            const originalStockTotal = originalData.stockDetails.reduce((sum, item) => sum + item.value, 0);
            if(originalStockTotal !== newHistoryData.currentStockTotal) {
                 changes.push({ champ: 'Total Stock Restant', ancienneValeur: originalStockTotal, nouvelleValeur: newHistoryData.currentStockTotal });
            }

            if (changes.length > 0) {
                const modification: Modification = {
                    dateModification: new Date().toISOString(),
                    changements: changes,
                };
                
                // Add new modification to the log
                const newLog = [...(originalData.modificationLog || []), modification];
                
                const updatedData = {
                    ...newHistoryData,
                    modifieLe: modification.dateModification,
                    modificationLog: newLog
                };
                
                batch.set(historyDocRef, updatedData); // Using set to overwrite with new calculated values

                toast({
                    title: "Correction Enregistrée!",
                    description: `Le journal des modifications a été mis à jour.`
                });
            } else {
                 toast({ title: "Aucune modification", description: "Aucun changement n'a été détecté." });
            }

        } else {
            // --- NORMAL SAVE MODE ---
            batch.set(historyDocRef, newHistoryData);

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

        // Reset state after saving
        if (!correctionEntry) {
            setManagerName('');
            setEncaissement(0);
            setExpenses([]);
            setEspeceGerant(0);
            setCalculationDate(new Date().toISOString().split('T')[0]);
        }
        
        if (correctionEntry) {
            setCorrectionEntry(null);
            window.location.reload();
        }

    } catch (error: any) {
        console.error("Failed to save results to Firestore", error);
        toast({
            title: "Erreur",
            description: "Impossible d'enregistrer les résultats. " + error.message,
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
           <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
             <ThemeToggle />

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center gap-2">
                <Button variant="secondary" size="icon" title="Mon Compte" onClick={() => setIsAccountOpen(true)}>
                    <User />
                    <span className="sr-only">Mon Compte</span>
                </Button>
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
                        <SlidersHorizontal />
                    </Button>
                </Link>
                <Button variant="destructive" size="icon" title="Déconnexion" onClick={handleLogout}>
                    <LogOut />
                    <span className="sr-only">Déconnexion</span>
                </Button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <Menu />
                            <span className="sr-only">Ouvrir le menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => setIsAccountOpen(true)}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Mon Compte</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsHelpOpen(true)}>
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            <span>Aide et Infos</span>
                        </DropdownMenuItem>
                        <Link href="/analysis">
                            <DropdownMenuItem>
                                <BarChart2 className="mr-2 h-4 w-4" />
                                <span>Analyse</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link href="/history">
                             <DropdownMenuItem>
                                <History className="mr-2 h-4 w-4" />
                                <span>Historique</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link href="/admin">
                            <DropdownMenuItem>
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                <span>Administration</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Déconnexion</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
      {user && <AccountDialog isOpen={isAccountOpen} setIsOpen={setIsAccountOpen} user={user} userName={userName} setUserNameState={setUserName} />}
    </>
  );
}
