"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { usePlants } from "@/hooks/usePlants";
import { useVehicles } from "@/hooks/useVehicles";
import { useTrips } from "@/hooks/useTrips";
import { checkDuplicateNoSuratJalan } from "@/lib/firebase/firestore";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  noPolisi: z.string().min(1, "No Polisi wajib diisi"),
  noSuratJalan: z.string().min(1, "No Surat Jalan wajib diisi"),
  plantId: z.string().min(1, "Plant wajib dipilih"),
  plantNama: z.string(),
  kubikasi: z.preprocess((v) => Number(v), z.number().positive("Kubikasi harus > 0")),
  // tonaseKuari is optional — empty/null/NaN → saved as 0, shown as "-" in invoice
  tonaseKuari: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    },
    z.number().min(0)
  ),
  // tonasePlan is optional — empty/null/NaN → saved as 0, shown as "-" in invoice
  tonasePlan: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    },
    z.number().min(0)
  ),
  jenisBarang: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

interface TripFormProps {
  defaultValues?: Partial<FormData>;
  tripId?: string;
  mode: "create" | "edit";
}

export function TripForm({ defaultValues, tripId, mode }: TripFormProps) {
  const router = useRouter();
  const { plants, loading: plantsLoading } = usePlants();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { createTrip, editTrip } = useTrips();
  const [duplicateError, setDuplicateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      jenisBarang: "Split",
      ...defaultValues,
    },
  });

  const selectedPlantId = watch("plantId");

  function handlePlantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const plant = plants.find((p) => p.id === id);
    setValue("plantId", id);
    setValue("plantNama", plant?.nama ?? "");

    if (plant && plant.items && plant.items.length > 0) {
      setValue("jenisBarang", plant.items[0].nama);
    } else {
      setValue("jenisBarang", "Split");
    }
  }

  async function onSubmit(data: FormData): Promise<void> {
    setDuplicateError(false);
    setSubmitting(true);
    try {
      // Duplicate check
      const isDup = await checkDuplicateNoSuratJalan(
        data.noSuratJalan,
        tripId
      );
      if (isDup) {
        setDuplicateError(true);
        setSubmitting(false);
        return;
      }

      if (mode === "create") {
        await createTrip(data);
      } else if (tripId) {
        await editTrip(tripId, data);
      }
      router.push("/trips");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const selectedPlantObj = plants.find(p => p.id === selectedPlantId);
  const availableItems = selectedPlantObj?.items && selectedPlantObj.items.length > 0 
    ? selectedPlantObj.items 
    : [{ id: "default-split", nama: "Split", hargaPerM3: selectedPlantObj?.hargaPerM3 || 0 }];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Duplicate error */}
      {duplicateError && (
        <Alert variant="danger" title="Nomor Surat Jalan Duplikat" dismissible onDismiss={() => setDuplicateError(false)}>
          Surat Jalan dengan nomor tersebut sudah pernah diinput. Periksa kembali nomor yang Anda masukkan.
        </Alert>
      )}

      {/* Form Grid */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "rgba(255,255,255,0.9)" }}>
          Informasi Surat Jalan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tanggal */}
          <div className="form-group">
            <label className="form-label" htmlFor="tanggal">Tanggal *</label>
            <input
              id="tanggal"
              type="date"
              className={`form-input ${errors.tanggal ? "error" : ""}`}
              max={today}
              {...register("tanggal")}
            />
            {errors.tanggal && (
              <p className="form-error">{errors.tanggal.message}</p>
            )}
          </div>

          {/* No Surat Jalan */}
          <div className="form-group">
            <label className="form-label" htmlFor="noSuratJalan">
              No Surat Jalan *
            </label>
            <input
              id="noSuratJalan"
              type="text"
              className={`form-input font-mono ${errors.noSuratJalan || duplicateError ? "error" : ""}`}
              placeholder="Contoh: 37893"
              {...register("noSuratJalan")}
            />
            {errors.noSuratJalan && (
              <p className="form-error">{errors.noSuratJalan.message}</p>
            )}
          </div>

          {/* No Polisi */}
          <div className="form-group">
            <label className="form-label" htmlFor="noPolisi">No Polisi *</label>
            {vehiclesLoading ? (
              <div className="form-input flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : (
              <select
                id="noPolisi"
                className={`form-input ${errors.noPolisi ? "error" : ""}`}
                {...register("noPolisi")}
              >
                <option value="">-- Pilih Kendaraan --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.nomorPolisi}>
                    {v.nomorPolisi}
                  </option>
                ))}
              </select>
            )}
            {errors.noPolisi && (
              <p className="form-error">{errors.noPolisi.message}</p>
            )}
          </div>

          {/* Plant */}
          <div className="form-group">
            <label className="form-label" htmlFor="plantId">Plant *</label>
            {plantsLoading ? (
              <div className="form-input flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : (
              <select
                id="plantId"
                className={`form-input ${errors.plantId ? "error" : ""}`}
                value={selectedPlantId || ""}
                onChange={handlePlantChange}
              >
                <option value="">-- Pilih Plant --</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            )}
            {errors.plantId && (
              <p className="form-error">{errors.plantId.message}</p>
            )}
            <input type="hidden" {...register("plantNama")} />
          </div>

          {/* Jenis Barang */}
          <div className="form-group">
            <label className="form-label" htmlFor="jenisBarang">Jenis Barang *</label>
            <select
              id="jenisBarang"
              className={`form-input ${errors.jenisBarang ? "error" : ""}`}
              {...register("jenisBarang")}
              disabled={!selectedPlantId}
            >
              {availableItems.map((item) => (
                <option key={item.id} value={item.nama}>
                  {item.nama}
                </option>
              ))}
            </select>
            {errors.jenisBarang && (
              <p className="form-error">{errors.jenisBarang.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Measurements */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "rgba(255,255,255,0.9)" }}>
          Data Pengukuran
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kubikasi */}
          <div className="form-group">
            <label className="form-label" htmlFor="kubikasi">
              Kubikasi (m³) *
            </label>
            <input
              id="kubikasi"
              type="number"
              step="any"
              className={`form-input ${errors.kubikasi ? "error" : ""}`}
              placeholder="Contoh: 18.430"
              {...register("kubikasi")}
            />
            {errors.kubikasi && (
              <p className="form-error">{errors.kubikasi.message}</p>
            )}
          </div>

          {/* Tonase Kuari */}
          <div className="form-group">
            <label className="form-label" htmlFor="tonaseKuari">
              Tonase Kuari (ton)
            </label>
            <input
              id="tonaseKuari"
              type="number"
              step="any"
              className={`form-input ${errors.tonaseKuari ? "error" : ""}`}
              placeholder="Kosongkan jika tidak ada"
              {...register("tonaseKuari")}
            />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Opsional — kosongkan jika tidak ada NETTO
            </p>
            {errors.tonaseKuari && (
              <p className="form-error">{errors.tonaseKuari.message}</p>
            )}
          </div>

          {/* Tonase Plan */}
          <div className="form-group">
            <label className="form-label" htmlFor="tonasePlan">
              Tonase Plan (ton)
            </label>
            <input
              id="tonasePlan"
              type="number"
              step="any"
              className={`form-input ${errors.tonasePlan ? "error" : ""}`}
              placeholder="Kosongkan jika tidak ada"
              {...register("tonasePlan")}
            />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Opsional — kosongkan jika tidak ada TIMBANGAN NET
            </p>
            {errors.tonasePlan && (
              <p className="form-error">{errors.tonasePlan.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Link href="/trips" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Batal
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {mode === "create" ? "Simpan Trip" : "Perbarui Trip"}
        </button>
      </div>
    </form>
  );
}
