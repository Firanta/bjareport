// =============================================================
// BJA Report — PDF Invoice Template (React PDF)
// =============================================================
// Rendered server-side via /api/pdf route.
// =============================================================

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
} from "@react-pdf/renderer";
import path from "path";
import type { Invoice, Trip, CompanyProfile } from "@/types";

// Date formatting helper matching the user's Excel style (e.g. 22-May-26)
function formatDateExcel(dateStr: string): string {
  try {
    if (!dateStr) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateStr.split("-");
    if (parts.length !== 3) {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mmm = months[d.getMonth()];
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}-${mmm}-${yy}`;
    }
    const year = parts[0].slice(-2);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = String(parseInt(parts[2], 10)).padStart(2, "0");
    const mmm = months[monthIdx];
    return `${day}-${mmm}-${year}`;
  } catch {
    return dateStr;
  }
}

// Currency format matching Excel style (using en-US style commas/dots)
function formatRpPdf(val: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
  return `Rp ${formatted}`;
}

// Number format helper
function formatNumberPdf(val: number, decimals = 3): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    paddingHorizontal: 40,
    paddingVertical: 35,
    color: "#1e293b", // Slate 800 (more professional dark slate instead of pure black)
    backgroundColor: "#fff",
  },
  // Header section
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  logoContainer: {
    width: "45%",
  },
  logo: {
    width: 130,
    height: 55,
    objectFit: "contain",
  },
  logoSubtext: {
    fontSize: 7,
    color: "#64748b", // Slate 500
    marginTop: 3,
    letterSpacing: 0.5,
    fontFamily: "Helvetica-Oblique",
  },
  headerInfoRight: {
    width: "50%",
    alignItems: "flex-end",
    marginTop: 5,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a", // Slate 900
    marginBottom: 4,
    letterSpacing: 1,
  },
  plantBadge: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5", // Indigo 600
    marginBottom: 8,
  },
  metaTable: {
    width: "100%",
    alignItems: "flex-end",
  },
  metaTableRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  metaTableLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569", // Slate 600
    width: 70,
    textAlign: "right",
    paddingRight: 5,
  },
  metaTableValue: {
    fontSize: 7.5,
    color: "#0f172a",
    width: 100,
    textAlign: "right",
  },
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1", // Slate 300
    marginVertical: 12,
  },
  // Two column details: billing and payment
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailsColumnLeft: {
    width: "48%",
  },
  detailsColumnRight: {
    width: "48%",
  },
  columnTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#475569", // Slate 600
    marginBottom: 5,
    letterSpacing: 0.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
  },
  columnTextBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  columnText: {
    fontSize: 8,
    color: "#334155", // Slate 700
    lineHeight: 1.3,
  },
  // Table styling
  table: {
    width: "100%",
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a", // Dark border below header
    alignItems: "center",
    paddingVertical: 5,
    backgroundColor: "#f8fafc", // Very soft background for header
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0", // Very light grey border below rows
    alignItems: "center",
    paddingVertical: 4,
  },
  th: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  td: {
    fontSize: 7.5,
    color: "#334155",
    paddingHorizontal: 2,
  },
  // Calculation block
  calcContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  calcBox: {
    width: "35%",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  calcLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#475569",
    width: "55%",
  },
  calcValue: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    textAlign: "right",
    width: "45%",
    color: "#0f172a",
  },
  calcValueBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textAlign: "right",
    width: "45%",
    color: "#0f172a",
  },
  // Grand Summary Total (bottom left)
  summaryContainer: {
    marginTop: 15,
    width: "45%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: "#475569",
  },
  summaryValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textAlign: "right",
    color: "#0f172a",
  },
  summaryDivider: {
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    marginVertical: 4,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  summaryLabelTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#0f172a",
  },
  summaryValueTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textAlign: "right",
    color: "#4f46e5", // Indigo color for the grand total!
  },
  // Footer signature section
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 35,
    paddingHorizontal: 10,
  },
  thanksText: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#475569",
  },
  signatureContainer: {
    width: 150,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    borderTopWidth: 1,
    borderTopColor: "#475569",
    paddingTop: 3,
    width: "100%",
    textAlign: "center",
    marginTop: 2,
  },
});

interface RenderPageHeaderProps {
  plantNama: string;
  company: CompanyProfile;
  invoiceDate: string;
  nomorInvoice: string;
  startDate?: string;
  endDate?: string;
}

const DEFAULT_COMPANY: CompanyProfile = {
  nama: "H. SUPANDI",
  alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kecamatan Cileungsi, Kabupaten Bogor",
  noHp: "085882389089",
  bank: "BCA",
  rekening: "4060297636",
  atasNama: "H. SUPANDI",
};

const RenderPageHeader = ({
  plantNama,
  company,
  invoiceDate,
  nomorInvoice,
  startDate,
  endDate,
}: RenderPageHeaderProps) => {
  const c = {
    nama: company?.nama || DEFAULT_COMPANY.nama,
    alamat: company?.alamat || DEFAULT_COMPANY.alamat,
    noHp: company?.noHp || DEFAULT_COMPANY.noHp,
    bank: company?.bank || DEFAULT_COMPANY.bank,
    rekening: company?.rekening || DEFAULT_COMPANY.rekening,
    atasNama: company?.atasNama || DEFAULT_COMPANY.atasNama,
  };

  const logoPath = path.join(process.cwd(), "public/logo.png");
  const displayPlantNama = plantNama.toUpperCase().startsWith("PLANT")
    ? plantNama.toUpperCase()
    : `PLANT ${plantNama.toUpperCase()}`;

  return (
    <View>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.logoContainer}>
          <Image src={logoPath} style={styles.logo} />
          <Text style={styles.logoSubtext}>JASA TRANSPORTER & LOGISTIK</Text>
        </View>

        <View style={styles.headerInfoRight}>
          <Text style={styles.invoiceTitle}>TAGIHAN / INVOICE</Text>
          <Text style={styles.plantBadge}>{displayPlantNama}</Text>

          <View style={styles.metaTable}>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaTableLabel}>NO. INVOICE :</Text>
              <Text style={styles.metaTableValue}>{nomorInvoice}</Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaTableLabel}>TANGGAL :</Text>
              <Text style={styles.metaTableValue}>{formatDateExcel(invoiceDate)}</Text>
            </View>
            {startDate && endDate && (
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableLabel}>PERIODE :</Text>
                <Text style={styles.metaTableValue}>
                  {formatDateExcel(startDate)} - {formatDateExcel(endDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Horizontal Divider */}
      <View style={styles.divider} />

      {/* Two Column details: Billing info & Payment info */}
      <View style={styles.detailsRow}>
        {/* Left Column: Issued To */}
        <View style={styles.detailsColumnLeft}>
          <Text style={styles.columnTitle}>DITERBITKAN KEPADA</Text>
          <Text style={styles.columnTextBold}>PT. WANNA MULIA SEJAHTERA</Text>
          <Text style={styles.columnText}>Kecamatan Cileungsi</Text>
          <Text style={styles.columnText}>Kabupaten Bogor, Jawa Barat</Text>
        </View>

        {/* Right Column: Payment Info */}
        <View style={styles.detailsColumnRight}>
          <Text style={styles.columnTitle}>INFORMASI PEMBAYARAN</Text>
          <Text style={styles.columnTextBold}>Bank {c.bank}</Text>
          <Text style={styles.columnText}>Nama Rekening: {c.atasNama}</Text>
          <Text style={styles.columnText}>Nomor Rekening: {c.rekening}</Text>
          <Text style={styles.columnText}>No. HP/Kontak: {c.noHp}</Text>
        </View>
      </View>
    </View>
  );
};

interface Props {
  invoice: Invoice;
  trips: Trip[];
  company: CompanyProfile;
  plantId?: string;
}

export function InvoicePdfDocument({ invoice, trips, company, plantId }: Props) {
  // Full list of all plant keys in this invoice (used to determine which is the last plant)
  const allPlantIds = Object.keys(invoice.subtotalPlant);

  const plantIds = plantId
    ? allPlantIds.filter((pid) => pid === plantId || pid.startsWith(plantId + "_"))
    : allPlantIds;

  return (
    <Document
      title={invoice.nomorInvoice}
      author="BJA Report"
      subject={`Invoice ${invoice.nomorInvoice}`}
    >
      {plantIds.map((pid, index) => {
        const plantInfo = invoice.subtotalPlant[pid];

        // pid is formatted as "plantId_jenisBarang" or just "plantId" (old data)
        const parsedPlantId = pid.includes("_") ? pid.split("_")[0] : pid;
        const parsedJenisBarang = pid.includes("_") ? pid.split("_").slice(1).join("_") : null;

        const plantTrips = trips
          .filter((t) => {
            if (t.plantId !== parsedPlantId) return false;
            if (!parsedJenisBarang) return true;
            // Case-insensitive comparison — key is normalized to lowercase
            return (t.jenisBarang || "split").toLowerCase() === parsedJenisBarang.toLowerCase();
          })
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

        const isLastPage = index === plantIds.length - 1;

        // When downloading per-plant, show the grand summary only on the last plant
        // in the full invoice order (so the recipient gets the complete breakdown).
        const isLastPlantOverall = allPlantIds[allPlantIds.length - 1] === pid;

        return (
          <Page key={pid} size="A4" style={styles.page}>
            {/* Page Header */}
            <RenderPageHeader
              plantNama={plantInfo.plantNama}
              company={company}
              invoiceDate={invoice.invoiceDate}
              nomorInvoice={invoice.nomorInvoice}
              startDate={invoice.startDate}
              endDate={invoice.endDate}
            />

            {/* Trips Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: "5%" }]}>NO</Text>
                <Text style={[styles.th, { width: "12%" }]}>TANGGAL</Text>
                <Text style={[styles.th, { width: "15%" }]}>NO. POLISI</Text>
                <Text style={[styles.th, { width: "15%" }]}>NO. SRT JLN</Text>
                <Text style={[styles.th, { width: "13%" }]}>JENIS</Text>
                <Text style={[styles.th, { width: "13%" }]}>TON KUARI</Text>
                <Text style={[styles.th, { width: "13%" }]}>TON PLAN</Text>
                <Text style={[styles.th, { width: "14%" }]}>KUBIKASI</Text>
              </View>

              {plantTrips.map((t, i) => (
                <View key={t.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: "5%", textAlign: "center" }]}>{i + 1}</Text>
                  <Text style={[styles.td, { width: "12%", textAlign: "center" }]}>{formatDateExcel(t.tanggal)}</Text>
                  <Text style={[styles.td, { width: "15%", textAlign: "center" }]}>{t.noPolisi}</Text>
                  <Text style={[styles.td, { width: "15%", textAlign: "center" }]}>{t.noSuratJalan}</Text>
                  <Text style={[styles.td, { width: "13%", textAlign: "center" }]}>{t.jenisBarang}</Text>
                  <Text style={[styles.td, { width: "13%", textAlign: "right" }]}>{formatNumberPdf(t.tonaseKuari ?? 0, 2)}</Text>
                  <Text style={[styles.td, { width: "13%", textAlign: "right" }]}>
                    {t.tonasePlan !== null && t.tonasePlan !== undefined && Number(t.tonasePlan) !== 0 && !isNaN(Number(t.tonasePlan))
                      ? formatNumberPdf(Number(t.tonasePlan), 3)
                      : "-"}
                  </Text>
                  <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>
                    {formatNumberPdf(t.kubikasi ?? 0, 2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calculations Box */}
            <View style={styles.calcContainer}>
              <View style={styles.calcBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Jumlah Kubikasi :</Text>
                  <Text style={styles.calcValueBold}>{formatNumberPdf(plantInfo.totalKubikasi, 3)}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Jumlah {plantInfo.jenisBarang || "Split"} :</Text>
                  <Text style={styles.calcValue}>
                    {formatNumberPdf(plantInfo.totalKubikasi, 3)} x {formatNumberPdf(plantInfo.hargaPerM3, 0)}
                  </Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Hasil (x) :</Text>
                  <Text style={styles.calcValueBold}>{formatRpPdf(plantInfo.subtotal)}</Text>
                </View>
              </View>
            </View>

            {/* Grand Summary Block on the Last Page */}
            {/* Shows in combined download (last page) OR per-plant download of the last plant */}
            {isLastPage && (!plantId || isLastPlantOverall) && (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontFamily: "Helvetica-Bold" }]}>RINGKASAN REKAP PLANT</Text>
                </View>
                <View style={styles.summaryDivider} />
                {Object.keys(invoice.subtotalPlant).map((pid) => {
                  const p = invoice.subtotalPlant[pid];
                  const label = `${p.plantNama.replace("Plant ", "")} ${p.jenisBarang ? `- ${p.jenisBarang}` : ""}`;
                  return (
                    <View key={pid} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{label}</Text>
                      <Text style={styles.summaryValue}>{formatRpPdf(p.subtotal)}</Text>
                    </View>
                  );
                })}

                {/* Additional costs detailing */}
                {invoice.biayaTambahanDetail && invoice.biayaTambahanDetail.length > 0 ? (
                  invoice.biayaTambahanDetail.map((cost) => (
                    cost.nominal > 0 && (
                      <View key={cost.nama} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{cost.nama}</Text>
                        <Text style={styles.summaryValue}>{formatRpPdf(cost.nominal)}</Text>
                      </View>
                    )
                  ))
                ) : (
                  invoice.biayaTambahan > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Biaya Tambahan</Text>
                      <Text style={styles.summaryValue}>{formatRpPdf(invoice.biayaTambahan)}</Text>
                    </View>
                  )
                )}

                <View style={styles.summaryDivider} />
                <View style={styles.summaryRowTotal}>
                  <Text style={styles.summaryLabelTotal}>JUMLAH TOTAL</Text>
                  <Text style={styles.summaryValueTotal}>{formatRpPdf(invoice.grandTotal)}</Text>
                </View>
              </View>
            )}

            {/* Page Footer Section */}
            <View style={styles.footerRow}>
              <Text style={styles.thanksText}>Terima kasih!</Text>

              <View style={styles.signatureContainer}>
                {/* Blank space for manual signature */}
                <View style={{ height: 35 }} />
                <Text style={styles.signatureLabel}>H. SUPANDI</Text>
                <Text style={{ fontSize: 6.5, color: "#64748b", marginTop: 1 }}>
                  Tanda Tangan Otorisasi
                </Text>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
