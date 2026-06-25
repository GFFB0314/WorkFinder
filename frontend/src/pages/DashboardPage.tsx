import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    Eye,
    FileText,
    Loader2,
    Plus,
    Shield,
    Upload,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { CreateWatchlistModal } from "../components/CreateWatchlistModal";
import { EditWatchlistModal } from "../components/EditWatchlistModal";
import { WatchlistCard } from "../components/WatchlistCard";
import { Header } from "../components/Header";

const WATCHLIST_LIMIT = 7;

interface User {
    id: number;
    email: string;
    role: string;
}

interface Watchlist {
    id: number;
    keywords: string[];
    location?: string;
    remote_only: boolean;
    experience_level?: string;
    min_salary?: number;
    max_salary?: number;
    frequency: string;
    active: boolean;
    created_at: string;
}

interface CVProfile {
    id: number;
    user_id: number;
    skills: string[];
    experience_level: string | null;
    raw_text: string | null;
    created_at: string;
    updated_at: string;
}

type TabKey = "alertes" | "cv";

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 32, scale: 0.96 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 90, damping: 16, delay: i * 0.08 },
    }),
};

const statsVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.94 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 100, damping: 14, delay: 0.3 + i * 0.1 },
    }),
};

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "alertes", label: "Mes Alertes", icon: Bell },
    { key: "cv", label: "Mon CV & Carriere", icon: FileText },
];

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("alertes");
    const [cvProfile, setCvProfile] = useState<CVProfile | null>(null);
    const [cvLoading, setCvLoading] = useState(false);
    const [cvUploading, setCvUploading] = useState(false);
    const [cvError, setCvError] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [watchlistError, setWatchlistError] = useState("");

    const navigate = useNavigate();

    const fetchUser = useCallback(async () => {
        try {
            const response = await api.get("/auth/me");
            const userData = response.data;
            setUser(userData);

            if (userData.role === "recruiter") {
                navigate("/recruiter/dashboard");
                return;
            }
            if (userData.role === "university_admin") {
                navigate("/campus/dashboard");
                return;
            }
        } catch {
            navigate("/login");
        }
    }, [navigate]);

    const fetchWatchlists = useCallback(async () => {
        try {
            const response = await api.get("/watchlists");
            setWatchlists(response.data);
        } catch (error) {
            console.error("Failed to fetch watchlists", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCVProfile = useCallback(async () => {
        setCvLoading(true);
        try {
            const response = await api.get("/cv/profile");
            setCvProfile(response.data);
        } catch (err: any) {
            if (err?.response?.status !== 404) {
                console.error("Failed to fetch CV profile", err);
            }
        } finally {
            setCvLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
        fetchWatchlists();
    }, [fetchUser, fetchWatchlists]);

    useEffect(() => {
        if (activeTab === "cv") {
            fetchCVProfile();
        }
    }, [activeTab, fetchCVProfile]);

    const handleCreateWatchlist = () => {
        if (watchlists.length >= WATCHLIST_LIMIT) {
            setWatchlistError(`Limite de ${WATCHLIST_LIMIT} alertes atteinte. Supprimez une alerte existante avant d'en creer une nouvelle.`);
            return;
        }
        setWatchlistError("");
        setIsModalOpen(true);
    };

    const handleEditWatchlist = (watchlist: Watchlist) => {
        setEditingWatchlist(watchlist);
        setIsEditModalOpen(true);
    };

    const handleDeleteWatchlist = async (id: number) => {
        if (!confirm("Supprimer cette alerte ?")) return;
        try {
            await api.delete(`/watchlists/${id}`);
            setWatchlists(watchlists.filter(w => w.id !== id));
            setWatchlistError("");
        } catch (error) {
            console.error("Failed to delete watchlist", error);
            alert("Erreur lors de la suppression.");
        }
    };

    const handleFileUpload = async (file: File) => {
        setCvUploading(true);
        setCvError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/cv/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setCvProfile(response.data);
        } catch (err: any) {
            setCvError(err?.response?.data?.detail || "Erreur lors de l'upload du CV.");
        } finally {
            setCvUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => setDragActive(false);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const activeCount = watchlists.filter(w => w.active).length;
    const totalKeywords = watchlists.reduce((acc, w) => acc + w.keywords.length, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
                <Header />
                <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Chargement du dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
            <Header />

            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-2">Bienvenue</p>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-outfit">
                                Dashboard de {user?.email?.split("@")[0]}
                            </h1>
                            <p className="text-indigo-100/80 text-sm">
                                Gerez vos alertes emploi et votre CV
                            </p>
                        </div>
                        <div className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 bg-white/20 text-white border border-white/30">
                            <Shield className="h-3.5 w-3.5" />
                            Candidat
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Eye, label: "Total Alertes", value: watchlists.length, color: "bg-white/20" },
                            { icon: Bell, label: "Alertes Actives", value: activeCount, color: "bg-emerald-400/20", iconColor: "text-emerald-300" },
                            { icon: Shield, label: "Mots-cles Suivis", value: totalKeywords, color: "bg-amber-400/20", iconColor: "text-amber-300" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                custom={i}
                                variants={statsVariants}
                                initial="hidden"
                                animate="show"
                                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                                        <stat.icon className={`h-5 w-5 ${stat.iconColor || "text-white"}`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-indigo-100/80">{stat.label}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4">
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mt-8 mb-8">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all cursor-pointer rounded-t-xl ${
                                    isActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "alertes" && (
                        <motion.div
                            key="alertes"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="pb-12"
                        >
                            <div className="mb-8 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mes Alertes Emploi</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {watchlists.length}/{WATCHLIST_LIMIT} alertes utilisees
                                    </p>
                                </div>
                                <Button
                                    onClick={handleCreateWatchlist}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.03] gap-2 cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle Alerte
                                </Button>
                            </div>

                            {watchlistError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50"
                                >
                                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                    <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300">{watchlistError}</p>
                                    <button onClick={() => setWatchlistError("")} className="text-amber-400 hover:text-amber-600 cursor-pointer">
                                        <X className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            )}

                            {watchlists.length === 0 ? (
                                <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-16 text-center">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                                        <Bell className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucune alerte</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                        Creez votre premiere alerte pour etre notifie des nouvelles offres correspondant a vos criteres.
                                    </p>
                                    <Button
                                        onClick={handleCreateWatchlist}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/20 gap-2 h-12 px-8 cursor-pointer"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Creer ma Premiere Alerte
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2">
                                    {watchlists.map((watchlist, i) => (
                                        <motion.div
                                            key={watchlist.id}
                                            custom={i}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="show"
                                        >
                                            <WatchlistCard
                                                watchlist={watchlist}
                                                onEdit={handleEditWatchlist}
                                                onDelete={handleDeleteWatchlist}
                                            />
                                        </motion.div>
                                    ))}

                                    {watchlists.length < WATCHLIST_LIMIT && (
                                        <motion.button
                                            custom={watchlists.length}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="show"
                                            whileHover={{ scale: 1.02, y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleCreateWatchlist}
                                            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-10 text-slate-400 dark:text-slate-500 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 group cursor-pointer"
                                        >
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                <Plus className="h-7 w-7" />
                                            </div>
                                            <span className="text-sm font-semibold">Ajouter une Alerte</span>
                                        </motion.button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "cv" && (
                        <motion.div
                            key="cv"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="pb-12"
                        >
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mon CV & Carriere</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Uploadez votre CV pour activer les scores de compatibilite IA.
                                    </p>
                                </div>

                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                                        dragActive
                                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                            : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700"
                                    }`}
                                >
                                    {cvUploading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Analyse de votre CV en cours...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">
                                                <Upload className="h-8 w-8 text-indigo-500" />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                                {cvProfile ? "Mettre a jour votre CV" : "Glissez-deposez votre CV ici"}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                                Formats acceptes : PDF, DOCX, TXT
                                            </p>
                                            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02]">
                                                <Upload className="h-4 w-4" />
                                                Choisir un fichier
                                                <input
                                                    type="file"
                                                    accept=".pdf,.docx,.txt"
                                                    onChange={handleFileInput}
                                                    className="hidden"
                                                />
                                            </label>
                                        </>
                                    )}
                                </div>

                                {cvError && (
                                    <div className="px-5 py-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
                                        {cvError}
                                    </div>
                                )}

                                {cvLoading && (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    </div>
                                )}

                                {cvProfile && !cvLoading && (
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">CV Analyse avec Succes</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Derniere mise a jour : {new Date(cvProfile.updated_at).toLocaleDateString("fr-FR")}
                                                </p>
                                            </div>
                                        </div>

                                        {cvProfile.experience_level && (
                                            <div className="mb-5">
                                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Niveau d'experience</h4>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                                    {cvProfile.experience_level}
                                                </span>
                                            </div>
                                        )}

                                        {cvProfile.skills.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                                                    Competences extraites ({cvProfile.skills.length})
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {cvProfile.skills.map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CreateWatchlistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchWatchlists}
            />

            {editingWatchlist && (
                <EditWatchlistModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingWatchlist(null);
                    }}
                    onSuccess={fetchWatchlists}
                    watchlist={editingWatchlist}
                />
            )}
        </div>
    );
}
