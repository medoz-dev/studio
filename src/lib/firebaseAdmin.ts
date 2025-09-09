import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: Remplacez ceci par le chemin vers votre propre fichier de clé de service
// Vous pouvez télécharger ce fichier depuis la console Firebase > Paramètres du projet > Comptes de service
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
    throw new Error("La variable d'environnement FIREBASE_SERVICE_ACCOUNT_KEY n'est pas définie. Assurez-vous de la configurer avec le contenu JSON de votre clé de service Firebase.");
}

let app: App;

if (!getApps().length) {
    app = initializeApp({
        credential: cert(JSON.parse(serviceAccount))
    });
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
