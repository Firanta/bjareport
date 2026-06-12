// =============================================================
// BJA Report — Firestore Service Layer
// =============================================================

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import type {
  Plant,
  Vehicle,
  Trip,
  TripFormData,
  Invoice,
  InvoiceItem,
  AdditionalCost,
  CompanyProfile,
} from "@/types";

// ---- Collection names ----
const PLANTS = "plants";
const VEHICLES = "vehicles";
const TRIPS = "trips";
const INVOICES = "invoices";
const INVOICE_ITEMS = "invoiceItems";
const ADDITIONAL_COSTS = "additionalCosts";
const COMPANY_PROFILE = "companyProfile";

// ============================================================
// PLANTS
// ============================================================

export async function getPlants(): Promise<Plant[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), PLANTS), orderBy("nama", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plant));
}

export async function addPlant(
  data: Omit<Plant, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), PLANTS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlant(
  id: string,
  data: Partial<Omit<Plant, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), PLANTS, id), data);
}

export async function deletePlant(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), PLANTS, id));
}

// ============================================================
// VEHICLES
// ============================================================

export async function getVehicles(): Promise<Vehicle[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), VEHICLES), orderBy("nomorPolisi", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
}

export async function addVehicle(
  data: Omit<Vehicle, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), VEHICLES), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateVehicle(
  id: string,
  data: Partial<Omit<Vehicle, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), VEHICLES, id), data);
}

export async function deleteVehicle(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), VEHICLES, id));
}

// ============================================================
// TRIPS
// ============================================================

