import { useEffect, useState, useCallback, useRef } from "react";
import {
  GraduationCap, Users, TrendingUp, CheckCircle2, AlertCircle,
  Loader2, Upload, Building2, BarChart3, Award, BookOpen,
  ChevronUp, ChevronDown, ShieldCheck, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
  Cell
} from "recharts";
import api from "../lib/api";
import { Header } from "../components/Header";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  university_name: string;
  university_acronym: string;
  subscription_status: string;
  total_students: number;
  verified_students: number;
  unverified_students: number;
  placement_rate: number;
  average_search_months: number;
  placement_by_department: { name: string; Taux: number; Diplomés: number }[];
  top_skills_demanded: { skill: string; demande: number }[];
  top_employers: { company: string; hires: number }[];
}

interface PendingStudent {
  id: number;
  matricule: string;
  email: string;
  department: string;
  graduation_year: number;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const KENTE_GOLD = "#f59e0b";
const KENTE_GREEN = "#16a34a";
const CHART_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#f43f5e", "#8b5cf6", "#06b6d4"];

const PIE_DATA_FN = (stats: DashboardStats) => [
  { name: "Vérifiés", value: stats.verified_students, color: KENTE_GREEN },
  { name: "En attente", value: stats.unverified_students, color: KENTE_GOLD },
];

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 90, damping: 16, delay: i * 0.07 }
  })
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-sm shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#f59e0b" }}>
          {p.name}: <strong>{p.value}{p.name === "Taux" ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat card component ───────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon, label, value, unit = "", color = "amber", index = 0
}: {
  icon: React.ElementType; label: string; value: number | string;
  unit?: string; color?: string; index?: number;
}) => (
  <motion.div
    custom={index} variants={fadeUp} initial="hidden" animate="show"
    className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 hover:bg-white/[0.06] transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl bg-${color}-500/10 border border-${color}-500/20 group-hover:bg-${color}-500/15 transition-all`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
    </div>
    <div className="text-3xl font-bold text-white mb-1">
      {value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
    </div>
    <div className="text-sm text-slate-400">{label}</div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function CampusDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "payments">("overview");

  // CSV upload
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<string>("");
  const [csvError, setCsvError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Payments
  const [payMonths, setPayMonths] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [payResult, setPayResult] = useState<string>("");
  const [payError, setPayError] = useState<string>("");

  // Verify student
  const [verifying, setVerifying] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, pendingRes] = await Promise.all([
        api.get("/campus/dashboard/stats"),
        api.get("/campus/students/pending"),
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleVerify = async (studentId: number) => {
    setVerifying(studentId);
    try {
      await api.post(`/campus/students/${studentId}/verify`);
      setPending(p => p.filter(s => s.id !== studentId));
      setStats(s => s ? { ...s, verified_students: s.verified_students + 1, unverified_students: s.unverified_students - 1 } : s);
    } catch {
      alert("Erreur lors de la vérification.");
    } finally {
      setVerifying(null);
    }
  };

  const handleCSVUpload = async (file: File) => {
    setCsvUploading(true);
    setCsvResult("");
    setCsvError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/campus/students/import-roster", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCsvResult(res.data.message);
      fetchAll();
    } catch (err: any) {
      setCsvError(err?.response?.data?.detail || "Erreur lors de l'import.");
    } finally {
      setCsvUploading(false);
    }
  };

  const handlePayment = async () => {
    setPayLoading(true);
    setPayResult("");
    setPayError("");
    try {
      const res = await api.post("/payments/initiate", { phone_number: "690000000", operator: "mtn", months: payMonths });
      setPayResult(res.data.message || `Transaction initiée : ${res.data.transaction_ref}`);
      fetchAll();
    } catch (err: any) {
      setPayError(err?.response?.data?.detail || "Erreur de paiement.");
    } finally {
      setPayLoading(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  const pieData = PIE_DATA_FN(stats);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-outfit">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* African continent SVG silhouette watermark */}
        <svg className="absolute right-0 top-0 h-full opacity-[0.03] pointer-events-none" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
          <path d="M200,20 C280,10 360,80 370,160 C380,240 340,300 320,360 C300,420 260,480 200,490
                   C140,500 100,450 80,400 C60,350 50,280 60,200 C70,120 120,30 200,20 Z"
            fill="#f59e0b" />
          {/* Cameroon region highlight */}
          <ellipse cx="210" cy="180" rx="35" ry="45" fill="#f59e0b" opacity="0.6" />
        </svg>

        {/* Kente geometric border */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-green-500 to-red-500" />

        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-xl border border-green-500/30">
                  <GraduationCap className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-sm text-green-400 font-semibold tracking-wider uppercase">
                  WorkFinder Campus
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                {stats.university_name}
                <span className="text-slate-400 font-normal text-xl ml-3">({stats.university_acronym})</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                  stats.subscription_status === "active"
                    ? "bg-green-500/15 text-green-400 border border-green-500/25"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {stats.subscription_status === "active" ? "Abonnement Actif" : "Abonnement Inactif"}
                </span>
                <span className="text-sm text-slate-400">
                  Taux d'insertion global : <strong className="text-amber-400">{stats.placement_rate}%</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 text-sm transition-all"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 w-fit mb-8">
          {[
            { key: "overview", label: "Tableau de bord", icon: BarChart3 },
            { key: "students", label: "Validation étudiants", icon: Users },
            { key: "payments", label: "Abonnement", icon: Award },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-amber-500 text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.key === "students" && pending.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Étudiants inscrits" value={stats.total_students} color="blue" index={0} />
                <StatCard icon={CheckCircle2} label="Profils vérifiés" value={stats.verified_students} color="green" index={1} />
                <StatCard icon={TrendingUp} label="Taux d'insertion" value={stats.placement_rate} unit="%" color="amber" index={2} />
                <StatCard icon={BookOpen} label="Durée moyenne de recherche" value={stats.average_search_months} unit="mois" color="purple" index={3} />
              </div>

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Placement by department */}
                <motion.div
                  custom={0} variants={fadeUp} initial="hidden" animate="show"
                  className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
                >
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    Taux d'insertion par filière
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.placement_by_department} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }}
                        tickFormatter={v => v.length > 12 ? v.substring(0, 12) + "…" : v}
                      />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Taux" name="Taux d'insertion" radius={[4, 4, 0, 0]}>
                        {stats.placement_by_department.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                      <Bar dataKey="Diplomés" name="Diplômés" radius={[4, 4, 0, 0]} fill="rgba(255,255,255,0.08)" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Verified / Unverified pie */}
                <motion.div
                  custom={1} variants={fadeUp} initial="hidden" animate="show"
                  className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
                >
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Statut des étudiants
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name) => [`${v}`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 mt-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-semibold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* Top skills demanded */}
                <motion.div
                  custom={2} variants={fadeUp} initial="hidden" animate="show"
                  className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
                >
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Compétences les plus demandées
                  </h3>
                  <div className="space-y-3">
                    {stats.top_skills_demanded.map((s, i) => (
                      <div key={s.skill} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-20 shrink-0">{s.skill}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.demande}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08 }}
                            className="h-full rounded-full"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white w-8 text-right">{s.demande}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top employers */}
                <motion.div
                  custom={3} variants={fadeUp} initial="hidden" animate="show"
                  className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
                >
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Top employeurs (recrutements)
                  </h3>
                  <div className="space-y-3">
                    {stats.top_employers.map((emp, i) => (
                      <div key={emp.company} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-black ${
                            i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-amber-800 text-amber-200"
                          }`}>
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-200">{emp.company}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                          <Users className="w-3.5 h-3.5" /> {emp.hires}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── TAB: STUDENTS ─────────────────────────────────────────────── */}
          {activeTab === "students" && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pb-12"
            >
              {/* CSV import */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" /> Importer une cohorte (CSV)
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Format attendu : <code className="text-amber-400">matricule, filiere, email</code>. L'import auto-vérifie les étudiants déjà inscrits sur WorkFinder.
                </p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-amber-500/40 rounded-xl p-8 text-center cursor-pointer transition-all group"
                >
                  {csvUploading ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-amber-400 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  )}
                  <p className="text-sm text-slate-400">Cliquez pour sélectionner un fichier .csv</p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVUpload(f); }} />
                </div>
                {csvResult && (
                  <div className="mt-3 flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {csvResult}
                  </div>
                )}
                {csvError && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {csvError}
                  </div>
                )}
              </div>

              {/* Pending students table */}
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Étudiants en attente de vérification
                {pending.length > 0 && (
                  <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                    {pending.length}
                  </span>
                )}
              </h3>

              {pending.length === 0 ? (
                <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-green-400" />
                  <p>Tous les étudiants inscrits ont été vérifiés.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                        <th className="text-left px-5 py-3 text-slate-400 font-medium">Matricule</th>
                        <th className="text-left px-5 py-3 text-slate-400 font-medium">Email</th>
                        <th className="text-left px-5 py-3 text-slate-400 font-medium">Filière</th>
                        <th className="text-left px-5 py-3 text-slate-400 font-medium">Promo</th>
                        <th className="text-right px-5 py-3 text-slate-400 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((s, i) => (
                        <motion.tr
                          key={s.id}
                          custom={i} variants={fadeUp} initial="hidden" animate="show"
                          className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-amber-400">{s.matricule}</td>
                          <td className="px-5 py-3 text-slate-300">{s.email}</td>
                          <td className="px-5 py-3 text-slate-300">{s.department}</td>
                          <td className="px-5 py-3 text-slate-400">{s.graduation_year}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleVerify(s.id)}
                              disabled={verifying === s.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/25 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                            >
                              {verifying === s.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              Vérifier
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB: PAYMENTS ────────────────────────────────────────────────── */}
          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pb-12 max-w-lg"
            >
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" /> Abonnement WorkFinder Campus
                </h3>
                <p className="text-slate-400 text-sm mb-5">
                  Activez votre abonnement pour accéder aux statistiques d'insertion en temps réel, à la validation des étudiants et aux rapports de placement. Paiement via <strong className="text-amber-400">MTN MoMo</strong> ou <strong className="text-amber-400">Orange Money</strong>.
                </p>

                {/* Current status */}
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-5 ${
                  stats.subscription_status === "active"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-amber-500/10 border border-amber-500/20"
                }`}>
                  <ShieldCheck className={`w-5 h-5 ${stats.subscription_status === "active" ? "text-green-400" : "text-amber-400"}`} />
                  <div>
                    <div className={`font-semibold text-sm ${stats.subscription_status === "active" ? "text-green-300" : "text-amber-300"}`}>
                      {stats.subscription_status === "active" ? "Abonnement ACTIF" : "Abonnement INACTIF"}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {stats.subscription_status === "active"
                        ? "Toutes les fonctionnalités Campus sont disponibles."
                        : "Renouvelez votre abonnement pour continuer à utiliser WorkFinder Campus."}
                    </div>
                  </div>
                </div>

                {/* Month selector */}
                <div className="mb-4">
                  <label className="text-sm text-slate-400 block mb-2">Durée de l'abonnement</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPayMonths(m => Math.max(1, m - 1))}
                      className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-white">{payMonths}</span>
                      <span className="text-slate-400 ml-1.5 text-sm">mois</span>
                    </div>
                    <button
                      onClick={() => setPayMonths(m => Math.min(12, m + 1))}
                      className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-center text-amber-400 font-bold mt-2">
                    {(15_000 * payMonths).toLocaleString("fr-FR")} XAF
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={payLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  {payLoading ? "Traitement…" : "Payer via Mobile Money"}
                </motion.button>

                {payResult && (
                  <div className="mt-4 flex items-start gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {payResult}
                  </div>
                )}
                {payError && (
                  <div className="mt-4 flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {payError}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
