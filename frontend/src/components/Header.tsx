import { useState, useEffect } from "react";
import { Briefcase, LogOut, LayoutDashboard, Menu, X, Sun, Moon, Sparkles, User } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import api from "../lib/api";

export function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [subStatus, setSubStatus] = useState<string>("free");
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem("theme");
        if (stored) return stored;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    const navigate = useNavigate();
    const location = useLocation();

    // Sync theme on mount & change
    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [theme]);

    // Check auth state and fetch user profile to retrieve subscription status
    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
        
        if (token) {
            api.get("/auth/me")
                .then((res) => {
                    const status = res.data.subscription_status || "free";
                    setSubStatus(status);
                    localStorage.setItem("subStatus", status);
                })
                .catch((err) => {
                    console.error("Failed to fetch user details:", err);
                    // If unauthorized, token might be expired
                    if (err.response && err.response.status === 401) {
                        localStorage.removeItem("token");
                        setIsLoggedIn(false);
                    }
                });
        } else {
            setSubStatus("free");
            localStorage.removeItem("subStatus");
        }
    }, [location, isLoggedIn]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("subStatus");
        setIsLoggedIn(false);
        setSubStatus("free");
        navigate("/");
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const isLinkActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string) => 
        `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isLinkActive(path) 
                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/30" 
                : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
        }`;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xl transition-all">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-black font-outfit tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        WorkFinder
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    <Link to="/" className={navLinkClass("/")}>
                        Offres
                    </Link>
                    {isLoggedIn && (
                        <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                            <div className="flex items-center gap-1.5">
                                <LayoutDashboard className="h-4 w-4" />
                                Tableau de bord
                            </div>
                        </Link>
                    )}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-3">
                    {/* Theme Toggler */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                        title={theme === "dark" ? "Passer au mode clair" : "Passer au mode sombre"}
                    >
                        {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                    </button>

                    {/* Subscription Badge */}
                    {isLoggedIn && (
                        <div className="flex items-center">
                            {subStatus === "premium" && (
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border border-amber-300/30 shadow-sm animate-pulse">
                                    <Sparkles className="h-3 w-3 fill-slate-950" />
                                    Premium
                                </div>
                            )}
                            {subStatus === "student" && (
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-sm">
                                    Étudiant
                                </div>
                            )}
                            {subStatus === "free" && (
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        Gratuit
                                    </span>
                                    {/* Glowing CTA for Premium */}
                                    <button 
                                        onClick={() => navigate("/dashboard?upgrade=true")}
                                        className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/10 pulse-glow"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Premium
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {isLoggedIn ? (
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="gap-2 border-red-200 dark:border-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 transition-all cursor-pointer text-xs"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Déconnexion
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer text-xs">
                                <Link to="/login">Connexion</Link>
                            </Button>
                            <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md shadow-indigo-500/10 cursor-pointer text-xs">
                                <Link to="/register">Inscription</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2 md:hidden">
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2 transition-all">
                    <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                        Offres
                    </Link>
                    {isLoggedIn && (
                        <Link
                            to="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                            Tableau de bord
                        </Link>
                    )}
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        {isLoggedIn ? (
                            <>
                                <div className="px-4 py-1 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Statut :</span>
                                    <span className="text-xs font-bold uppercase text-indigo-500">{subStatus}</span>
                                </div>
                                <button
                                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                    Déconnexion
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center"
                                >
                                    Inscription
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
