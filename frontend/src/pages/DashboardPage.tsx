import { useEffect, useState, useCallback } from "react";
import { Plus, Bell, Eye, Shield, Loader2, FileText, CreditCard, Upload, Crown, Sparkles, CheckCircle2, AlertCircle, GraduationCap, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { CreateWatchlistModal } from "../components/CreateWatchlistModal";
import { EditWatchlistModal } from "../components/EditWatchlistModal";
import { WatchlistCard } from "../components/WatchlistCard";
import { Header } from "../components/Header";
import { CheckoutModal } from "../components/CheckoutModal";

interface User {
    id: number;
    email: string;
    role: string;
    subscription_status: string;
    subscription_expires_at: string | null;
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

type TabKey = "alertes" | "cv" | "abonnement";

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 80,
            damping: 15,
            delay: i * 0.1,
        }
    })
};

const statsVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.9 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
            delay: 0.4 + i * 0.15,
        }
    })
};

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "alertes", label: "Mes Alertes", icon: Bell },
    { key: "cv", label: "Mon CV & Carrière", icon: FileText },
    { key: "abonnement", label: "Abonnement", icon: CreditCard },
];

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("alertes");
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // CV Hub state
    const [cvProfile, setCvProfile] = useState<CVProfile | null>(null);
    const [cvLoading, setCvLoading] = useState(false);
    const [cvUploading, setCvUploading] = useState(false);
    const [cvError, setCvError] = useState("");
    const [dragActive, setDragActive] = useState(false);

    // Watchlist error
    const [watchlistError, setWatchlistError] = useState("");

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const isPremium = user?.subscription_status === "premium" || user?.subscription_status === "student";

    const fetchUser = useCallback(async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data);
            localStorage.setItem("subStatus", response.data.subscription_status || "free");
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
        if (!isPremium) return;
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
    }, [isPremium]);

    const handleEditWatchlist = (watchlist: Watchlist) => {
        setEditingWatchlist(watchlist);
        setIsEditModalOpen(true);
    };

    const handleDeleteWatchlist = async (id: number) => {
        if (!confirm("Supprimer cette alerte ?")) return;
        try {
            await api.delete(`/watchlists/${id}`);
            setWatchlists(watchlists.filter(w => w.id !== id));
        } catch (error) {
            console.error("Failed to delete watchlist", error);
            alert("Erreur lors de la suppression.");
        }
    };

    const handleCreateWatchlist = async () => {
        // Check free tier limit
        if (!isPremium && watchlists.length >= 3) {
            setWatchlistError("Limite de 3 alertes atteinte pour le plan gratuit. Passez à Premium pour créer des alertes illimitées !");
            return;
        }
        setWatchlistError("");
        setIsModalOpen(true);
    };

    // File upload handler
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

    useEffect(() => {
        fetchUser();
        fetchWatchlists();
    }, [fetchUser, fetchWatchlists]);

    useEffect(() => {
        if (isPremium && activeTab === "cv") {
            fetchCVProfile();
        }
    }, [isPremium, activeTab, fetchCVProfile]);

    // Auto-open checkout from URL params
    useEffect(() => {
        if (searchParams.get("upgrade") === "true") {
            setActiveTab("abonnement");
            setIsCheckoutOpen(true);
        }
    }, [searchParams]);

    const handleCheckoutSuccess = () => {
        fetchUser();
        setIsCheckoutOpen(false);
    };

    const activeCount = watchlists.filter(w => w.active).length;
    const totalKeywords = watchlists.reduce((acc, w) => acc + w.keywords.length, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
                <Header />
                <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Chargement du dashboard...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
            <Header />

            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                {/* Animated background shapes */}
                <motion.div
                    className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, -15, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-pink-400/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="text-indigo-100 text-sm font-medium mb-2"
                            >
                                Bienvenue
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 80 }}
                                className="text-3xl sm:text-4xl font-bold text-white mb-2 font-outfit"
                            >
                                Dashboard de {user?.email?.split("@")[0]}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="text-indigo-100/80 text-sm"
                            >
                                Gérez vos alertes emploi, votre CV et votre abonnement
                            </motion.p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 120 }}
                            className="flex items-center gap-3"
                        >
                            {/* Subscription badge */}
                            <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 ${
                                isPremium
                                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20"
                                    : "bg-white/20 text-white border border-white/30"
                            }`}>
                                {isPremium ? <Crown className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                                {user?.subscription_status || "Free"}
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Eye, label: "Total Alertes", value: watchlists.length, color: "bg-white/20" },
                            { icon: Bell, label: "Alertes Actives", value: activeCount, color: "bg-emerald-400/20", iconColor: "text-emerald-300" },
                            { icon: Shield, label: "Mots-clés Suivis", value: totalKeywords, color: "bg-amber-400/20", iconColor: "text-amber-300" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                custom={i}
                                variants={statsVariants}
                                initial="hidden"
                                animate="show"
                                whileHover={{ scale: 1.03, y: -2 }}
                                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 cursor-default transition-colors hover:bg-white/15"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                                        <stat.icon className={`h-5 w-5 ${stat.iconColor || "text-white"}`} />
                                    </div>
                                    <div>
                                        <motion.p
                                            key={stat.value}
                                            initial={{ scale: 1.3, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-2xl font-bold text-white"
                                        >
                                            {stat.value}
                                        </motion.p>
                                        <p className="text-xs text-indigo-100/80">{stat.label}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
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
                                {tab.key === "cv" && !isPremium && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                        PRO
                                    </span>
                                )}
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

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* ============ TAB 1: ALERTES ============ */}
                    {activeTab === "alertes" && (
                        <motion.div
                            key="alertes"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="pb-12"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mes Alertes Emploi</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Recevez des notifications pour les offres correspondant à vos critères
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

                            {/* Free tier limit warning */}
                            {watchlistError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50"
                                >
                                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{watchlistError}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsCheckoutOpen(true)}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs rounded-xl cursor-pointer flex-shrink-0"
                                    >
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Premium
                                    </Button>
                                    <button onClick={() => setWatchlistError("")} className="text-amber-400 hover:text-amber-600 cursor-pointer">
                                        <X className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            )}

                            {watchlists.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-16 text-center"
                                >
                                    <motion.div
                                        className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-50 dark:bg-indigo-950/30 blur-2xl"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />
                                    <div className="relative">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
                                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50"
                                        >
                                            <Bell className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucune alerte</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                            Créez votre première alerte pour être notifié des nouvelles offres correspondant à vos critères.
                                        </p>
                                        <Button
                                            onClick={() => setIsModalOpen(true)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/20 gap-2 h-12 px-8 cursor-pointer"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Créer ma Première Alerte
                                        </Button>
                                    </div>
                                </motion.div>
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

                                    {/* Add new card */}
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
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ============ TAB 2: CV & CARRIÈRE ============ */}
                    {activeTab === "cv" && (
                        <motion.div
                            key="cv"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="pb-12"
                        >
                            {!isPremium ? (
                                /* Paywall for free users */
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-12 text-center"
                                >
                                    <motion.div
                                        className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-500/10 dark:to-purple-500/10 blur-3xl pointer-events-none"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 6, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute -bottom-20 -left-20 h-50 w-50 rounded-full bg-gradient-to-br from-pink-200/30 to-orange-200/30 dark:from-pink-500/10 dark:to-orange-500/10 blur-3xl pointer-events-none"
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ duration: 8, repeat: Infinity }}
                                    />

                                    <div className="relative">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/20"
                                        >
                                            <FileText className="h-10 w-10 text-white" />
                                        </motion.div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 font-outfit">
                                            CV & Analyse IA de Carrière
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
                                            Uploadez votre CV pour découvrir vos compétences extraites automatiquement,
                                            obtenir des scores de compatibilité IA pour chaque offre, et accélérer votre recherche d'emploi.
                                        </p>

                                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                                            {["Parsing IA du CV", "Score de compatibilité", "Analyse des compétences", "Recommandations"].map((f) => (
                                                <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                                    ✨ {f}
                                                </span>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => setIsCheckoutOpen(true)}
                                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-xl shadow-purple-500/20 px-8 py-3 h-12 cursor-pointer pulse-glow"
                                        >
                                            <Crown className="h-4 w-4 mr-2" />
                                            Débloquer avec Premium
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Premium CV Hub */
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mon CV & Carrière</h2>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Uploadez votre CV pour activer les scores de compatibilité IA
                                        </p>
                                    </div>

                                    {/* Upload Zone */}
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
                                                    {cvProfile ? "Mettre à jour votre CV" : "Glissez-déposez votre CV ici"}
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                                    Formats acceptés : PDF, DOCX, TXT
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
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="px-5 py-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm"
                                        >
                                            {cvError}
                                        </motion.div>
                                    )}

                                    {/* CV Profile Display */}
                                    {cvLoading && (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                        </div>
                                    )}

                                    {cvProfile && !cvLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm p-8"
                                        >
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
                                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">CV Analysé avec Succès</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Dernière mise à jour : {new Date(cvProfile.updated_at).toLocaleDateString("fr-FR")}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Experience Level */}
                                            {cvProfile.experience_level && (
                                                <div className="mb-5">
                                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Niveau d'expérience</h4>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                                        {cvProfile.experience_level === "junior" && "🌱 Junior"}
                                                        {cvProfile.experience_level === "mid" && "💼 Intermédiaire"}
                                                        {cvProfile.experience_level === "senior" && "🚀 Senior"}
                                                        {cvProfile.experience_level === "lead" && "👑 Lead / Expert"}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Extracted Skills */}
                                            {cvProfile.skills.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                                                        Compétences extraites ({cvProfile.skills.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cvProfile.skills.map((skill) => (
                                                            <motion.span
                                                                key={skill}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:scale-105 transition-transform"
                                                            >
                                                                {skill}
                                                            </motion.span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ============ TAB 3: ABONNEMENT ============ */}
                    {activeTab === "abonnement" && (
                        <motion.div
                            key="abonnement"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="pb-12"
                        >
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mon Abonnement</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Gérez votre plan et vos avantages
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm p-8">
                                {/* Current Plan */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
                                        isPremium
                                            ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20"
                                            : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 shadow-slate-500/10"
                                    }`}>
                                        {isPremium
                                            ? (user?.subscription_status === "student"
                                                ? <GraduationCap className="h-7 w-7 text-white" />
                                                : <Crown className="h-7 w-7 text-white" />)
                                            : <Shield className="h-7 w-7 text-slate-500 dark:text-slate-400" />
                                        }
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                            Plan {user?.subscription_status || "Gratuit"}
                                        </h3>
                                        {isPremium && user?.subscription_expires_at && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Expire le {new Date(user.subscription_expires_at).toLocaleDateString("fr-FR", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </p>
                                        )}
                                        {!isPremium && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Fonctionnalités limitées • 3 alertes maximum
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="mb-8 grid sm:grid-cols-2 gap-3">
                                    {[
                                        { label: "Alertes emploi", free: "3 maximum", premium: "Illimitées", active: true },
                                        { label: "Analyse IA du CV", free: "Non disponible", premium: "Inclus", active: isPremium },
                                        { label: "Score de compatibilité", free: "Non disponible", premium: "Inclus", active: isPremium },
                                        { label: "Notifications email", free: "Basique", premium: "Temps réel", active: true },
                                    ].map((feature) => (
                                        <div
                                            key={feature.label}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                                        >
                                            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${
                                                feature.active ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{feature.label}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {isPremium ? feature.premium : feature.free}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Upgrade / Status CTA */}
                                {!isPremium ? (
                                    <Button
                                        onClick={() => setIsCheckoutOpen(true)}
                                        className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-xl shadow-purple-500/20 rounded-xl cursor-pointer pulse-glow"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Passer à Premium — à partir de 1 500 FCFA/mois
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                            Votre abonnement est actif. Profitez de toutes les fonctionnalités Premium !
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
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

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    );
}
