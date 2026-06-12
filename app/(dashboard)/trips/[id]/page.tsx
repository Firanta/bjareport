"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTripById } from "@/lib/firebase/firestore";
import { TripForm } from "@/components/trips/TripForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Trip } from "@/types";

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTripById(id).then((data) => {
      setTrip(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-500)" }} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.45)" }}>
        Trip tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm mb-3" style={{ color: "var(--brand-400)" }}>
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
          Edit Trip #{trip.noSuratJalan}
        </h1>
      </div>

      <TripForm
        mode="edit"
        tripId={id}
        defaultValues={{
          tanggal: trip.tanggal,
          noPolisi: trip.noPolisi,
          noSuratJalan: trip.noSuratJalan,
          plantId: trip.plantId,
          plantNama: trip.plantNama,
          jenisBarang: trip.jenisBarang,
          kubikasi: trip.kubikasi || undefined,
          tonaseKuari: trip.tonaseKuari || undefined,
          tonasePlan: trip.tonasePlan || undefined,
        }}
      />
    </div>
  );
}
