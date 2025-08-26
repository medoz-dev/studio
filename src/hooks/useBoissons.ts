
"use client";

import { useState, useEffect, useCallback } from 'react';
import { type Boisson, defaultBoissons } from '@/lib/data';

const BOISSONS_STORAGE_KEY = 'boissonsData';

export function useBoissons() {
    const [boissons, setBoissons] = useState<Boisson[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedBoissons = localStorage.getItem(BOISSONS_STORAGE_KEY);
            if (storedBoissons) {
                setBoissons(JSON.parse(storedBoissons));
            } else {
                // Initialize with default data if nothing is in storage
                const sortedDefaults = [...defaultBoissons].sort((a, b) => a.nom.localeCompare(b.nom));
                setBoissons(sortedDefaults);
                localStorage.setItem(BOISSONS_STORAGE_KEY, JSON.stringify(sortedDefaults));
            }
        } catch (error) {
            console.error("Failed to load boissons from localStorage", error);
            setBoissons([...defaultBoissons].sort((a, b) => a.nom.localeCompare(b.nom)));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveBoissons = useCallback((newBoissons: Boisson[]) => {
        const sortedBoissons = [...newBoissons].sort((a, b) => a.nom.localeCompare(b.nom));
        setBoissons(sortedBoissons);
        localStorage.setItem(BOISSONS_STORAGE_KEY, JSON.stringify(sortedBoissons));
    }, []);

    const addBoisson = useCallback((newBoisson: Boisson) => {
        const updatedBoissons = [...boissons, newBoisson];
        saveBoissons(updatedBoissons);
    }, [boissons, saveBoissons]);

    const updateBoisson = useCallback((nom: string, updatedBoisson: Boisson) => {
        const updatedBoissons = boissons.map(b => (b.nom === nom ? updatedBoisson : b));
        saveBoissons(updatedBoissons);
    }, [boissons, saveBoissons]);

    const deleteBoisson = useCallback((nom: string) => {
        const updatedBoissons = boissons.filter(b => b.nom !== nom);
        saveBoissons(updatedBoissons);
    }, [boissons, saveBoissons]);

    return { boissons, isLoading, addBoisson, updateBoisson, deleteBoisson };
}
