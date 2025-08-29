
export type Boisson = {
  nom: string;
  prix: number;
  trous: number | number[];
  type: "casier" | "sachet" | "carton" | "unite";
  special?: boolean;
  specialPrice?: number;
  specialUnit?: number;
  specialPrices?: { unit: number; price: number }[];
};

export const defaultBoissons: Boisson[] = [
    { nom: "AWOYO", prix: 1000, trous: 12, type: "casier" },
    { nom: "B.fort gr", prix: 600, trous: [12, 20], type: "casier" },
    { nom: "B.Fort pt", prix: 400, trous: 24, type: "casier" },
    { nom: "Black Label", prix: 25000, trous: 1, type: "unite" },
    { nom: "Budweiser", prix: 600, trous: 12, type: "casier" },
    { nom: "Campari", prix: 12000, trous: 1, type: "unite" },
    { nom: "Castel", prix: 500, trous: [12, 20], type: "casier" },
    { nom: "Chill", prix: 600, trous: [12, 20], type: "casier" },
    { nom: "Desperados Can.", prix: 500, trous: 24, type: "carton" },
    { nom: "Desperados Bt.", prix: 1300, trous: 24, type: "carton" },
    { nom: "Doppel Energy", prix: 500, trous: 24, type: "casier" },
    { nom: "Doppel_NOIR", prix: 600, trous: [12, 20], type: "casier" },
    { nom: "Doppel_Lager", prix: 500, trous: 24, type: "casier" },
    { nom: "EAUX", prix: 600, trous: 6, type: "sachet" },
    { nom: "EKU", prix: 600, trous: 24, type: "casier" },
    { nom: "Flag", prix: 600, trous: 12, type: "casier" },
    { nom: "Guiness", prix: 700, trous: 24, type: "casier" },
    { nom: "Gulder", prix: 500, trous: 12, type: "casier" },
    { nom: "Hagbe", prix: 500, trous: [12, 20], type: "casier" },
    { nom: "Heinecken Bt.", prix: 1000, trous: 24, type: "carton" },
    { nom: "Heinecken Can.", prix: 500, trous: 24, type: "carton" },
    { nom: "Henessy", prix: 0, trous: 1, type: "unite" },
    { nom: "Imperial", prix: 0, trous: 1, type: "unite" },
    { nom: "J.P Chenet", prix: 6000, trous: 6, type: "carton" },
    { nom: "Label CINQ", prix: 10000, trous: 1, type: "unite" },
    { nom: "La Beninoise Gr", prix: 600, trous: 12, type: "casier" },
    { 
      nom: "La Beninoise Pt", 
      prix: 350, 
      trous: 24, 
      type: "casier",
      special: true,
      specialPrices: [
        { unit: 3, price: 1000 }
      ]
    },
    { nom: "Legend", prix: 600, trous: 12, type: "casier" },
    { nom: "Lion-force", prix: 600, trous: 24, type: "casier" },
    { nom: "Malta Café", prix: 350, trous: 24, type: "casier" },
    { nom: "Malta Guiness", prix: 500, trous: 24, type: "sachet" },
    { nom: "Muscador", prix: 6000, trous: 6, type: "sachet" },
    { nom: "Pils gr", prix: 800, trous: 12, type: "casier" },
    { nom: "Pils pt", prix: 500, trous: 24, type: "casier" },
    { nom: "Racines", prix: 700, trous: [12, 20], type: "casier" },
    { nom: "Rox", prix: 800, trous: 24, type: "carton" },
    { nom: "Red Label", prix: 10000, trous: 1, type: "unite" },
    { nom: "Savana", prix: 1500, trous: 24, type: "carton" },
    { nom: "Sucrerie gr", prix: 500, trous: [12, 20], type: "casier" },
    { nom: "Sucrerie pt", prix: 300, trous: 24, type: "casier" },
    { nom: "Tequila", prix: 500, trous: 24, type: "casier" },
    { nom: "VIN", prix: 3000, trous: 6, type: "casier" },
    { nom: "Vin Valmond", prix: 1000, trous: 20, type: "casier" },
    { nom: "Vodka", prix: 8000, trous: 1, type: "unite" },
    { nom: "Vody", prix: 800, trous: 24, type: "carton" },
    { nom: "Whisky cola", prix: 600, trous: [12, 20], type: "casier" },
    { nom: "XXL", prix: 600, trous: 6, type: "sachet" },
];

    