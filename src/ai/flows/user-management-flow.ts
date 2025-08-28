
'use server';
/**
 * @fileOverview Fonctions sécurisées pour la gestion des utilisateurs par un administrateur.
 *
 * - listUsers - Récupère la liste de tous les utilisateurs et leur statut d'abonnement.
 * - updateUserSubscription - Met à jour la date de fin d'abonnement d'un utilisateur.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { addDays, addMonths, addYears } from 'date-fns';

// Configuration de Firebase Admin (ne s'exécute qu'une seule fois côté serveur)
function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }
  return initializeApp();
}

const UserInfoSchema = z.object({
  uid: z.string(),
  email: z.string(),
  creationTime: z.string(),
  finAbonnement: z.string().optional().describe("Date d'expiration de l'abonnement au format ISO"),
});
export type UserInfo = z.infer<typeof UserInfoSchema>;

const ListUsersOutputSchema = z.array(UserInfoSchema);
export type ListUsersOutput = z.infer<typeof ListUsersOutputSchema>;

export async function listUsers(adminEmail: string): Promise<ListUsersOutput> {
  return listUsersFlow(adminEmail);
}

const listUsersFlow = ai.defineFlow(
  {
    name: 'listUsersFlow',
    inputSchema: z.string().email(),
    outputSchema: ListUsersOutputSchema,
  },
  async (adminEmail) => {
    // Mesure de sécurité: Seul l'e-mail admin codé en dur peut exécuter cette fonction.
    if (adminEmail !== 'melchiorganglo642@gmail.com') {
      throw new Error('Accès non autorisé.');
    }

    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);
    
    const listUsersResult = await auth.listUsers();
    
    const usersWithSubscription = await Promise.all(
        listUsersResult.users.map(async (userRecord) => {
            const userDocRef = db.collection('users').doc(userRecord.uid);
            const userDoc = await userDocRef.get();
            let finAbonnement: string | undefined = undefined;
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data && data.finAbonnement) {
                    finAbonnement = data.finAbonnement.toDate().toISOString();
                }
            }

            return {
                uid: userRecord.uid,
                email: userRecord.email || 'N/A',
                creationTime: userRecord.metadata.creationTime,
                finAbonnement: finAbonnement,
            };
        })
    );
    return usersWithSubscription;
  }
);


const UpdateSubscriptionInputSchema = z.object({
  adminEmail: z.string().email(),
  userId: z.string(),
  duration: z.enum(['1m', '6m', '1y']),
});
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionInputSchema>;

export async function updateUserSubscription(input: UpdateSubscriptionInput): Promise<string> {
  return updateUserSubscriptionFlow(input);
}

const updateUserSubscriptionFlow = ai.defineFlow({
    name: 'updateUserSubscriptionFlow',
    inputSchema: UpdateSubscriptionInputSchema,
    outputSchema: z.string(),
}, async ({ adminEmail, userId, duration }) => {
    if (adminEmail !== 'melchiorganglo642@gmail.com') {
        throw new Error('Accès non autorisé.');
    }

    const db = getFirestore(getAdminApp());
    const userDocRef = db.collection('users').doc(userId);

    // Déterminer la date de début : maintenant ou la fin d'abonnement existante si elle est dans le futur
    const userDoc = await userDocRef.get();
    let startDate = new Date();
    if (userDoc.exists) {
        const data = userDoc.data();
        if (data && data.finAbonnement) {
            const currentExpiry = data.finAbonnement.toDate();
            if (currentExpiry > startDate) {
                startDate = currentExpiry;
            }
        }
    }

    let newExpiryDate: Date;
    switch(duration) {
        case '1m':
            newExpiryDate = addMonths(startDate, 1);
            break;
        case '6m':
            newExpiryDate = addMonths(startDate, 6);
            break;
        case '1y':
            newExpiryDate = addYears(startDate, 1);
            break;
    }

    // Ajouter le bonus de 24h
    newExpiryDate = addDays(newExpiryDate, 1);

    await userDocRef.set({
        finAbonnement: newExpiryDate
    }, { merge: true });

    return newExpiryDate.toISOString();
});