export async function getTrips(): Promise<Trip[]> {
  const snap = await getDocs(
    query(
      collection(getFirebaseDb(), TRIPS),
      orderBy("tanggal", "desc"),
      limit(300)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

export async function getTripsByMonth(
  bulan: number,
  tahun: number
): Promise<Trip[]> {
  // Format tanggal: YYYY-MM-DD — filter dengan string prefix
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-31`;
  const snap = await getDocs(
    query(
      collection(getFirebaseDb(), TRIPS),
      where("tanggal", ">=", startDate),
      where("tanggal", "<=", endDate),
      orderBy("tanggal", "asc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

export async function getTripById(id: string): Promise<Trip | null> {
  const snap = await getDoc(doc(getFirebaseDb(), TRIPS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Trip;
}

export async function checkDuplicateNoSuratJalan(
  noSuratJalan: string,
  excludeId?: string
): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(getFirebaseDb(), TRIPS),
      where("noSuratJalan", "==", noSuratJalan),
      limit(2)
    )
  );
  if (snap.empty) return false;
  if (excludeId) {
    return snap.docs.some((d) => d.id !== excludeId);
  }
  return true;
}

export async function addTrip(
  data: TripFormData,
  fotoSuratJalan: string = ""
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), TRIPS), {
    ...data,
    fotoSuratJalan,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTrip(
  id: string,
  data: Partial<TripFormData & { fotoSuratJalan: string }>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), TRIPS, id), data);
}

export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), TRIPS, id));
}

export async function getRecentTrips(count: number = 5): Promise<Trip[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), TRIPS), orderBy("createdAt", "desc"), limit(count))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

// ============================================================
// INVOICES
// ============================================================

export async function getInvoices(): Promise<Invoice[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), INVOICES), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(getFirebaseDb(), INVOICES, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Invoice;
}

export async function getNextInvoiceNumber(
  bulan: number,
  tahun: number
): Promise<string> {
  const prefix = `INV-${tahun}-${String(bulan).padStart(2, "0")}`;
  const snap = await getDocs(collection(getFirebaseDb(), INVOICES));
  
  const invoiceNums = snap.docs
    .map((d) => d.data().nomorInvoice as string)
    .filter((num) => num && num.startsWith(prefix));

  if (invoiceNums.length === 0) return `${prefix}-001`;

  // Sort lexicographically
  invoiceNums.sort();
  const lastNum = invoiceNums[invoiceNums.length - 1];
  const seq = parseInt(lastNum.split("-").pop() || "0", 10);
  return `${prefix}-${String(seq + 1).padStart(3, "0")}`;
}

export async function addInvoice(
  data: Omit<Invoice, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), INVOICES), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateInvoicePdfUrl(
  invoiceId: string,
  pdfUrl: string
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), INVOICES, invoiceId), { pdfUrl });
}

export async function deleteInvoice(id: string): Promise<void> {
  // Also delete related invoiceItems
  const itemsSnap = await getDocs(
    query(collection(getFirebaseDb(), INVOICE_ITEMS), where("invoiceId", "==", id))
  );
  const deletions = itemsSnap.docs.map((d) =>
    deleteDoc(doc(getFirebaseDb(), INVOICE_ITEMS, d.id))
  );
  await Promise.all([deleteDoc(doc(getFirebaseDb(), INVOICES, id)), ...deletions]);
}

export async function getRecentInvoices(count: number = 5): Promise<Invoice[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), INVOICES), orderBy("createdAt", "desc"), limit(count))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
}

// ============================================================
// INVOICE ITEMS
// ============================================================

export async function addInvoiceItems(
  invoiceId: string,
  tripIds: string[]
): Promise<void> {
  const adds = tripIds.map((tripId) =>
    addDoc(collection(getFirebaseDb(), INVOICE_ITEMS), { invoiceId, tripId })
  );
  await Promise.all(adds);
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), INVOICE_ITEMS), where("invoiceId", "==", invoiceId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InvoiceItem));
}

export async function getTripsForInvoice(invoiceId: string): Promise<Trip[]> {
  const items = await getInvoiceItems(invoiceId);
  const tripIds = items.map((item) => item.tripId);
  if (tripIds.length === 0) return [];

  const db = getFirebaseDb();
  const tripDocs = await Promise.all(
    tripIds.map((id) => getDoc(doc(db, TRIPS, id)))
  );

  return tripDocs
    .filter((snap) => snap.exists())
    .map((snap) => ({ id: snap.id, ...snap.data() } as Trip))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

// ============================================================
// ADDITIONAL COSTS
// ============================================================

export async function getAdditionalCosts(): Promise<AdditionalCost[]> {
  const snap = await getDocs(collection(getFirebaseDb(), ADDITIONAL_COSTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdditionalCost));
}

export async function addAdditionalCost(
  data: Omit<AdditionalCost, "id">
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), ADDITIONAL_COSTS), data);
  return ref.id;
}

export async function updateAdditionalCost(
  id: string,
  data: Partial<Omit<AdditionalCost, "id">>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), ADDITIONAL_COSTS, id), data);
}

export async function deleteAdditionalCost(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), ADDITIONAL_COSTS, id));
}

// ============================================================
// COMPANY PROFILE
// ============================================================

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COMPANY_PROFILE, "default"));
  if (!snap.exists()) return null;
  return snap.data() as CompanyProfile;
}

export async function saveCompanyProfile(data: CompanyProfile): Promise<void> {
  await setDoc(doc(getFirebaseDb(), COMPANY_PROFILE, "default"), data);
}

// ============================================================
// SEED DEFAULT DATA
// ============================================================

export async function seedDefaultData(): Promise<void> {
  // Only seed if collections are empty
  const plantsSnap = await getDocs(collection(getFirebaseDb(), PLANTS));
  if (plantsSnap.empty) {
    const defaultPlants = [
      { nama: "Plant Delta Mas Cikarang", hargaPerM3: 87000 },
      { nama: "Plant Readymix Cibubur", hargaPerM3: 80000 },
      { nama: "Plant Japek", hargaPerM3: 95000 },
    ];
    await Promise.all(
      defaultPlants.map((p) =>
        addDoc(collection(getFirebaseDb(), PLANTS), { ...p, createdAt: serverTimestamp() })
      )
    );
  }

  const vehiclesSnap = await getDocs(collection(getFirebaseDb(), VEHICLES));
  if (vehiclesSnap.empty) {
    const defaultVehicles = ["B 9437 JEU", "B 9564 TJ"];
    await Promise.all(
      defaultVehicles.map((nomorPolisi) =>
        addDoc(collection(getFirebaseDb(), VEHICLES), {
          nomorPolisi,
          createdAt: serverTimestamp(),
        })
      )
    );
  }

  const costsSnap = await getDocs(collection(getFirebaseDb(), ADDITIONAL_COSTS));
  if (costsSnap.empty) {
    const defaultCosts = [
      { nama: "Karang Taruna", nominal: 0 },
      { nama: "Biaya Operasional", nominal: 0 },
      { nama: "Biaya Lainnya", nominal: 0 },
    ];
    await Promise.all(
      defaultCosts.map((c) => addDoc(collection(getFirebaseDb(), ADDITIONAL_COSTS), c))
    );
  }

  const profileSnap = await getDoc(doc(getFirebaseDb(), COMPANY_PROFILE, "default"));
  if (!profileSnap.exists()) {
    await setDoc(doc(getFirebaseDb(), COMPANY_PROFILE, "default"), {
      nama: "H. SUPANDI",
      alamat:
        "Kp. Tunggilis RT 002/007\nDesa Situsari\nKecamatan Cileungsi\nKabupaten Bogor",
      noHp: "085882389089",
      bank: "BCA",
      rekening: "4060297636",
      atasNama: "H. SUPANDI",
    } as CompanyProfile);
  }
}
