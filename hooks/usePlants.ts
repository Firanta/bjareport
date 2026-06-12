// =============================================================
// BJA Report — usePlants Hook (Realtime)
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import {
  addPlant,
  updatePlant,
  deletePlant,
} from "@/lib/firebase/firestore";
import type { Plant } from "@/types";
import { toast } from "sonner";

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(
        collection(getFirebaseDb(), "plants"),
        orderBy("nama", "asc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plant));
          setPlants(data);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime plants snapshot error:", err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  const createPlant = useCallback(
    async (data: Omit<Plant, "id" | "createdAt">) => {
      await addPlant(data);
      toast.success("Plant berhasil ditambahkan.");
    },
    []
  );

  const editPlant = useCallback(
    async (id: string, data: Partial<Omit<Plant, "id" | "createdAt">>) => {
      await updatePlant(id, data);
      toast.success("Plant berhasil diperbarui.");
    },
    []
  );

  const removePlant = useCallback(
    async (id: string) => {
      await deletePlant(id);
      toast.success("Plant berhasil dihapus.");
    },
    []
  );

  return {
    plants,
    loading,
    refetch: () => {},
    createPlant,
    editPlant,
    removePlant,
  };
}
