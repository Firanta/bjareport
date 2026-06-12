
"use client";

import { useState, useEffect } from "react";
import { usePlants } from "@/hooks/usePlants";
import { useVehicles } from "@/hooks/useVehicles";
import {
  getCompanyProfile,
  saveCompanyProfile,
  getAdditionalCosts,
  addAdditionalCost,
  updateAdditionalCost,
  deleteAdditionalCost,
} from "@/lib/firebase/firestore";
import type { CompanyProfile, AdditionalCost } from "@/types";
import { formatRupiah } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Building2,
  Truck,
  Factory,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { toast } from "sonner";

type ActiveTab = "plants" | "vehicles" | "additionalCosts" | "company";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("plants");

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "plants", label: "Plants", icon: Factory },
    { id: "vehicles", label: "Kendaraan", icon: Truck },
    { id: "additionalCosts", label: "Biaya Tambahan", icon: Coins },
    { id: "company", label: "Profil Perusahaan", icon: Building2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
          Pengaturan
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Kelola data master: plant, kendaraan, biaya tambahan, dan profil perusahaan.
        </p>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl border"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-all"
            style={{
              background: activeTab === id ? "rgba(168,85,247,0.2)" : "transparent",
              color:
                activeTab === id ? "#c084fc" : "rgba(255,255,255,0.45)",
              border: activeTab === id ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
            }}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "plants" && <PlantsTab />}
        {activeTab === "vehicles" && <VehiclesTab />}
        {activeTab === "additionalCosts" && <AdditionalCostsTab />}
        {activeTab === "company" && <CompanyTab />}
      </div>
    </div>
  );
}

