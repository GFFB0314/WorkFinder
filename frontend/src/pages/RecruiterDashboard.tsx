import { useEffect, useState, useCallback } from "react";
import {
  Briefcase, Plus, Star, Users, TrendingUp, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, X, Send, Eye, LogOut,
  Building2, Globe, BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import { Header } from "../components/Header";

interface RecruiterJob {
  id: number;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  skills: string[];
  created_at: string;
}

interface Candidate {
  candidate_id: number;
  name: string;
  email: string;
  skills: string[];
  experience_level: string;
  is_student: boolean;
  university: string | null;
  score: number;
  report: {
    summary: string;
    compatibility_score: number;
    strengths: string[];
    gaps: string[];
  };
}

interface CompanyProfile {
  company_name: string;
  company_industry: string | null;
  company_website: string | null;
}

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 90, damping: 16, delay: i * 0.08 }
  })
};

const SCORE_COLOR = (s: number) =>
  s >= 75 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<RecruiterJob | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "Douala, Cameroun",
    remote: false,
    description: "",
    skills: ""
  });

  const fetchData = useCallback(async () => {
    try {
      const [meRes, jobsRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/recruit/jobs"),
      ]);
      setCompanyProfile(meRes.data.company_profile);
      // Pre-fill company name
      if (meRes.data.company_profile?.company_name) {
        setForm(f => ({ ...f, company: meRes.data.company_profile.company_name }));
      }
      setJobs(jobsRes.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchCandidates = async (job: RecruiterJob) => {
    setSelectedJob(job);
    setCandidates([]);
    setCandidatesLoading(true);
    try {
      const res = await api.get(`/recruit/jobs/${job.id}/recommendations`);
      setCandidates(res.data);
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    setPostSuccess("");
    try {
      const skillsArray = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      await api.post("/recruit/jobs", {
        title: form.title,
        company: form.company,
        location: form.location,
        remote: form.remote,
        description: form.description,
        skills: skillsArray
      });
      setPostSuccess("Offre publiée avec succès !");
      setForm(f => ({ ...f, title: "", description: "", skills: "", remote: false }));
      fetchData();
      setTimeout(() => { setShowPostForm(false); setPostSuccess(""); }, 2500);
    } catch (err: any) {
      setPostError(err?.response?.data?.detail || "Erreur lors de la publication.");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-outfit">
      <Header />

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* African geometric SVG pattern background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="kente" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#f59e0b"/>
              <rect x="20" y="20" width="20" height="20" fill="#f59e0b"/>
              <rect x="20" width="20" height="20" fill="#d97706"/>
              <rect y="20" width="20" height="20" fill="#d97706"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kente)"/>
        </svg>

        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <Building2 className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-sm text-amber-400 font-semibold tracking-wider uppercase">
                  WorkFinder Recruit
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                Tableau de bord Recruteur
              </h1>
              <p className="text-slate-400 mt-1">
                {companyProfile?.company_name || "Votre entreprise"} &mdash;{" "}
                {companyProfile?.company_industry || "Tech"}
                {companyProfile?.company_website && (
                  <a
                    href={companyProfile.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" /> Site web
                  </a>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowPostForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Publier une offre
              </motion.button>
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

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Offres publiées", value: jobs.length, icon: Briefcase, color: "amber" },
            { label: "Entreprise", value: companyProfile?.company_name || "—", icon: Star, color: "green" },
            { label: "Candidats analysés", value: candidates.length || "—", icon: Users, color: "blue" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="show"
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-all"
            >
              <div className={`p-3 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Two-column layout: Jobs + Candidates ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Jobs list */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" /> Mes offres d'emploi
            </h2>

            {jobs.length === 0 ? (
              <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-500">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Aucune offre publiée. Cliquez sur «&nbsp;Publier une offre&nbsp;» pour commencer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id} custom={i} variants={fadeUp} initial="hidden" animate="show"
                    onClick={() => fetchCandidates(job)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      selectedJob?.id === job.id
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        <p className="text-sm text-slate-400 mt-0.5">{job.location}</p>
                        {job.remote && (
                          <span className="inline-block mt-1.5 text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full">
                            Remote
                          </span>
                        )}
                        {job.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.skills.slice(0, 4).map(s => (
                              <span key={s} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Candidates panel */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              {selectedJob ? `Recommandations IA — ${selectedJob.title}` : "Recommandations IA"}
            </h2>

            {!selectedJob ? (
              <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-500">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Sélectionnez une offre pour voir les profils candidats recommandés par l'IA.</p>
              </div>
            ) : candidatesLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : candidates.length === 0 ? (
              <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Aucun profil CV disponible pour le matching IA.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((c, i) => (
                  <motion.div
                    key={c.candidate_id} custom={i} variants={fadeUp} initial="hidden" animate="show"
                    className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{c.name}</span>
                          {c.is_student && (
                            <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
                              Étudiant{c.university ? ` · ${c.university}` : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{c.email} · Niveau: {c.experience_level}</p>
                        {/* Score bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${c.score}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                              style={{ background: SCORE_COLOR(c.score) }}
                              className="h-full rounded-full"
                            />
                          </div>
                          <span className="text-sm font-bold" style={{ color: SCORE_COLOR(c.score) }}>
                            {c.score}%
                          </span>
                        </div>

                        {/* Strengths / gaps */}
                        {c.report?.strengths?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.report.strengths.slice(0, 3).map((s, si) => (
                              <span key={si} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.report?.gaps?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {c.report.gaps.slice(0, 2).map((g, gi) => (
                              <span key={gi} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rank badge */}
                      {i < 3 && (
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? "bg-amber-500 text-black" :
                          i === 1 ? "bg-slate-400 text-black" : "bg-amber-900 text-amber-200"
                        }`}>
                          #{i + 1}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Post Job Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPostForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowPostForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" /> Publier une offre
                </h3>
                <button onClick={() => setShowPostForm(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePost} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Titre du poste *</label>
                  <input
                    required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="ex: Développeur Full-Stack React/Node.js"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Entreprise *</label>
                    <input
                      required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Localisation</label>
                    <input
                      value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Compétences requises (séparées par des virgules)</label>
                  <input
                    value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                    placeholder="Python, React, PostgreSQL, Docker..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Description *</label>
                  <textarea
                    required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez le poste, les missions et le profil recherché..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setForm(f => ({ ...f, remote: !f.remote }))}
                    className={`w-10 h-6 rounded-full transition-all flex items-center ${form.remote ? "bg-amber-500" : "bg-white/10"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.remote ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Télétravail possible</span>
                </label>

                {postError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {postError}
                  </div>
                )}
                {postSuccess && (
                  <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {postSuccess}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowPostForm(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 rounded-xl transition-all">
                    Annuler
                  </button>
                  <button type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition-all flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Publier
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
