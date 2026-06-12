// =============================================================
// BJA Report — useTrips Hook (Realtime)
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import {
  addTrip,
  updateTrip,
  deleteTrip,
} from "@/lib/firebase/firestore";
import type { Trip, TripFormData } from "@/types";
import { toast } from "sonner";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(getFirebaseDb(), "trips"),
        orderBy("tanggal", "desc"),
        limit(300)
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
          setTrips(data);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime trips snapshot error:", err);
          setError("Gagal memuat data trip secara realtime.");
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal inisialisasi database.");
      setLoading(false);
    }
  }, []);

  const createTrip = useCallback(
    async (data: TripFormData, fotoUrl = "") => {
      const id = await addTrip(data, fotoUrl);
      toast.success("Trip berhasil disimpan.");
      return id;
    },
    []
  );

  const editTrip = useCallback(
    async (id: string, data: Partial<TripFormData & { fotoSuratJalan: string }>) => {
      await updateTrip(id, data);
      toast.success("Trip berhasil diperbarui.");
    },
    []
  );

  const removeTrip = useCallback(
    async (id: string) => {
      await deleteTrip(id);
      toast.success("Trip berhasil dihapus.");
    },
    []
  );

  return {
    trips,
    loading,
    error,
    refetch: () => {},
    createTrip,
    editTrip,
    removeTrip,
  };
}

export function useTripsByMonth(bulan: number, tahun: number) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-31`;
    
    try {
      const q = query(
        collection(getFirebaseDb(), "trips"),
        where("tanggal", ">=", startDate),
        where("tanggal", "<=", endDate),
        orderBy("tanggal", "asc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
          setTrips(data);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime monthly trips snapshot error:", err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [bulan, tahun]);

  return { trips, loading };
}

export function useTripsByDateRange(startDate: string, endDate: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate || !endDate) {
      setTrips([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(getFirebaseDb(), "trips"),
        where("tanggal", ">=", startDate),
        where("tanggal", "<=", endDate),
        orderBy("tanggal", "asc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
          setTrips(data);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime date-range trips snapshot error:", err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [startDate, endDate]);

  return { trips, loading };
}

