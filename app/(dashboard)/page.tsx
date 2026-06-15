
"use client";

import { useEffect, useState } from "react";
import { Truck, Layers, Banknote, FileText } from "lucide-react";
import { getTrips, getRecentInvoices, getRecentTrips, getPlants } from "@/lib/firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import {
  formatRupiah,
  formatNumber,
  formatDate,
  getMonthName,
  getCurrentMonthYear,
} from "@/lib/utils";
import type { Trip, Invoice, Plant } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Link from "next/link";
import { FilePlus, Eye } from "lucide-react";
import { CryptoCard } from "@/components/ui/asset-card";

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

export default function DashboardPage() {
  const { bulan, tahun } = getCurrentMonthYear();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    
    // Calculate start date for trips query (this month + last month only)
    const lastMonthBulan = bulan === 1 ? 12 : bulan - 1;
    const lastMonthTahun = bulan === 1 ? tahun - 1 : tahun;
    const startQueryDate = `${lastMonthTahun}-${String(lastMonthBulan).padStart(2, "0")}-01`;

    const unsubPlants = onSnapshot(
      query(collection(db, "plants"), orderBy("nama", "asc")),
      (snap) => {
        setPlants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plant)));
      }
    );

    const unsubRecentInvoices = onSnapshot(
      query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(5)),
      (snap) => {
        setRecentInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice)));
      }
    );

    const unsubRecentTrips = onSnapshot(
      query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(5)),
      (snap) => {
        setRecentTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)));
      }
    );

    const unsubTrips = onSnapshot(
      query(
        collection(db, "trips"),
        where("tanggal", ">=", startQueryDate),
        orderBy("tanggal", "desc")
      ),
      (snap) => {
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)));
        setLoading(false);
      },
      (err) => {
        console.error("Trips realtime error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubPlants();
      unsubRecentInvoices();
      unsubRecentTrips();
      unsubTrips();
    };
  }, [bulan, tahun]);

  // Filter trips for current month
  const prefix = `${tahun}-${String(bulan).padStart(2, "0")}`;
  const thisMonthTrips = trips.filter((t) => t.tanggal?.startsWith(prefix));

  // Filter last month's trips for performance calculation
  const lastMonthBulan = bulan === 1 ? 12 : bulan - 1;
  const lastMonthTahun = bulan === 1 ? tahun - 1 : tahun;
  const lastMonthPrefix = `${lastMonthTahun}-${String(lastMonthBulan).padStart(2, "0")}`;
  const lastMonthTrips = trips.filter((t) => t.tanggal?.startsWith(lastMonthPrefix));

  const totalKubikasi = thisMonthTrips.reduce((s, t) => s + (t.kubikasi ?? 0), 0);
  const totalPendapatan = thisMonthTrips.reduce((s, t) => {
    const plant = plants.find((p) => p.id === t.plantId || p.nama === t.plantNama);
    let harga = plant?.hargaPerM3 ?? 0;
    if (plant?.items && t.jenisBarang) {
      const item = plant.items.find((i) => i.nama === t.jenisBarang);
      if (item) {
        harga = item.hargaPerM3;
      }
    }
    return s + (t.kubikasi ?? 0) * harga;
  }, 0);

  const plantCardsData = plants.map((plant, index) => {
    const plantThisMonthTrips = thisMonthTrips.filter((t) => t.plantId === plant.id || t.plantNama === plant.nama);
    const plantLastMonthTrips = lastMonthTrips.filter((t) => t.plantId === plant.id || t.plantNama === plant.nama);

    const thisMonthKubikasi = plantThisMonthTrips.reduce((s, t) => s + (t.kubikasi ?? 0), 0);
    const lastMonthKubikasi = plantLastMonthTrips.reduce((s, t) => s + (t.kubikasi ?? 0), 0);

    const currentPrice = plant.hargaPerM3 ?? 0;
    
    const portfolioValue = plantThisMonthTrips.reduce((s, t) => {
      let harga = plant.hargaPerM3 ?? 0;
      if (plant.items && t.jenisBarang) {
        const item = plant.items.find((i) => i.nama === t.jenisBarang);
        if (item) harga = item.hargaPerM3;
      }
      return s + (t.kubikasi ?? 0) * harga;
    }, 0);

    const lastMonthPortfolioValue = plantLastMonthTrips.reduce((s, t) => {
      let harga = plant.hargaPerM3 ?? 0;
      if (plant.items && t.jenisBarang) {
        const item = plant.items.find((i) => i.nama === t.jenisBarang);
        if (item) harga = item.hargaPerM3;
      }
      return s + (t.kubikasi ?? 0) * harga;
    }, 0);

    const portfolioChange = portfolioValue - lastMonthPortfolioValue;

    let percentageChange = 0;
    if (lastMonthKubikasi > 0) {
      percentageChange = ((thisMonthKubikasi - lastMonthKubikasi) / lastMonthKubikasi) * 100;
    } else if (thisMonthKubikasi > 0) {
      percentageChange = 100;
    }

    const leverage = plantThisMonthTrips.length;

    // Beautiful distinct dark gradients
    const gradients = [
      "from-purple-700/80 to-purple-900/60",
      "from-emerald-700/80 to-emerald-900/60",
      "from-amber-700/80 to-amber-900/60",
      "from-cyan-700/80 to-cyan-900/60",
      "from-pink-700/80 to-pink-900/60",
    ];
    const gradientFrom = gradients[index % gradients.length];

    // Icons mapping
    const icons = [
      <Layers className="w-5 h-5 text-white/90" key="layers" />,
      <Truck className="w-5 h-5 text-white/90" key="truck" />,
      <Banknote className="w-5 h-5 text-white/90" key="banknote" />,
    ];
    const icon = icons[index % icons.length];

    return {
      id: plant.id,
      name: plant.nama,
      ticker: plant.nama.replace("Plant ", "").replace(" Cikarang", "").substring(0, 3).toUpperCase(),
      percentageChange,
      currentPrice,
      portfolioValue,
      portfolioChange,
      leverage,
      gradientFrom,
      icon,
    };
  });

  const statCards: StatCard[] = [
    {
      label: `Total Trip (${getMonthName(bulan)})`,
      value: String(thisMonthTrips.length),
      icon: Truck,
      gradient: "",
      iconBg: "rgba(139,92,246,0.2)",
      iconColor: "#c084fc",
    },
    {
      label: `Total Kubikasi (${getMonthName(bulan)})`,
      value: `${formatNumber(totalKubikasi)} m³`,
      icon: Layers,
      gradient: "",
      iconBg: "rgba(16,185,129,0.2)",
      iconColor: "#34d399",
    },
    {
      label: `Total Invoice (${getMonthName(bulan)})`,
      value: String(
        recentInvoices.filter(
          (i) => i.bulan === bulan && i.tahun === tahun
        ).length
      ),
      icon: FileText,
      gradient: "",
      iconBg: "rgba(168,85,247,0.2)",
      iconColor: "#e879f9",
    },
    {
      label: "Total Invoice (All)",
      value: String(trips.length),
      icon: Banknote,
      gradient: "",
      iconBg: "rgba(245,158,11,0.2)",
      iconColor: "#fbbf24",
    },
  ];

  // Chart data: group by plant
  const plantTotals: Record<string, { trips: number; kubikasi: number }> = {};
  for (const t of thisMonthTrips) {
    if (!plantTotals[t.plantNama]) {
      plantTotals[t.plantNama] = { trips: 0, kubikasi: 0 };
    }
    plantTotals[t.plantNama].trips++;
    plantTotals[t.plantNama].kubikasi += t.kubikasi ?? 0;
  }
  const chartData = Object.entries(plantTotals).map(([plant, vals]) => ({
    plant: plant.replace("Plant ", "").replace(" Cikarang", ""),
    trips: vals.trips,
    kubikasi: Math.round(vals.kubikasi * 100) / 100,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--brand-500)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Ringkasan aktivitas transportasi PT Wanna Mulia Sejahtera
          </p>
        </div>
        <Link href="/trips/new" className="btn btn-primary">
          <FilePlus className="w-4 h-4" />
          Input Trip
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {card.label}
                </p>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Harga & Kinerja per Plant */}
      {plantCardsData.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Harga & Kinerja per Plant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantCardsData.map((card) => (
              <CryptoCard
                key={card.id}
                icon={card.icon}
                name={card.name}
                ticker={card.ticker}
                percentageChange={card.percentageChange}
                currentPrice={card.currentPrice}
                portfolioValue={card.portfolioValue}
                portfolioChange={card.portfolioChange}
                leverage={card.leverage}
                gradientFrom={card.gradientFrom}
              />
            ))}
          </div>
        </div>
      )}

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-base font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            Trip & Kubikasi per Plant
          </h2>
          <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Bulan {getMonthName(bulan)} {tahun}
          </p>
          {chartData.length === 0 ? (
            <div
              className="h-48 flex items-center justify-center rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                Belum ada data trip bulan ini.
              </p>
            </div>
          ) : (
            <div style={{ width: "100%", height: 220, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={6} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="plant"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  {/* Left Y Axis for Trips */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Trip', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.3)', fontSize: 10 } }}
                  />
                  {/* Right Y Axis for Kubikasi */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'm³', angle: 90, position: 'insideRight', style: { fill: 'rgba(255,255,255,0.3)', fontSize: 10 } }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid rgba(139,92,246,0.3)",
                      background: "rgba(15,0,30,0.9)",
                      color: "white",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
                  <Bar yAxisId="left" dataKey="trips" name="Jumlah Trip" fill="#a855f7" radius={[4,4,0,0]} />
                  <Bar yAxisId="right" dataKey="kubikasi" name="Kubikasi (m³)" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              Invoice Terakhir
            </h2>
            <Link
              href="/invoices/history"
              className="text-xs font-medium"
              style={{ color: "var(--brand-400)" }}
            >
              Lihat semua
            </Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                Belum ada invoice.
              </p>
            ) : (
              recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {inv.nomorInvoice}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {getMonthName(inv.bulan)} {inv.tahun}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "var(--brand-400)" }}>
                      {formatRupiah(inv.grandTotal)}
                    </p>
                    <a
                      href={`/api/pdf?id=${inv.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:text-purple-400 transition-colors"
                      style={{ color: "var(--brand-400)" }}
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      PDF
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Trip Terakhir
          </h2>
          <Link href="/trips" className="text-xs font-medium" style={{ color: "var(--brand-400)" }}>
            Lihat semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No Polisi</th>
                <th>No Surat Jalan</th>
                <th>Plant</th>
                <th>Kubikasi</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: "var(--gray-400)" }}>
                    Belum ada data trip.
                  </td>
                </tr>
              ) : (
                recentTrips.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.tanggal)}</td>
                    <td>
                      <span className="badge badge-info">{t.noPolisi}</span>
                    </td>
                    <td className="font-mono text-xs">{t.noSuratJalan}</td>
                    <td>
                      <span className="badge badge-gray">{t.plantNama?.replace("Plant ", "")}</span>
                    </td>
                    <td className="font-semibold">{formatNumber(t.kubikasi)} m³</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
