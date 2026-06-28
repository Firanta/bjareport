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

function formatRpPdf(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);
  return isNegative ? `-Rp${formatted}` : `Rp${formatted}`;
}

// Number format helper
function formatNumberPdf(val: number, decimals = 3): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: "#334155", // Slate 700 for softer body text
    backgroundColor: "#ffffff",
    paddingBottom: 70, // Safety padding for absolute footer
  },
  contentWrapper: {
    paddingHorizontal: 40,
    paddingTop: 10,
  },
  // Wavy Header styles (Optimized height to 80)
  headerContainer: {
    width: 595,
    height: 80,
    position: "relative",
  },
  headerSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595,
    height: 80,
  },
  headerInvoiceText: {
    position: "absolute",
    left: 40,
    top: 25,
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  headerBrandText: {
    position: "absolute",
    right: 40,
    top: 22,
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  headerTaglineText: {
    position: "absolute",
    right: 40,
    top: 36,
    color: "#93c5fd", // Light blue accent
    fontSize: 6.5,
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
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
  },
  footerValue: {
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Helvetica",
    marginRight: 15,
  },
  // Body Header Row (Logo & Metadata swapped and compact)
  bodyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
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
    width: 110,
    height: 55,
    objectFit: "contain",
    marginBottom: 3,
  },
  companyInfoBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  companyAddressText: {
    fontSize: 9.5,
    color: "#64748b", // Slate 500
    lineHeight: 1.2,
    textAlign: "right",
  },
  metaInvoiceTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
    letterSpacing: 0.5,
    textAlign: "left",
  },
  metaPlantBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7", // Sky blue brand color
    marginBottom: 4,
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
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    width: 75,
    textAlign: "left",
  },
  metaTableValue: {
    fontSize: 9.5,
    color: "#0f172a",
    width: 135,
    textAlign: "left",
  },
  // Two column details: Billing info & Payment info
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#f8fafc",
    padding: 6,
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
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  columnTextBold: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 1.5,
  },
  columnText: {
    fontSize: 9.5,
    color: "#475569",
    lineHeight: 1.2,
  },
  // Table styles
  table: {
    width: "100%",
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1b2536", // Dark navy header
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    alignItems: "center",
    paddingVertical: 7,
  },
  tableRowEven: {
    backgroundColor: "#f8fafc", // Alternating rows
  },
  th: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  td: {
    fontSize: 12,
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
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
    marginBottom: 8,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1.5,
  },
  calcLabel: {
    fontFamily: "Helvetica",
    fontSize: 12,
    color: "#475569",
    width: "55%",
  },
  calcValue: {
    fontFamily: "Helvetica",
    fontSize: 12,
    textAlign: "right",
    width: "45%",
    color: "#0f172a",
  },
  calcValueBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "right",
    width: "45%",
    color: "#0f172a",
  },
  calcRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1b2536",
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderRadius: 6,
    marginTop: 2,
  },
  calcLabelTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#ffffff",
  },
  calcValueTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "right",
    color: "#ffffff",
  },
  // Grand Summary Total (bottom left)
  summaryContainer: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#475569",
  },
  summaryValue: {
    fontFamily: "Helvetica",
    fontSize: 12,
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
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderRadius: 6,
    marginTop: 2,
  },
  summaryLabelTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#ffffff",
  },
  summaryValueTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "right",
    color: "#ffffff",
  },
  // Footer signature section
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align signature block to right
    marginTop: 8,
    paddingHorizontal: 10,
  },
  signatureContainer: {
    width: 130,
    alignItems: "center",
    marginTop: 15,
  },
  signatureLabel: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    borderTopWidth: 1,
    borderTopColor: "#475569",
    paddingTop: 3,
    width: "100%",
    textAlign: "center",
    marginTop: 2,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
  },
  bottomLeftCol: {
    width: "48%",
  },
  bottomRightCol: {
    width: "45%",
    flexDirection: "column",
    alignItems: "flex-end",
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
    <View style={styles.headerContainer} fixed>
      <Svg style={styles.headerSvg} viewBox="0 0 595 80">
        {/* Light Grey Wave */}
        <Path d="M 0 0 L 595 0 L 595 70 C 450 90, 200 50, 0 80 Z" fill="#f3f4f6" />
        {/* Navy Wave */}
        <Path d="M 0 0 L 595 0 L 595 58 C 450 78, 220 36, 0 68 Z" fill="#1b2536" />
        {/* Blue Wave */}
        <Path d="M 0 0 L 260 0 C 230 48, 120 72, 0 72 Z" fill="#0e57c2" />
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
              {/* Top Row: Invoice Metadata vs. Logo/Company Info */}
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
                  <Text style={styles.columnText}>Kecamatan Cileungsi</Text>
                  <Text style={styles.columnText}>Kabupaten Bogor, Jawa Barat</Text>
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
                  <Text style={[styles.th, { width: "4%" }]}>NO</Text>
                  <Text style={[styles.th, { width: "15%" }]}>TANGGAL</Text>
                  <Text style={[styles.th, { width: "17%" }]}>NO. POLISI</Text>
                  <Text style={[styles.th, { width: "14%" }]}>NO. SRT JLN</Text>
                  <Text style={[styles.th, { width: "11%" }]}>JENIS</Text>
                  <Text style={[styles.th, { width: "13%" }]}>TON KUARI</Text>
                  <Text style={[styles.th, { width: "13%" }]}>TON PLAN</Text>
                  <Text style={[styles.th, { width: "13%" }]}>KUBIKASI</Text>
                </View>

                {plantTrips.map((t, i) => (
                  <View key={t.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowEven : {}]}>
                    <Text style={[styles.td, { width: "4%", textAlign: "center" }]}>{i + 1}</Text>
                    <Text style={[styles.td, { width: "15%", textAlign: "center" }]}>{formatDateExcel(t.tanggal)}</Text>
                    <Text style={[styles.td, { width: "17%", textAlign: "center" }]}>{t.noPolisi}</Text>
                    <Text style={[styles.td, { width: "14%", textAlign: "center" }]}>{t.noSuratJalan}</Text>
                    <Text style={[styles.td, { width: "11%", textAlign: "center" }]}>{t.jenisBarang}</Text>
                    <Text style={[styles.td, { width: "13%", textAlign: "center" }]}>
                      {t.tonaseKuari !== null && t.tonaseKuari !== undefined && Number(t.tonaseKuari) !== 0 && !isNaN(Number(t.tonaseKuari))
                        ? formatNumberPdf(Number(t.tonaseKuari), 2)
                        : "-"}
                    </Text>
                    <Text style={[styles.td, { width: "13%", textAlign: "center" }]}>
                      {t.tonasePlan !== null && t.tonasePlan !== undefined && Number(t.tonasePlan) !== 0 && !isNaN(Number(t.tonasePlan))
                        ? formatNumberPdf(Number(t.tonasePlan), 3)
                        : "-"}
                    </Text>
                    <Text style={[styles.td, { width: "13%", textAlign: "center" }]}>
                      {formatNumberPdf(t.kubikasi ?? 0, 2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Bottom Section: Calculations, Summary & Signature side-by-side */}
              <View style={styles.bottomSection} wrap={false}>
                {/* Left Column: Grand Summary (if last page) */}
                {isLastPage && (!plantId || isLastPlantOverall) ? (
                  <View style={styles.bottomLeftCol}>
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
                        [...invoice.biayaTambahanDetail]
                          .sort((a, b) => {
                            if (a.nominal >= 0 && b.nominal < 0) return -1;
                            if (a.nominal < 0 && b.nominal >= 0) return 1;
                            return 0;
                          })
                          .map((cost) => (
                            cost.nominal !== 0 && (
                              <View key={cost.nama} style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{cost.nama}</Text>
                                <Text style={styles.summaryValue}>{formatRpPdf(cost.nominal)}</Text>
                              </View>
                            )
                          ))
                      ) : (
                        invoice.biayaTambahan !== 0 && (
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
                  </View>
                ) : (
                  <View style={styles.bottomLeftCol} />
                )}

                {/* Right Column: Calculations & Signature */}
                <View style={styles.bottomRightCol}>
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

                  <View style={styles.signatureContainer}>
                    <View style={{ height: 50 }} />
                    <Text style={styles.signatureLabel}>H. SUPANDI</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Absolute Wavy Footer (Full bleed) */}
            <View style={styles.footerContainer} fixed>
              <Svg style={styles.footerSvg} viewBox="0 0 595 60">
                <Path d="M 0 60 L 595 60 L 595 15 C 450 45, 200 -5, 0 20 Z" fill="#1b2536" />
                <Path d="M 0 60 L 320 60 C 240 38, 120 20, 0 47 Z" fill="#0e57c2" />
              </Svg>
              {/* <View style={styles.footerTextSection}>
                <Text style={styles.footerLabel}>HUBUNGI KAMI :</Text>
                <Text style={styles.footerValue}>{c.noHp}</Text>
                <Text style={[styles.footerLabel, { marginLeft: 15 }]}>ALAMAT :</Text>
                <Text style={styles.footerValue}>Desa Situsari, Cileungsi, Bogor</Text>
              </View> */}
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