// ============================================================
// PLANTS TAB
// ============================================================
function PlantsTab() {
  const { plants, loading, createPlant, editPlant, removePlant } = usePlants();
  const [editId, setEditId] = useState<string | null>(null);
  
  // Edit State
  const [editNama, setEditNama] = useState("");
  const [editItems, setEditItems] = useState<{ id: string; nama: string; hargaPerM3: number }[]>([]);
  
  // Add State
  const [addNama, setAddNama] = useState("");
  const [addItems, setAddItems] = useState<{ id: string; nama: string; hargaPerM3: number }[]>([
    { id: "1", nama: "Split", hargaPerM3: 0 }
  ]);
  
  const [saving, setSaving] = useState(false);

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  async function handleAdd() {
    if (!addNama) return;
    setSaving(true);
    const validItems = addItems.filter(i => i.nama.trim() !== "");
    await createPlant({ 
      nama: addNama, 
      items: validItems,
      hargaPerM3: validItems.length > 0 ? validItems[0].hargaPerM3 : 0 
    });
    setAddNama("");
    setAddItems([{ id: generateId(), nama: "Split", hargaPerM3: 0 }]);
    setSaving(false);
  }

  async function handleSaveEdit(id: string) {
    if (!editNama) return;
    setSaving(true);
    const validItems = editItems.filter(i => i.nama.trim() !== "");
    await editPlant(id, { 
      nama: editNama, 
      items: validItems,
      hargaPerM3: validItems.length > 0 ? validItems[0].hargaPerM3 : 0
    });
    setEditId(null);
    setSaving(false);
  }

  function startEdit(p: any) {
    setEditId(p.id);
    setEditNama(p.nama);
    // Backward compatibility: if no items, create one from hargaPerM3
    if (p.items && p.items.length > 0) {
      setEditItems(p.items);
    } else {
      setEditItems([{ id: generateId(), nama: "Split", hargaPerM3: p.hargaPerM3 || 0 }]);
    }
  }

  return (
    <div className="card">
      <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h2 className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Daftar Plant & Barang
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Kelola nama plant beserta jenis barang dan harga per m³ masing-masing.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--brand-500)" }} />
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {plants.map((p) => (
            <div key={p.id} className="p-5 hover:bg-white/5">
              {editId === p.id ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      className="form-input flex-1 font-semibold"
                      value={editNama}
                      onChange={(e) => setEditNama(e.target.value)}
                      placeholder="Nama plant"
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(p.id)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                    </button>
                    <button className="btn-icon" onClick={() => setEditId(null)}>✕</button>
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Daftar Barang & Harga / m³</p>
                    {editItems.map((item, idx) => (
                       <div key={item.id} className="flex gap-2 items-center">
                         <input
                           className="form-input flex-1 min-w-0 text-sm"
                           style={{ width: 'auto' }}
                           value={item.nama}
                           onChange={(e) => {
                             const newItems = [...editItems];
                             newItems[idx].nama = e.target.value;
                             setEditItems(newItems);
                           }}
                           placeholder="Nama Barang (mis: Split)"
                         />
                         <input
                           className="form-input text-sm"
                           style={{ width: 120, flexShrink: 0 }}
                           type="number"
                           value={item.hargaPerM3}
                           onChange={(e) => {
                             const newItems = [...editItems];
                             newItems[idx].hargaPerM3 = Number(e.target.value);
                             setEditItems(newItems);
                           }}
                           placeholder="Harga/m³"
                         />
                         <button 
                           className="btn-icon" 
                           style={{ color: "var(--danger)", flexShrink: 0 }}
                           onClick={() => setEditItems(editItems.filter(i => i.id !== item.id))}
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                    <button 
                      className="text-xs flex items-center gap-1 mt-2" 
                      style={{ color: "var(--brand-400)" }}
                      onClick={() => setEditItems([...editItems, { id: generateId(), nama: "", hargaPerM3: 0 }])}
                    >
                      <Plus className="w-3 h-3" /> Tambah Barang Lain
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-base mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {p.nama}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {p.items && p.items.length > 0 ? (
                        p.items.map(item => (
                          <span key={item.id} className="badge badge-info text-xs">
                            {item.nama}: {formatRupiah(item.hargaPerM3)}/m³
                          </span>
                        ))
                      ) : (
                        <span className="badge badge-warning text-xs">
                          Belum ada daftar barang (Harga lama: {formatRupiah(p.hargaPerM3 || 0)}/m³)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button className="btn-icon" onClick={() => startEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" style={{ color: "var(--danger)" }} onClick={() => removePlant(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="p-5 border-t rounded-b-xl space-y-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Tambah Plant Baru</h3>
        
        <input
          className="form-input w-full"
          placeholder="Nama Plant Baru"
          value={addNama}
          onChange={(e) => setAddNama(e.target.value)}
        />
        
        <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Item Barang & Harga</p>
          {addItems.map((item, idx) => (
            <div key={item.id} className="flex gap-2 items-center">
              <input
                className="form-input flex-1 min-w-0 text-sm"
                style={{ width: 'auto' }}
                value={item.nama}
                onChange={(e) => {
                  const newItems = [...addItems];
                  newItems[idx].nama = e.target.value;
                  setAddItems(newItems);
                }}
                placeholder="Nama Barang (mis: Split)"
              />
              <input
                className="form-input text-sm"
                style={{ width: 120, flexShrink: 0 }}
                type="number"
                value={item.hargaPerM3 || ""}
                onChange={(e) => {
                  const newItems = [...addItems];
                  newItems[idx].hargaPerM3 = Number(e.target.value);
                  setAddItems(newItems);
                }}
                placeholder="Harga/m³"
              />
              {addItems.length > 1 && (
                <button 
                  className="btn-icon" 
                  style={{ color: "var(--danger)", flexShrink: 0 }}
                  onClick={() => setAddItems(addItems.filter(i => i.id !== item.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button 
            className="text-xs flex items-center gap-1 mt-2" 
            style={{ color: "var(--brand-400)" }}
            onClick={() => setAddItems([...addItems, { id: generateId(), nama: "", hargaPerM3: 0 }])}
          >
            <Plus className="w-3 h-3" /> Tambah Barang Lain
          </button>
        </div>

        <div className="pt-2">
          <button
            className="btn btn-primary btn-sm w-full sm:w-auto"
            onClick={handleAdd}
            disabled={saving || !addNama || addItems.length === 0}
          >
            <Plus className="w-4 h-4" /> Tambah Plant & Barang
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VEHICLES TAB
// ============================================================
function VehiclesTab() {
  const { vehicles, loading, createVehicle, editVehicle, removeVehicle } = useVehicles();
  const [editId, setEditId] = useState<string | null>(null);
  const [editNomor, setEditNomor] = useState("");
  const [addNomor, setAddNomor] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!addNomor) return;
    setSaving(true);
    await createVehicle(addNomor.toUpperCase());
    setAddNomor("");
    setSaving(false);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    await editVehicle(id, editNomor.toUpperCase());
    setEditId(null);
    setSaving(false);
  }

  return (
    <div className="card">
      <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h2 className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Daftar Kendaraan
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--brand-500)" }} />
        </div>
      ) : (
        <div>
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              {editId === v.id ? (
                <>
                  <input
                    className="form-input flex-1 font-mono uppercase"
                    value={editNomor}
                    onChange={(e) => setEditNomor(e.target.value.toUpperCase())}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveEdit(v.id)}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button className="btn-icon" onClick={() => setEditId(null)}>✕</button>
                </>
              ) : (
                <>
                  <span className="badge badge-info font-mono flex-1 justify-start">
                    {v.nomorPolisi}
                  </span>
                  <button className="btn-icon" onClick={() => { setEditId(v.id); setEditNomor(v.nomorPolisi); }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="btn-icon" style={{ color: "var(--danger)" }} onClick={() => removeVehicle(v.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 p-5 border-t rounded-b-xl" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <input
          className="form-input flex-1 font-mono uppercase"
          placeholder="Contoh: B 9437 JEU"
          value={addNomor}
          onChange={(e) => setAddNomor(e.target.value.toUpperCase())}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!addNomor || saving}>
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ADDITIONAL COSTS TAB
// ============================================================
function AdditionalCostsTab() {
  const [costs, setCosts] = useState<AdditionalCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editNominal, setEditNominal] = useState("");
  const [addNama, setAddNama] = useState("");
  const [addNominal, setAddNominal] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdditionalCosts().then((data) => { setCosts(data); setLoading(false); });
  }, []);

  async function handleAdd() {
    setSaving(true);
    const id = await addAdditionalCost({ nama: addNama, nominal: Number(addNominal) });
    setCosts((prev) => [...prev, { id, nama: addNama, nominal: Number(addNominal) }]);
    setAddNama("");
    setAddNominal("0");
    setSaving(false);
    toast.success("Biaya tambahan ditambahkan.");
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    await updateAdditionalCost(id, { nama: editNama, nominal: Number(editNominal) });
    setCosts((prev) => prev.map((c) => c.id === id ? { ...c, nama: editNama, nominal: Number(editNominal) } : c));
    setEditId(null);
    setSaving(false);
    toast.success("Biaya tambahan diperbarui.");
  }

  async function handleDelete(id: string) {
    await deleteAdditionalCost(id);
    setCosts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Biaya tambahan dihapus.");
  }

  return (
    <div className="card">
      <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h2 className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Biaya Tambahan</h2>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Biaya ini ditambahkan ke total invoice secara otomatis.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--brand-500)" }} />
        </div>
      ) : costs.map((c) => (
        <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {editId === c.id ? (
            <>
              <input className="form-input flex-1" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
              <input className="form-input" type="number" style={{ width: 140 }} value={editNominal} onChange={(e) => setEditNominal(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(c.id)} disabled={saving}>
                <Save className="w-4 h-4" />
              </button>
              <button className="btn-icon" onClick={() => setEditId(null)}>✕</button>
            </>
          ) : (
            <>
              <p className="flex-1 font-medium text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{c.nama}</p>
              <span className="badge badge-info">{formatRupiah(c.nominal)}</span>
              <button className="btn-icon" onClick={() => { setEditId(c.id); setEditNama(c.nama); setEditNominal(String(c.nominal)); }}>
                <Pencil className="w-4 h-4" />
              </button>
              <button className="btn-icon" style={{ color: "var(--danger)" }} onClick={() => handleDelete(c.id)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ))}

      <div className="flex gap-3 p-5 border-t rounded-b-xl" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <input className="form-input flex-1" placeholder="Nama biaya" value={addNama} onChange={(e) => setAddNama(e.target.value)} />
        <input className="form-input" type="number" style={{ width: 140 }} placeholder="Nominal" value={addNominal} onChange={(e) => setAddNominal(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!addNama || saving}>
          <Plus className="w-4 h-4" />Tambah
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMPANY TAB
// ============================================================
function CompanyTab() {
  const [profile, setProfile] = useState<CompanyProfile>({
    nama: "H. SUPANDI",
    alamat: "Kp. Tunggilis RT 002/007\nDesa Situsari\nKecamatan Cileungsi\nKabupaten Bogor",
    noHp: "085882389089",
    bank: "BCA",
    rekening: "4060297636",
    atasNama: "H. SUPANDI",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCompanyProfile().then((data) => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveCompanyProfile(profile);
    setSaving(false);
    setSaved(true);
    toast.success("Profil perusahaan disimpan.");
    setTimeout(() => setSaved(false), 3000);
  }

  const fields: { key: keyof CompanyProfile; label: string; multiline?: boolean }[] = [
    { key: "nama", label: "Nama" },
    { key: "alamat", label: "Alamat", multiline: true },
    { key: "noHp", label: "No HP" },
    { key: "bank", label: "Bank" },
    { key: "rekening", label: "No Rekening" },
    { key: "atasNama", label: "Atas Nama" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--brand-500)" }} />
    </div>
  );

  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Profil Perusahaan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map(({ key, label, multiline }) => (
          <div key={key} className={`form-group ${multiline ? "md:col-span-2" : ""}`}>
            <label className="form-label">{label}</label>
            {multiline ? (
              <textarea
                className="form-input"
                rows={3}
                value={profile[key]}
                onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                value={profile[key]}
                onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Tersimpan</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="w-4 h-4" /> Simpan Profil</>
          )}
        </button>
      </div>
    </div>
  );
}
