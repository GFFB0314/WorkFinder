import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Building2, Calendar, ExternalLink, ArrowLeft, CheckCircle2, AlertTriangle, Lock, Brain, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import api from "../lib/api";
import type { Job } from "../types/job";
import { Header } from "../components/Header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

interface MatchReport {
    compatibility_score: number;
    matching_skills: string[];
    missing_skills: string[];
    explanation: string;
}

export function JobDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchError, setMatchError] = useState("");

    const token = localStorage.getItem("token");
    const subStatus = localStorage.getItem("subStatus");
    const isPremium = !!token && (subStatus === "premium" || subStatus === "student");

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await api.get(`/jobs/${id}`);
                setJob(response.data);
            } catch (error) {
                console.error("Failed to fetch job", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    // Fetch AI match report for premium users
    useEffect(() => {
        if (!isPremium || !job) return;

        const fetchMatch = async () => {
            setMatchLoading(true);
            setMatchError("");
            try {
                const response = await api.get(`/cv/match/${job.id}`);
                setMatchReport(response.data);
            } catch (err: any) {
                const detail = err?.response?.data?.detail || "";
                if (err?.response?.status === 400 && detail.includes("CV")) {
                    setMatchError("cv_missing");
                } else {
                    setMatchError(detail || "Erreur lors de l'analyse.");
                }
            } finally {
                setMatchLoading(false);
            }
        };
        fetchMatch();
    }, [isPremium, job]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
                <Header />
                <div className="container mx-auto py-20 px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 dark:border-indigo-400 border-t-transparent" />
                        <p className="text-slate-500 dark:text-slate-400">Chargement des détails...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
                <Header />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="container mx-auto py-20 px-4 text-center"
                >
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Offre introuvable</h2>
                    <Button variant="link" asChild className="mt-4">
                        <Link to="/">Retour aux offres</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    const postedDate = job.posted_at ? new Date(job.posted_at) : new Date(job.created_at);
    const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

    const createMarkup = () => {
        return { __html: job.description || "" };
    };

    // Circular progress ring
    const ProgressRing = ({ score }: { score: number }) => {
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

        return (
            <div className="relative flex items-center justify-center">
                <svg width="120" height="120" className="-rotate-90">
                    <circle
                        cx="60" cy="60" r={radius}
                        stroke="currentColor"
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="8" fill="none"
                    />
                    <motion.circle
                        cx="60" cy="60" r={radius}
                        stroke={color}
                        strokeWidth="8" fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-3xl font-extrabold text-slate-900 dark:text-white"
                    >
                        {score}%
                    </motion.span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        Compatibilité
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 font-sans text-slate-900 dark:text-white">
            <Header />

            <div className="container mx-auto max-w-4xl px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="ghost" asChild className="mb-6 pl-0 hover:pl-2 transition-all rounded-xl group text-slate-600 dark:text-slate-400">
                        <Link to="/" className="gap-2">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Retour aux offres
                        </Link>
                    </Button>
                </motion.div>

                {/* Main Job Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-900/5 dark:shadow-indigo-500/5"
                >
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <span className="font-medium">{job.company}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">Publié {timeAgo}</span>
                                </div>
                            </div>
                        </motion.div>
                        {job.url && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                            >
                                <Button size="lg" asChild className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                                        Postuler <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* Tags */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="mb-8 flex flex-wrap gap-2"
                    >
                        {job.remote && (
                            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">Remote</Badge>
                        )}
                        {job.tech_stack?.map((tech) => (
                            <Badge key={tech} variant="tech">{tech}</Badge>
                        ))}
                    </motion.div>

                    {/* Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="prose prose-slate dark:prose-invert max-w-none border-t border-slate-100 dark:border-slate-800 pt-8"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Description</h3>
                        <div
                            dangerouslySetInnerHTML={createMarkup()}
                            className="[&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>li]:mb-1 text-slate-600 dark:text-slate-300 leading-relaxed"
                        />
                    </motion.div>
                </motion.div>

                {/* AI Compatibility Analysis Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl shadow-indigo-900/5 dark:shadow-indigo-500/5 overflow-hidden"
                >
                    {/* Section Header */}
                    <div className="px-8 pt-8 pb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Analyse IA de Compatibilité
                                <Sparkles className="h-4 w-4 text-amber-400" />
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Score basé sur votre CV et cette offre</p>
                        </div>
                    </div>

                    {isPremium ? (
                        <div className="px-8 pb-8">
                            {matchLoading && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Analyse en cours...</p>
                                </div>
                            )}

                            {matchError === "cv_missing" && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4">
                                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">CV non trouvé</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Uploadez votre CV dans le Dashboard pour obtenir votre score de compatibilité.
                                    </p>
                                    <Button asChild className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                                        <Link to="/dashboard">Uploader mon CV</Link>
                                    </Button>
                                </div>
                            )}

                            {matchError && matchError !== "cv_missing" && (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-red-500 dark:text-red-400">{matchError}</p>
                                </div>
                            )}

                            {matchReport && !matchLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Score + Skills Grid */}
                                    <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                                        {/* Progress Ring */}
                                        <div className="flex justify-center">
                                            <ProgressRing score={matchReport.compatibility_score} />
                                        </div>

                                        {/* Skills Breakdown */}
                                        <div className="space-y-4">
                                            {/* Matching Skills */}
                                            {matchReport.matching_skills.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Compétences correspondantes ({matchReport.matching_skills.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {matchReport.matching_skills.map((skill) => (
                                                            <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Missing Skills */}
                                            {matchReport.missing_skills.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        Compétences à développer ({matchReport.missing_skills.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {matchReport.missing_skills.map((skill) => (
                                                            <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                            "{matchReport.explanation}"
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        /* Paywall Overlay for Free Users */
                        <div className="relative px-8 pb-8">
                            {/* Blurred fake content */}
                            <div className="filter blur-sm select-none pointer-events-none opacity-50">
                                <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start py-4">
                                    <div className="flex justify-center">
                                        <div className="h-[120px] w-[120px] rounded-full bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-800" />
                                        <div className="flex gap-2">
                                            <div className="h-7 w-16 rounded-lg bg-emerald-100 dark:bg-emerald-950/30" />
                                            <div className="h-7 w-20 rounded-lg bg-emerald-100 dark:bg-emerald-950/30" />
                                            <div className="h-7 w-14 rounded-lg bg-emerald-100 dark:bg-emerald-950/30" />
                                        </div>
                                        <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-800" />
                                        <div className="flex gap-2">
                                            <div className="h-7 w-18 rounded-lg bg-amber-100 dark:bg-amber-950/30" />
                                            <div className="h-7 w-22 rounded-lg bg-amber-100 dark:bg-amber-950/30" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lock overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-b-2xl">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="flex flex-col items-center text-center px-8"
                                >
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
                                        <Lock className="h-7 w-7 text-white" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        Analyse IA de Compatibilité
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-sm">
                                        Passez à Premium pour découvrir votre score de compatibilité avec cette offre !
                                    </p>
                                    <Button
                                        onClick={() => navigate("/dashboard?upgrade=true")}
                                        className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-xl shadow-purple-500/20 px-8 py-3 cursor-pointer pulse-glow"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Débloquer Premium
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
