"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter as TableFoot, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { type Boisson } from '@/lib/data';
import { Printer, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockTabProps {
  onStockUpdate: (total: number) => void;
  boissons: Boisson[];
}

interface StockItem {
  boisson: Boisson;
  quantity: number;
  value: number;
}

export default function StockTab({ onStockUpdate, boissons }: StockTabProps) {
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const stockDetails: StockItem[] = useMemo(() => {
    return boissons.map(boisson => {
      const quantity = stockQuantities[boisson.nom] || 0;
      let value = 0;
      if (boisson.special && boisson.specialUnit && boisson.specialPrice) {
        const groups = Math.round((quantity / boisson.specialUnit) * 10) / 10;
        value = Math.round(groups * boisson.specialPrice);
      } else {
        value = quantity * boisson.prix;
      }
      return { boisson, quantity, value };
    });
  }, [stockQuantities, boissons]);

  const totalStockValue = useMemo(() => {
    return stockDetails.reduce((acc, item) => acc + item.value, 0);
  }, [stockDetails]);

  useEffect(() => {
    onStockUpdate(totalStockValue);
  }, [totalStockValue, onStockUpdate]);
  
  const handleQuantityChange = (nom: string, value: string) => {
    const quantity = Number(value);
    if (!isNaN(quantity) && quantity >= 0) {
      setStockQuantities(prev => ({ ...prev, [nom]: quantity }));
    }
  };

  const saveStockData = () => {
    try {
      const stockData = {
        date: stockDate,
        total: totalStockValue,
        details: stockDetails.map(item => ({
          nom: item.boisson.nom,
          quantite: item.quantity,
          valeur: item.value
        }))
      };
      localStorage.setItem('currentStockDetails', JSON.stringify(stockData));
      toast({
        title: "Succès!",
        description: "Stock restant enregistré localement!",
      });
    } catch (error) {
      console.error("Failed to save stock data", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le stock.",
        variant: "destructive"
      });
    }
  };

  const printReport = () => {
    window.print();
  };

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
                <div className="max-w-sm">
                    <Label htmlFor="stockDate">Date d'inventaire:</Label>
                    <Input type="date" id="stockDate" value={stockDate} onChange={(e) => setStockDate(e.target.value)} />
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
                          {stockDetails.map(({ boisson, quantity, value }) => (
                              <TableRow key={boisson.nom}>
                                  <TableCell className="font-medium whitespace-nowrap">{boisson.nom}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                      {boisson.special ? `${boisson.specialPrice} FCFA / ${boisson.specialUnit} unités` : `${boisson.prix} FCFA`}
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
                              <TableCell colSpan={3} className="font-bold text-lg">Total</TableCell>
                              <td className="text-right font-bold text-lg whitespace-nowrap">{totalStockValue.toLocaleString()} FCFA</td>
                          </TableRow>
                      </TableFoot>
                  </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={saveStockData}><Save className="mr-2 h-4 w-4" />Enregistrer le Stock</Button>
                <Button variant="outline" onClick={printReport}><Printer className="mr-2 h-4 w-4" />Imprimer le Rapport</Button>
            </CardFooter>
        </Card>
    </div>
  );
}
