// =============================================================
// BJA Report — PDF Invoice Template (React PDF)
// =============================================================
// Rendered server-side via /api/pdf route.
// Beautiful customized modern wavy template.
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
    color: "#334155", // Slate 700 for softer body text
    backgroundColor: "#ffffff",
    paddingBottom: 75, // Safety padding for absolute footer
  },
  contentWrapper: {
    paddingHorizontal: 40,
    paddingTop: 12,
  },
  // Wavy Header styles (Optimized height to 100)
  headerContainer: {
    width: 595,
    height: 100,
    position: "relative",
  },
  headerSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595,
    height: 100,
  },
  headerInvoiceText: {
    position: "absolute",
    left: 40,
    top: 32,
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  headerBrandText: {
    position: "absolute",
    right: 40,
    top: 28,
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  headerTaglineText: {
    position: "absolute",
    right: 40,
    top: 45,
    color: "#93c5fd", // Light blue accent
    fontSize: 7.5,
    fontFamily: "Helvetica",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  // Wavy Footer styles (Optimized height to 60)
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 595,
    height: 60,
  },
  footerSvg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 595,
    height: 60,
  },
  footerTextSection: {
    position: "absolute",
    left: 40,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  footerLabel: {
    color: "#93c5fd", // Light blue
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
  },
  footerValue: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica",
    marginRight: 15,
  },
  // Body Header Row (Logo & Metadata swapped and compact)
  bodyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bodyHeaderLeft: {
    width: "48%",
    alignItems: "flex-start",
  },
  bodyHeaderRight: {
    width: "48%",
    alignItems: "flex-end",
  },
  logo: {
    width: 140,
    height: 70,
    objectFit: "contain",
    marginBottom: 4,
  },
  companyInfoBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  companyAddressTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a", // Dark Slate
    marginBottom: 2,
    textAlign: "right",
  },
  companyAddressText: {
    fontSize: 7.5,
    color: "#64748b", // Slate 500
    lineHeight: 1.25,
    textAlign: "right",
  },
  metaInvoiceTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
    letterSpacing: 0.5,
    textAlign: "left",
  },
  metaPlantBadge: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7", // Sky blue brand color
    marginBottom: 6,
    textAlign: "left",
  },
  metaTable: {
    width: "100%",
    alignItems: "flex-start",
  },
  metaTableRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 2,
  },
  metaTableLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    width: 65,
    textAlign: "left",
  },
  metaTableValue: {
    fontSize: 7.5,
    color: "#0f172a",
    width: 120,
    textAlign: "left",
  },
  // Two column details: Billing info & Payment info
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  detailsColumnLeft: {
    width: "48%",
  },
  detailsColumnRight: {
    width: "48%",
  },
  columnTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  columnTextBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  columnText: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.3,
  },
  // Table styles
  table: {
    width: "100%",
    marginTop: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1b2536", // Dark navy header
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    alignItems: "center",
    paddingVertical: 3.5, // Reduced padding for compactness
  },
  tableRowEven: {
    backgroundColor: "#f8fafc", // Alternating rows
  },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  td: {
    fontSize: 7,
    color: "#334155",
    paddingHorizontal: 2,
  },
  // Calculation block
  calcContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
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
    marginBottom: 2,
  },
  calcLabel: {
    fontFamily: "Helvetica",
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
  calcRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1b2536",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 3,
  },
  calcLabelTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#ffffff",
  },
  calcValueTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "right",
    color: "#ffffff",
  },
  // Grand Summary Total (bottom left)
  summaryContainer: {
    marginTop: 10,
    width: "45%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 8,
  },
  summaryTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: "#475569",
  },
  summaryValue: {
    fontFamily: "Helvetica",
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
    backgroundColor: "#1b2536",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 3,
  },
  summaryLabelTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#ffffff",
  },
  summaryValueTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "right",
    color: "#ffffff",
  },
  // Footer signature section
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align signature block to right
    marginTop: 15, // Reduced space to prevent spilling to next page
    paddingHorizontal: 10,
  },
  signatureContainer: {
    width: 130,
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

const DEFAULT_COMPANY: CompanyProfile = {
  nama: "H. SUPANDI",
  alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kecamatan Cileungsi, Kabupaten Bogor",
  noHp: "085882389089",
  bank: "BCA",
  rekening: "4060297636",
  atasNama: "H. SUPANDI",
};

const RenderPageHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <Svg style={styles.headerSvg} viewBox="0 0 595 100">
        {/* Light Grey Wave */}
        <Path d="M 0 0 L 595 0 L 595 85 C 450 110, 200 65, 0 95 Z" fill="#f3f4f6" />
        {/* Navy Wave */}
        <Path d="M 0 0 L 595 0 L 595 72 C 450 95, 220 45, 0 82 Z" fill="#1b2536" />
        {/* Blue Wave */}
        <Path d="M 0 0 L 260 0 C 230 60, 120 90, 0 90 Z" fill="#0e57c2" />
      </Svg>
      <Text style={styles.headerInvoiceText}>INVOICE</Text>
      <Text style={styles.headerBrandText}>BAROKAH JAYA ABADI</Text>
      <Text style={styles.headerTaglineText}>JASA TRANSPORTER & LOGISTIK</Text>
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

  const c = {
    nama: company?.nama || DEFAULT_COMPANY.nama,
    alamat: company?.alamat || DEFAULT_COMPANY.alamat,
    noHp: company?.noHp || DEFAULT_COMPANY.noHp,
    bank: company?.bank || DEFAULT_COMPANY.bank,
    rekening: company?.rekening || DEFAULT_COMPANY.rekening,
    atasNama: company?.atasNama || DEFAULT_COMPANY.atasNama,
  };

  const logoPath = path.join(process.cwd(), "public", "Bja-logo-v4.png");

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

        const displayPlantNama = plantInfo.plantNama.toUpperCase().startsWith("PLANT")
          ? plantInfo.plantNama.toUpperCase()
          : `PLANT ${plantInfo.plantNama.toUpperCase()}`;

        return (
          <Page key={pid} size="A4" style={styles.page}>
            {/* Page Header (Full bleed) */}
            <RenderPageHeader />

            {/* Content Wrapper (Padded) */}
            <View style={styles.contentWrapper}>
              {/* Top Row: Invoice Metadata vs. Logo/Company Info (Swapped for Right-side Logo) */}
              <View style={styles.bodyHeaderRow}>
                {/* Left Column: Invoice Meta */}
                <View style={styles.bodyHeaderLeft}>
                  <Text style={styles.metaInvoiceTitle}>TAGIHAN / INVOICE</Text>
                  <Text style={styles.metaPlantBadge}>{displayPlantNama}</Text>

                  <View style={styles.metaTable}>
                    <View style={styles.metaTableRow}>
                      <Text style={styles.metaTableLabel}>NO. INVOICE :</Text>
                      <Text style={styles.metaTableValue}>{invoice.nomorInvoice}</Text>
                    </View>
                    <View style={styles.metaTableRow}>
                      <Text style={styles.metaTableLabel}>TANGGAL :</Text>
                      <Text style={styles.metaTableValue}>{formatDateExcel(invoice.invoiceDate)}</Text>
                    </View>
                    {invoice.startDate && invoice.endDate && (
                      <View style={styles.metaTableRow}>
                        <Text style={styles.metaTableLabel}>PERIODE :</Text>
                        <Text style={styles.metaTableValue}>
                          {formatDateExcel(invoice.startDate)} - {formatDateExcel(invoice.endDate)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right Column: Logo & Company Address (Right aligned) */}
                <View style={styles.bodyHeaderRight}>
                  <Image src={logoPath} style={styles.logo} />
                  <View style={styles.companyInfoBlock}>
                    <Text style={styles.companyAddressText}>
                      Kp. Tunggilis RT 002/007, Desa Situsari,
                    </Text>
                    <Text style={styles.companyAddressText}>
                      Kec. Cileungsi, Kab. Bogor, Jawa Barat
                    </Text>
                    <Text style={styles.companyAddressText}>
                      No. HP: {c.noHp}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Two Column details: Billing info & Payment info */}
              <View style={styles.detailsRow}>
                {/* Left Column: Issued To */}
                <View style={styles.detailsColumnLeft}>
                  <Text style={styles.columnTitle}>DITERBITKAN KEPADA</Text>
                  <Text style={styles.columnTextBold}>PT. WANNA MULIA SEJAHTERA</Text>
                  {/* <Text style={styles.columnText}>Kecamatan Cileungsi</Text>
                  <Text style={styles.columnText}>Kabupaten Bogor, Jawa Barat</Text> */}
                </View>

                {/* Right Column: Payment Info */}
                <View style={styles.detailsColumnRight}>
                  <Text style={styles.columnTitle}>INFORMASI PEMBAYARAN</Text>
                  <Text style={styles.columnTextBold}>Bank {c.bank}</Text>
                  <Text style={styles.columnText}>Nama Rekening: {c.atasNama}</Text>
                  <Text style={styles.columnText}>Nomor Rekening: {c.rekening}</Text>
                </View>
              </View>

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
                  <View key={t.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowEven : {}]}>
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
                    <Text style={styles.calcValueBold}>{formatNumberPdf(plantInfo.totalKubikasi, 3)} m³</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Jumlah {plantInfo.jenisBarang || "Split"} :</Text>
                    <Text style={styles.calcValue}>
                      {formatNumberPdf(plantInfo.totalKubikasi, 3)} x {formatNumberPdf(plantInfo.hargaPerM3, 0)}
                    </Text>
                  </View>
                  <View style={styles.calcRowTotal}>
                    <Text style={styles.calcLabelTotal}>Sub Total :</Text>
                    <Text style={styles.calcValueTotal}>{formatRpPdf(plantInfo.subtotal)}</Text>
                  </View>
                </View>
              </View>

              {/* Grand Summary Block on the Last Page */}
              {isLastPage && (!plantId || isLastPlantOverall) && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>RINGKASAN REKAP PLANT</Text>
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
                <View style={styles.signatureContainer}>
                  <View style={{ height: 35 }} />
                  <Text style={styles.signatureLabel}>H. SUPANDI</Text>
                  {/* <Text style={{ fontSize: 15, color: "#d5e2f3ff", marginTop: 1 }}>
                    Signature
                  </Text> */}
                </View>
              </View>
            </View>

            {/* Absolute Wavy Footer (Full bleed) */}
            <View style={styles.footerContainer}>
              <Svg style={styles.footerSvg} viewBox="0 0 595 60">
                <Path d="M 0 60 L 595 60 L 595 15 C 450 45, 200 -5, 0 20 Z" fill="#1b2536" />
                <Path d="M 0 60 L 320 60 C 240 38, 120 20, 0 47 Z" fill="#0e57c2" />
              </Svg>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
