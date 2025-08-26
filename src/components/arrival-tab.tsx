"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter as TableFoot, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Boisson } from '@/lib/data';
import { Printer, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArrivalTabProps {
  onArrivalUpdate: (total: number) => void;
  boissons: Boisson[];
}

interface ArrivalItem {
  boisson: Boisson;
  quantity: number;
  caseSize: number;
  value: number;
}

export default function ArrivalTab({ onArrivalUpdate, boissons }: ArrivalTabProps) {
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalQuantities, setArrivalQuantities] = useState<Record<string, { quantity: number; caseSize?: number }>>({});
  const { toast } = useToast();
  
  const arrivalDetails: ArrivalItem[] = useMemo(() => {
    return boissons.map(boisson => {
        const { quantity = 0, caseSize } = arrivalQuantities[boisson.nom] || {};
        let selectedCaseSize = Array.isArray(boisson.trous) ? (caseSize ?? boisson.trous[0]) : (boisson.trous as number);
        
        let value = 0;
        if (boisson.type === 'unite') {
            value = quantity * boisson.prix;
        } else {
            value = quantity * selectedCaseSize * boisson.prix;
        }

        return { boisson, quantity, caseSize: selectedCaseSize, value };
    });
  }, [arrivalQuantities, boissons]);

  const totalArrivalValue = useMemo(() => {
    return arrivalDetails.reduce((acc, item) => acc + item.value, 0);
  }, [arrivalDetails]);

  useEffect(() => {
    onArrivalUpdate(totalArrivalValue);
  }, [totalArrivalValue, onArrivalUpdate]);

  const handleQuantityChange = (nom: string, value: string) => {
    const quantity = Number(value);
    if (!isNaN(quantity) && quantity >= 0) {
      setArrivalQuantities(prev => ({ ...prev, [nom]: { ...prev[nom], quantity } }));
    }
  };

  const handleCaseSizeChange = (nom: string, value: string) => {
    const caseSize = Number(value);
    setArrivalQuantities(prev => ({ ...prev, [nom]: { ...prev[nom], caseSize } }));
  };
  
  const saveArrivalData = () => {
    try {
      const arrivalData = {
          date: arrivalDate,
          total: totalArrivalValue,
          details: arrivalDetails.map(item => ({
              nom: item.boisson.nom,
              quantite: item.quantity,
              valeur: item.value
          }))
      };
      localStorage.setItem('arrivalData', JSON.stringify(arrivalData));
      toast({
        title: "Succès!",
        description: "Arrivage enregistré avec succès !",
      });
    } catch (error) {
      console.error("Failed to save arrival data", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'arrivage.",
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
        <CardHeader><CardTitle>Calcul de l'Arrivage</CardTitle></CardHeader>
        <CardContent>
            <div className="bg-primary/5 border-l-4 border-accent text-primary/80 p-4 mb-6 rounded-md" role="alert">
                <p>Veuillez entrer le nombre de casiers, sachets, cartons ou emballages arrivés pour chaque type de boisson.</p>
            </div>
            <div className="max-w-sm">
                <Label htmlFor="arrivalDate">Date d'arrivage:</Label>
                <Input type="date" id="arrivalDate" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
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
                          <TableHead>Unités par Casier/Sachet</TableHead>
                          <TableHead className="min-w-64">Nombre Arrivé</TableHead>
                          <TableHead className="text-right">Valeur</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {arrivalDetails.map(({ boisson, quantity, caseSize, value }) => (
                          <TableRow key={boisson.nom}>
                              <TableCell className="font-medium whitespace-nowrap">{boisson.nom}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                  {Array.isArray(boisson.trous) ? `${boisson.trous.join(' ou ')} unités` : boisson.type === 'unite' ? 'Unité' : `${boisson.trous} unités`}
                              </TableCell>
                              <TableCell>
                                  <div className="flex gap-2 items-center">
                                      <Input 
                                          type="number" 
                                          min="0"
                                          step="0.5"
                                          value={quantity === 0 ? '' : quantity}
                                          onChange={(e) => handleQuantityChange(boisson.nom, e.target.value)}
                                          placeholder='0'
                                          className="text-center w-24"
                                      />
                                      {Array.isArray(boisson.trous) && (
                                          <Select value={String(caseSize)} onValueChange={(val) => handleCaseSizeChange(boisson.nom, val)}>
                                              <SelectTrigger className="w-48">
                                                  <SelectValue placeholder="Type de casier" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  {boisson.trous.map(size => <SelectItem key={size} value={String(size)}>{size} trous</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                      )}
                                  </div>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">{boisson.prix > 0 ? `${value.toLocaleString()} FCFA` : 'N/A'}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
                  <TableFoot>
                      <TableRow>
                          <TableCell colSpan={3} className="font-bold text-lg">Total</TableCell>
                          <td className="text-right font-bold text-lg whitespace-nowrap">{totalArrivalValue.toLocaleString()} FCFA</td>
                      </TableRow>
                  </TableFoot>
              </Table>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button onClick={saveArrivalData}><Save className="mr-2 h-4 w-4"/>Enregistrer l'Arrivage</Button>
            <Button variant="outline" onClick={printReport}><Printer className="mr-2 h-4 w-4"/>Imprimer le Rapport</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
