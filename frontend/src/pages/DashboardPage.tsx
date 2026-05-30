import { useEffect, useState } from "react";
import { Plus, Bell, Eye, Shield, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { CreateWatchlistModal } from "../components/CreateWatchlistModal";
import { EditWatchlistModal } from "../components/EditWatchlistModal";
import { WatchlistCard } from "../components/WatchlistCard";
import { Header } from "../components/Header";

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

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
    const navigate = useNavigate();

    const fetchUser = async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data);
        } catch {
            navigate("/login");
        }
    };

    const fetchWatchlists = async () => {
        try {
            const response = await api.get("/watchlists");
            setWatchlists(response.data);
        } catch (error) {
            console.error("Failed to fetch watchlists", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditWatchlist = (watchlist: Watchlist) => {
        setEditingWatchlist(watchlist);
        setIsEditModalOpen(true);
    };

    const handleDeleteWatchlist = async (id: number) => {
        if (!confirm("Are you sure you want to delete this watchlist?")) return;
        try {
            await api.delete(`/watchlists/${id}`);
            setWatchlists(watchlists.filter(w => w.id !== id));
        } catch (error) {
            console.error("Failed to delete watchlist", error);
            alert("Failed to delete watchlist");
        }
    };

    useEffect(() => {
        fetchUser();
        fetchWatchlists();
    }, []);

    const activeCount = watchlists.filter(w => w.active).length;
    const totalKeywords = watchlists.reduce((acc, w) => acc + w.keywords.length, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <Header />
                <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm text-slate-500 font-medium">Loading your dashboard...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <Header />

            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                {/* Animated background shapes */}
                <motion.div
                    className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
                    animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
                    animate={{ x: [0, -15, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl"
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
                                className="text-blue-100 text-sm font-medium mb-2"
                            >
                                Welcome back
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 80 }}
                                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                            >
                                {user?.email?.split("@")[0]}'s Dashboard
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="text-blue-100/80 text-sm"
                            >
                                Manage your job alerts and stay ahead of the market
                            </motion.p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 120 }}
                        >
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl shadow-black/10 transition-all hover:scale-[1.03] active:scale-[0.97] gap-2 h-12 px-6 font-semibold"
                            >
                                <Plus className="h-5 w-5" />
                                New Watchlist
                            </Button>
                        </motion.div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Eye, label: "Total Watchlists", value: watchlists.length, color: "bg-white/20" },
                            { icon: Bell, label: "Active Alerts", value: activeCount, color: "bg-emerald-400/20", iconColor: "text-emerald-300" },
                            { icon: Shield, label: "Keywords Tracked", value: totalKeywords, color: "bg-amber-400/20", iconColor: "text-amber-300" },
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
                                        <p className="text-xs text-blue-100/80">{stat.label}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Watchlists Section */}
            <div className="mx-auto max-w-6xl px-4 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mb-8 flex items-center justify-between"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">My Watchlists</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Get notified when new jobs match your criteria
                        </p>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {watchlists.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-16 text-center"
                        >
                            <motion.div
                                className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-50 blur-2xl"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-50 blur-2xl"
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            />
                            <div className="relative">
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
                                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100"
                                >
                                    <Bell className="h-10 w-10 text-blue-600" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No watchlists yet</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8">
                                    Create your first watchlist to get notified about new jobs matching your skills and interests.
                                </p>
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.03] gap-2 h-12 px-8"
                                >
                                    <Plus className="h-5 w-5" />
                                    Create Your First Watchlist
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid gap-5 md:grid-cols-2"
                        >
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
                                onClick={() => setIsModalOpen(true)}
                                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-10 text-slate-400 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 group"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                                    <Plus className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-semibold">Add Watchlist</span>
                            </motion.button>
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
