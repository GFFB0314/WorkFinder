import { useState, useEffect } from "react";
import { Search, MapPin, Filter, Sparkles, TrendingUp, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import type { Job } from "../types/job";
import api from "../lib/api";
import { JobCard } from "../components/JobCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Header } from "../components/Header";

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const item: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
};

export function HomePage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [remote, setRemote] = useState(false);
    const [experience, setExperience] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);

    const subStatus = localStorage.getItem("subStatus");
    const isPremium = subStatus === "premium" || subStatus === "student";

    const debouncedSearch = useDebounce(search, 300);
    const debouncedLocation = useDebounce(location, 300);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append("search", debouncedSearch);
            if (debouncedLocation) params.append("location", debouncedLocation);
            if (remote) params.append("remote", "true");
            if (experience.length > 0) params.append("skills", experience.join(","));
            params.append("page", page.toString());

            const url = `/jobs?${params.toString()}`;
            const response = await api.get(url);
            setJobs(response.data.jobs || []);
            setTotalJobs(response.data.total || 0);
            
            // Backend defaults page_size to 20
            const calculatedTotalPages = Math.ceil((response.data.total || 0) / (response.data.page_size || 20));
            setTotalPages(calculatedTotalPages || 1);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [debouncedSearch, debouncedLocation, remote, experience, page]);

    // Reset pagination to page 1 when filters change natively
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, debouncedLocation, remote, experience]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    const handleExperienceChange = (level: string) => {
        setExperience(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/10 font-sans text-slate-900 dark:text-white">
            <Header />

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900/50 dark:to-indigo-950/30 px-4 py-20 sm:py-28 text-center">
                    {/* Animated background orbs */}
                    <motion.div
                        className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl pointer-events-none"
                        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none"
                        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-20 left-1/2 h-60 w-60 rounded-full bg-violet-200/20 blur-3xl pointer-events-none"
                        animate={{ x: [0, 40, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="container relative mx-auto max-w-4xl">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-indigo-950/30 border border-blue-100 dark:border-indigo-800 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-indigo-300"
                        >
                            <Sparkles className="h-4 w-4" />
                            Agrégation d'offres depuis plus de 4 sources
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                            className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
                        >
                            Trouvez votre prochain{" "}
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                Emploi Tech
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                            className="mb-10 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
                        >
                            Nous regroupons les meilleures offres d'emploi pour développeurs depuis Remotive, Adzuna et bien plus.
                            Configurez des alertes et soyez notifié dès que l'emploi de vos rêves apparaît.
                        </motion.p>

                        <motion.form
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.45, type: "spring", stiffness: 100 }}
                            onSubmit={handleSearch}
                            className="mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-2.5 shadow-xl shadow-blue-900/5 dark:shadow-indigo-900/10 ring-1 ring-slate-200/80 dark:ring-slate-700/60 sm:flex-row sm:items-center"
                        >
                            <div className="flex flex-1 items-center gap-2 px-3">
                                <Search className="h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Python, React, Ingénieur..."
                                    className="border-0 focus-visible:ring-0 shadow-none bg-transparent"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
                            <div className="flex flex-1 items-center gap-2 px-3">
                                <MapPin className="h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Ville, pays..."
                                    className="border-0 focus-visible:ring-0 shadow-none bg-transparent"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <Button size="lg" className="h-12 w-full rounded-xl px-8 sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30">
                                Rechercher
                            </Button>
                        </motion.form>

                        {/* Trust stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400"
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <span>Mise à jour toutes les 6 heures</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                <span>Emplois en télétravail & sur site</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span>Dédoublonnage par IA</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Filters & Results */}
                <section className="container mx-auto flex flex-col gap-8 px-4 py-12 lg:flex-row">
                    {/* Sidebar Filters */}
                    <motion.aside
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full lg:w-64 flex-shrink-0"
                    >
                        <div className="sticky top-24 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900 dark:text-white">Filtres</h3>
                                <Filter className="h-4 w-4 text-slate-500" />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Type de travail</h4>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={remote}
                                            onChange={(e) => setRemote(e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                        />
                                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Remote uniquement</span>
                                    </label>
                                </div>
                                <div>
                                    <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Expérience</h4>
                                    <div className="space-y-2">
                                        {["Junior", "Mid", "Senior", "Lead"].map((level) => (
                                            <label key={level} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={experience.includes(level)}
                                                    onChange={() => handleExperienceChange(level)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                                />
                                                <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Job List */}
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="mb-6 flex items-center justify-between"
                        >
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {loading ? "Recherche..." : `${totalJobs} Offres trouvées`}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Mise à jour en temps réel</span>
                            </div>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                                >
                                    {[...Array(4)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="h-48 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse"
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="results"
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                                >
                                    {jobs.length > 0 ? (
                                        jobs.map((job) => (
                                            <motion.div key={job.id} variants={item}>
                                                <JobCard job={job} isPremium={isPremium} />
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="col-span-full py-16 text-center"
                                        >
                                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                                                <Search className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Aucune offre trouvée</p>
                                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                                Essayez d'ajuster votre recherche pour "{search}" {location && `à ${location}`}
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination Controls */}
                        {!loading && totalPages > 1 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="mt-12 mb-8 flex items-center justify-center gap-2"
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-10 w-10 p-0 rounded-xl border-slate-200/80 bg-white/50 backdrop-blur-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                
                                <div className="flex items-center gap-2 mx-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = page - 2 + i;
                                        if (page <= 2) pageNum = i + 1;
                                        else if (page >= totalPages - 1) pageNum = totalPages - 4 + i;
                                        
                                        if (pageNum > 0 && pageNum <= totalPages) {
                                            const isActive = page === pageNum;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 ${isActive ? "text-white" : "text-slate-600 hover:bg-white/80 hover:text-blue-600"}`}
                                                >
                                                    {isActive && (
                                                        <motion.div 
                                                            layoutId="activePage"
                                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20"
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10">{pageNum}</span>
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-10 w-10 p-0 rounded-xl border-slate-200/80 bg-white/50 backdrop-blur-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
