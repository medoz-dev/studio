
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter as TableFoot, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { type Boisson } from '@/lib/data';
import { Printer, Search } from 'lucide-react';


export interface StockItem {
  boisson: Boisson;
  quantity: number;
  value: number;
}

interface StockTabProps {
  onStockUpdate: (total: number, details: StockItem[]) => void;
  boissons: Boisson[];
  stockQuantities: Record<string, number>;
  onQuantityChange: (quantities: Record<string, number>) => void;
  isCorrectionMode?: boolean;
}

function calculateValue(quantity: number, boisson: Boisson): number {
    if (quantity === 0) return 0;
    
    if (boisson.special) {
        // Special calculation: (units / 3) * 1000, then rounded.
        const rawValue = (quantity / 3) * 1000;
        return Math.ceil(rawValue / 50) * 50;
    }
    
    // Default calculation
    return quantity * boisson.prix;
}


export default function StockTab({ onStockUpdate, boissons, stockQuantities, onQuantityChange, isCorrectionMode = false }: StockTabProps) {
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBoissons = useMemo(() => {
    if (!searchTerm) {
      // In correction mode, we want to show all reloaded items, even if they were deleted from the catalog
      if (isCorrectionMode) {
          const reloadedNoms = Object.keys(stockQuantities);
          const currentBoissonsNoms = boissons.map(b => b.nom);
          const allNoms = [...new Set([...reloadedNoms, ...currentBoissonsNoms])];
          
          return allNoms.map(nom => {
              const currentBoisson = boissons.find(b => b.nom === nom);
              // We need to reconstruct a Boisson object if it was deleted.
              // This is a simplification; the original `stockDetails` in history has the full object.
              // The logic in dashboard page correctly reloads the state, here we just need to display it.
              return currentBoisson || { nom, prix: 0, type: 'unite', trous: 0 }; 
          }).sort((a, b) => a.nom.localeCompare(b.nom));
      }
      return boissons;
    }
    return boissons.filter(b =>
      b.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, boissons, isCorrectionMode, stockQuantities]);

  const stockDetails: StockItem[] = useMemo(() => {
    // Logic to calculate details based on all available quantities, not just filtered.
    // This is important for the total calculation.
    const allItems = boissons.map(boisson => {
      const quantity = stockQuantities[boisson.nom] || 0;
      let value = calculateValue(quantity, boisson);
      return { boisson, quantity, value };
    });
    // In correction mode, we must also include items that might not exist in `boissons` anymore
    if (isCorrectionMode) {
        Object.keys(stockQuantities).forEach(nom => {
            if (!allItems.some(item => item.boisson.nom === nom)) {
                 const quantity = stockQuantities[nom];
                 // This is a placeholder, the real `boisson` object is in the HistoryEntry
                 const placeholderBoisson: Boisson = { nom, prix: 0, type: 'unite', trous: 0 }; 
                 const value = 0; // Value cannot be calculated without price.
                 allItems.push({boisson: placeholderBoisson, quantity, value });
            }
        });
    }

    return allItems;

  }, [stockQuantities, boissons, isCorrectionMode]);

  const totalStockValue = useMemo(() => {
    // The total is calculated from ALL quantities, not just filtered.
    return stockDetails.reduce((acc, item) => acc + item.value, 0);
  }, [stockDetails]);


  useEffect(() => {
    const allStockDetails = boissons
      .map(boisson => {
        const quantity = stockQuantities[boisson.nom] || 0;
        if (quantity > 0) {
            const value = calculateValue(quantity, boisson);
            return { boisson, quantity, value };
        }
        return null;
      })
      .filter((d): d is StockItem => d !== null);

    onStockUpdate(totalStockValue, allStockDetails);
  }, [totalStockValue, stockQuantities, boissons, onStockUpdate]);
  
  const handleQuantityChange = (nom: string, value: string) => {
    const quantity = Number(value);
    if (!isNaN(quantity) && quantity >= 0) {
        const newQuantities = { ...stockQuantities, [nom]: quantity };
        onQuantityChange(newQuantities);
    }
  };

  const printReport = () => {
    window.print();
  };

  // Create a sorted list for display purposes
  const displayDetails: StockItem[] = useMemo(() => {
    return filteredBoissons.map(boisson => {
        const quantity = stockQuantities[boisson.nom] || 0;
        let value = calculateValue(quantity, boisson);
        return { boisson, quantity, value };
    });
  }, [filteredBoissons, stockQuantities]);


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Calcul du Stock Restant</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-primary/5 border-l-4 border-accent text-primary/80 p-4 mb-6 rounded-md" role="alert">
                    <p>Veuillez entrer le nombre de boissons restantes en stock pour chaque type. Le système calculera automatiquement la valeur totale du stock.</p>
                </div>
                 <div className="flex justify-between items-end gap-4">
                    <div className="max-w-sm">
                        <Label htmlFor="stockDate">Date d'inventaire:</Label>
                        <Input type="date" id="stockDate" value={stockDate} onChange={(e) => setStockDate(e.target.value)} disabled={isCorrectionMode} />
                    </div>
                     <div className="flex items-end gap-2 w-full max-w-xs">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Rechercher une boisson..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Boisson</TableHead>
                              <TableHead>Prix Unitaire</TableHead>
                              <TableHead className="w-32">Nombre</TableHead>
                              <TableHead className="text-right">Valeur</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {displayDetails.map(({ boisson, quantity, value }) => (
                              <TableRow key={boisson.nom}>
                                  <TableCell className="font-medium whitespace-nowrap">{boisson.nom}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                      {boisson.prix === 0 && !boisson.special ? <span className="text-muted-foreground">N/A</span> : boisson.special ? 'Prix spécial' : `${boisson.prix} FCFA`}
                                  </TableCell>
                                  <TableCell>
                                      <Input 
                                          type="number" 
                                          min="0"
                                          value={quantity === 0 ? '' : quantity} 
                                          placeholder='0'
                                          onChange={(e) => handleQuantityChange(boisson.nom, e.target.value)}
                                          className="text-center"
                                      />
                                  </TableCell>
                                  <TableCell className="text-right whitespace-nowrap">{value.toLocaleString()} FCFA</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                      <TableFoot>
                          <TableRow>
                              <TableCell colSpan={3} className="font-bold text-lg">Total Général</TableCell>
                              <td className="text-right font-bold text-lg whitespace-nowrap">{totalStockValue.toLocaleString()} FCFA</td>
                          </TableRow>
                      </TableFoot>
                  </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={printReport}><Printer className="mr-2 h-4 w-4" />Imprimer le Rapport</Button>
            </CardFooter>
        </Card>
    </div>
  );
}

    
