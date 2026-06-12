export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { TripForm } from "@/components/trips/TripForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Input Manual Trip",
};

export default function NewTripPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-sm mb-3"
          style={{ color: "var(--brand-400)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Trip
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
          Input Trip Manual
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Isi semua field yang diperlukan. Nomor surat jalan tidak boleh duplikat.
        </p>
      </div>

      <TripForm mode="create" />
    </div>
  );
}
