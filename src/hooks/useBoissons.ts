
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { type Boisson, defaultBoissons } from '@/lib/data';

export function useBoissons() {
    const [boissons, setBoissons] = useState<Boisson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setBoissons([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const userBoissonsRef = collection(db, 'users', user.uid, 'boissons');

        const unsubscribe = onSnapshot(userBoissonsRef, (snapshot) => {
            if (snapshot.empty) {
                // First time user, let's populate their data
                const batch = writeBatch(db);
                defaultBoissons.forEach(boisson => {
                    const docRef = doc(userBoissonsRef, boisson.nom);
                    batch.set(docRef, boisson);
                });
                batch.commit().then(() => setIsLoading(false));
            } else {
                const boissonsData = snapshot.docs
                    .map(doc => doc.data() as Boisson)
                    .sort((a, b) => a.nom.localeCompare(b.nom));
                setBoissons(boissonsData);
                setIsLoading(false);
            }
        }, (error) => {
            console.error("Error fetching boissons:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    const addBoisson = async (newBoisson: Boisson) => {
        if (!user) return;
        const userBoissonsRef = collection(db, 'users', user.uid, 'boissons');
        const docRef = doc(userBoissonsRef, newBoisson.nom);
        const batch = writeBatch(db);
        batch.set(docRef, newBoisson);
        await batch.commit();
    };

    const updateBoisson = async (nom: string, updatedBoisson: Boisson) => {
        if (!user) return;
        const userBoissonsRef = collection(db, 'users', user.uid, 'boissons');
        const docRef = doc(userBoissonsRef, nom);
        const batch = writeBatch(db);
        batch.set(docRef, updatedBoisson, { merge: true });
        await batch.commit();
    };

    const deleteBoisson = async (nom: string) => {
        if (!user) return;
        const userBoissonsRef = collection(db, 'users', user.uid, 'boissons');
        const docRef = doc(userBoissonsRef, nom);
        const batch = writeBatch(db);
        batch.delete(docRef);
        await batch.commit();
    };

    return { boissons, isLoading, addBoisson, updateBoisson, deleteBoisson };
}
