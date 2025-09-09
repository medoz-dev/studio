import React from "react";
import { collection, getDocs, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, app } from "@/lib/firebaseAdmin"; // Utilisez l'initialisation admin
import { type Boisson } from "@/lib/data";
import AdminClient from "./AdminClient";

// Fonction pour récupérer les données côté serveur
async function getBoissons(userId: string): Promise<Boisson[]> {
  const userBoissonsRef = collection(db, 'users', userId, 'boissons');
  const q = orderBy('nom');
  try {
    const snapshot = await getDocs(userBoissonsRef);
    if (snapshot.empty) {
      return []; // Aucune boisson encore, le client s'en chargera
    }
    return snapshot.docs.map(doc => doc.data() as Boisson);
  } catch (error) {
    console.error("Erreur de récupération des boissons côté serveur:", error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
}

export default async function AdminPage() {
  // Ceci est un exemple et ne fonctionnera pas directement pour obtenir l'utilisateur côté serveur sans un gestionnaire de session.
  // Dans un scénario réel, nous aurions besoin de 'next-auth' ou d'une autre méthode de session pour obtenir l'UID de l'utilisateur.
  // Pour la démonstration et puisque nous ne pouvons pas encore implémenter une session complète, nous allons passer les données initiales
  // et laisser le hook `useBoissons` côté client gérer l'authentification et les mises à jour en temps réel.
  
  // Puisque nous ne pouvons pas obtenir l'utilisateur de manière fiable ici sans changer l'architecture d'authentification,
  // nous allons passer un tableau vide et laisser le client charger.
  // Une meilleure approche serait d'obtenir la session.
  const initialBoissons: Boisson[] = [];

  return <AdminClient initialBoissons={initialBoissons} />;
}
