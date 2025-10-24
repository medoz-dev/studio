
"use client";

import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { type Manager } from '@/lib/types';

export function useManagers() {
    const [managers, setManagers] = useState<Manager[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setManagers([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const managersRef = collection(db, 'users', user.uid, 'managers');

        const unsubscribe = onSnapshot(managersRef, (snapshot) => {
            const managersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Manager))
                .sort((a, b) => a.nom.localeCompare(b.nom));
            setManagers(managersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching managers:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addManager = async (newManager: Omit<Manager, 'id'>) => {
        if (!user) throw new Error("Utilisateur non connecté");
        const newDocRef = doc(collection(db, 'users', user.uid, 'managers'));
        await writeBatch(db).set(newDocRef, { ...newManager, id: newDocRef.id }).commit();
        // The local state will be updated by the onSnapshot listener
    };

    const updateManager = async (id: string, updatedManager: Partial<Manager>) => {
        if (!user) throw new Error("Utilisateur non connecté");
        const docRef = doc(db, 'users', user.uid, 'managers', id);
        await writeBatch(db).set(docRef, updatedManager, { merge: true }).commit();
    };

    const deleteManager = async (id: string) => {
        if (!user) throw new Error("Utilisateur non connecté");
        const docRef = doc(db, 'users', user.uid, 'managers', id);
        await writeBatch(db).delete(docRef).commit();
    };

    return { managers, isLoading, addManager, updateManager, deleteManager };
}
