// =============================================================
// BJA Report — useInvoices Hook (Realtime)
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { deleteInvoice } from "@/lib/firebase/firestore";
import type { Invoice } from "@/types";
import { toast } from "sonner";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(
        collection(getFirebaseDb(), "invoices"),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
          setInvoices(data);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime invoices snapshot error:", err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  const removeInvoice = useCallback(
    async (id: string) => {
      await deleteInvoice(id);
      toast.success("Invoice berhasil dihapus.");
    },
    []
  );

  // Group invoices by year > month
  const grouped = invoices.reduce<
    Record<number, Record<number, Invoice[]>>
  >((acc, inv) => {
    if (!acc[inv.tahun]) acc[inv.tahun] = {};
    if (!acc[inv.tahun][inv.bulan]) acc[inv.tahun][inv.bulan] = [];
    acc[inv.tahun][inv.bulan].push(inv);
    return acc;
  }, {});

  return {
    invoices,
    grouped,
    loading,
    refetch: () => {},
    removeInvoice,
  };
}
