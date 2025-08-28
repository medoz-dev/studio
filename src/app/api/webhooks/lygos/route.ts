
import { NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addMonths } from 'date-fns';
import crypto from 'crypto';

export async function POST(request: Request) {
  console.log("Webhook Lygos reçu.");

  try {
    const lygosSignature = request.headers.get('Lygos-Signature');
    const payload = await request.json();
    const bodyString = JSON.stringify(payload);

    // 1. Vérifier la signature du webhook (TRÈS IMPORTANT pour la sécurité)
    const webhookSecret = process.env.LYGOS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Le secret du webhook Lygos n'est pas configuré.");
      return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
    }

    if (!lygosSignature) {
        console.error("Signature Lygos manquante.");
        return NextResponse.json({ error: "Signature manquante." }, { status: 401 });
    }

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString, 'utf-8')
      .digest('hex');

    if (signature !== lygosSignature) {
      console.error("Signature Lygos invalide.");
      return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
    }

    console.log("Signature Lygos validée.");

    // 2. Traiter l'événement de paiement réussi
    if (payload.event === 'payment.succeeded') {
      console.log("Événement 'payment.succeeded' détecté.");

      // TODO: Extraire l'identifiant de l'utilisateur (email, ID, etc.) depuis le payload.
      // Cela dépend de la structure du payload de Lygos. 
      // Nous utiliserons un placeholder en attendant.
      const userIdentifier = payload.data?.customer?.email; // Hypothèse : l'email est dans le payload

      if (!userIdentifier) {
        console.error("Impossible de trouver l'identifiant de l'utilisateur dans le payload Lygos.");
        // Nous retournons quand même un succès à Lygos pour éviter les renvois, mais nous loguons l'erreur.
        return NextResponse.json({ message: "Webhook reçu mais identifiant utilisateur manquant." }, { status: 200 });
      }

      // TODO: Trouver l'utilisateur dans Firestore avec cet identifiant.
      // Pour l'instant, nous supposons que l'ID Firestore est l'email, ce qui n'est pas le cas.
      // Il faudra adapter cette logique pour retrouver le bon 'user.uid'.
      // Pour ce squelette, nous ne faisons pas la mise à jour, nous loguons juste.
      
      console.log(`Paiement réussi pour l'utilisateur: ${userIdentifier}. L'abonnement devrait être mis à jour.`);

      // Exemple de code pour mettre à jour la date d'abonnement (à activer plus tard)
      /*
      const userDocRef = doc(db, 'users', 'USER_UID_HERE'); // Remplacer par le vrai UID
      const newExpiryDate = addMonths(new Date(), 12); // Pour un abonnement d'un an
      await updateDoc(userDocRef, {
        finAbonnement: newExpiryDate
      });
      console.log(`Abonnement mis à jour pour l'utilisateur jusqu'au ${newExpiryDate.toISOString()}`);
      */
    }

    return NextResponse.json({ message: "Webhook traité avec succès" }, { status: 200 });

  } catch (error: any) {
    console.error("Erreur lors du traitement du webhook Lygos:", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
