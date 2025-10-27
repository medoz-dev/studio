
import type { ArrivalItem } from "@/components/arrival-tab";
import type { Expense } from "@/components/calculations-tab";
import type { StockItem } from "@/components/stock-tab";

export interface CalculationData {
    date: string;
    managerName: string;
    oldStock: number;
    arrivalTotal: number;
    generalStock: number;
    currentStockTotal: number;
    theoreticalSales: number;
    encaissement: number;
    reste: number;
    totalExpenses: number;
    finalReste: number;
    especeGerant: number;
    finalResult: number;
}

export interface ChangeLog {
    champ: string;
    ancienneValeur: string | number;
    nouvelleValeur: string | number;
}

export interface Modification {
    dateModification: string;
    changements: ChangeLog[];
}
  
export interface HistoryEntry extends CalculationData {
    id: string; // Firestore ID is a string
    stockDetails: StockItem[];
    arrivalDetails: ArrivalItem[];
    expenseDetails: Expense[];
    modifieLe?: string; // Optional: ISO date string for modification tracking
    modificationLog?: Modification[]; // NEW: Detailed audit trail
}

export interface Manager {
    id: string; // Firestore ID
    nom: string;
    telephone: string;
    dateEntree: string; // ISO date string
}

export interface UserPreferences {
    font?: string;
}
    
