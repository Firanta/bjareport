// =============================================================
// BJA Report — useVehicles Hook (Realtime)
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import {
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/lib/firebase/firestore";
import type { Vehicle } from "@/types";
import { toast } from "sonner";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(
        collection(getFirebaseDb(), "vehicles"),
        orderBy("nomorPolisi", "asc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
          setVehicles(data);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime vehicles snapshot error:", err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  const createVehicle = useCallback(
    async (nomorPolisi: string) => {
      await addVehicle({ nomorPolisi });
      toast.success("Kendaraan berhasil ditambahkan.");
    },
    []
  );

  const editVehicle = useCallback(
    async (id: string, nomorPolisi: string) => {
      await updateVehicle(id, { nomorPolisi });
      toast.success("Kendaraan berhasil diperbarui.");
    },
    []
  );

  const removeVehicle = useCallback(
    async (id: string) => {
      await deleteVehicle(id);
      toast.success("Kendaraan berhasil dihapus.");
    },
    []
  );

  return {
    vehicles,
    loading,
    refetch: () => {},
    createVehicle,
    editVehicle,
    removeVehicle,
  };
}
