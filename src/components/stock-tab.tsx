
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter as TableFoot, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { type Boisson } from '@/lib/data';
import { Printer, Search, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { numberToWords, parseSpokenNumber } from '@/lib/voice-utils';
import { textToSpeech } from '@/ai/flows/tts-flow';


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
}

export default function StockTab({ onStockUpdate, boissons, stockQuantities, onQuantityChange }: StockTabProps) {
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const boissonsMap = useMemo(() => new Map(boissons.map(b => [b.nom.toLowerCase(), b])), [boissons]);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim().toLowerCase();
        console.log("Texte reconnu:", transcript);
        processVoiceCommand(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Erreur de reconnaissance vocale:", event.error);
      if (event.error !== 'no-speech') {
        toast({ title: "Erreur Vocale", description: `Erreur: ${event.error}`, variant: "destructive"});
      }
      // Stop listening on error to avoid loops
      if (isListening) {
        toggleListening();
      }
    };
    
    recognition.onend = () => {
        if(isListeningRef.current) {
            recognition.start();
        }
    }

    recognitionRef.current = recognition;
    const isListeningRef = React.createRef<boolean>();
    // @ts-ignore
    isListeningRef.current = isListening;


    return () => {
      if(recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Erreur de lecture audio:", e));
    }
  }, [audioUrl]);


  const speak = async (text: string) => {
    try {
        const response = await textToSpeech(text);
        setAudioUrl(response.media);
    } catch (error) {
        console.error("Erreur de synthèse vocale:", error);
        toast({ title: "Erreur Vocale", description: "Impossible de générer la réponse vocale.", variant: "destructive"});
    }
  }


  const processVoiceCommand = (command: string) => {
    let bestMatch: Boisson | null = null;
    let quantity: number | null = null;
    
    let longestMatchLength = 0;
    for (const [nom, boisson] of boissonsMap.entries()) {
        const index = command.indexOf(nom);
        if (index !== -1 && nom.length > longestMatchLength) {
            bestMatch = boisson;
            longestMatchLength = nom.length;
        }
    }
    
    if (bestMatch) {
        const remainingCommand = command.substring(command.indexOf(bestMatch.nom.toLowerCase()) + longestMatchLength).trim();
        const parsedQty = parseSpokenNumber(remainingCommand);
        if (parsedQty !== null) {
            quantity = parsedQty;
        }
    }

    if (bestMatch && quantity !== null) {
        handleQuantityChange(bestMatch.nom, String(quantity));
        const confirmationText = `${bestMatch.nom}: ${quantity} unités.`;
        toast({
            title: "Stock mis à jour",
            description: confirmationText,
        });
        speak(confirmationText.replace(':',','));
    } else {
        const errorText = `Commande non comprise. Essayez "Nom de la boisson" suivi d'un nombre.`;
        toast({
            title: "Commande non comprise",
            description: `Je n'ai pas compris "${command}".`,
            variant: "destructive",
        });
        speak(errorText);
    }
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        toast({ title: "Erreur", description: "La reconnaissance vocale n'est pas disponible sur ce navigateur.", variant: "destructive" });
        return;
    };
    
    setIsListening(prev => {
        const nextState = !prev;
         // @ts-ignore
        recognition.onend = () => {
            if (nextState) {
                try { recognition.start(); } catch(e){}
            }
        }
        if (nextState) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Could not start recognition", e);
                toast({ title: "Erreur", description: "Impossible de démarrer. Vérifiez les permissions du micro.", variant: "destructive" });
                return false;
            }
        } else {
            recognition.stop();
        }
        return nextState;
    });
  };


  const filteredBoissons = useMemo(() => {
    if (!searchTerm) {
      return boissons;
    }
    return boissons.filter(b =>
      b.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, boissons]);

  const stockDetails: StockItem[] = useMemo(() => {
    return filteredBoissons.map(boisson => {
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
  }, [stockQuantities, filteredBoissons]);

  const totalStockValue = useMemo(() => {
    // We calculate total based on ALL quantities, not just filtered ones
    return boissons.reduce((acc, boisson) => {
        const quantity = stockQuantities[boisson.nom] || 0;
        let value = 0;
        if (boisson.special && boisson.specialUnit && boisson.specialPrice) {
            const groups = Math.round((quantity / boisson.specialUnit) * 10) / 10;
            value = Math.round(groups * boisson.specialPrice);
        } else {
            value = quantity * boisson.prix;
        }
        return acc + value;
    }, 0);
  }, [stockQuantities, boissons]);

  useEffect(() => {
    const allStockDetails = boissons
      .map(boisson => {
        const quantity = stockQuantities[boisson.nom] || 0;
        let value = 0;
        if (boisson.special && boisson.specialUnit && boisson.specialPrice) {
          const groups = Math.round((quantity / boisson.specialUnit) * 10) / 10;
          value = Math.round(groups * boisson.specialPrice);
        } else {
          value = quantity * boisson.prix;
        }
        return { boisson, quantity, value };
      })
      .filter(d => d.quantity > 0);

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
                        <Input type="date" id="stockDate" value={stockDate} onChange={(e) => setStockDate(e.target.value)} />
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
                        {recognitionRef.current && (
                            <Button variant={isListening ? "destructive" : "outline"} size="icon" onClick={toggleListening}>
                                {isListening ? <MicOff /> : <Mic />}
                            </Button>
                        )}
                    </div>
                </div>
                 {isListening && <p className="text-center text-primary font-semibold mt-4 animate-pulse">J'écoute... Dites par exemple "Castel quinze"</p>}
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
                              <TableHead className="text-right">Valeur (filtrée)</TableHead>
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
         {audioUrl && <audio ref={audioRef} src={audioUrl} />}
    </div>
  );
}
