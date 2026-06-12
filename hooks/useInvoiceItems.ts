// =============================================================
// BJA Report — useInvoiceItems Hook (Realtime)
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";

export function useInvoiceItems() {
  // Map of tripId -> invoiceId
  const [invoicedTrips, setInvoicedTrips] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(getFirebaseDb(), "invoiceItems");
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const mapping: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.tripId && data.invoiceId) {
            mapping[data.tripId] = data.invoiceId;
          }
        });
        setInvoicedTrips(mapping);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime invoiceItems snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { invoicedTrips, loading };
}
