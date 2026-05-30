import { useState, useEffect } from "react";
import { Briefcase, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check auth state on mount and when location changes
    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/");
    };

    const isActive = (path: string) =>
        location.pathname === path
            ? "text-blue-600 font-semibold"
            : "text-slate-600 hover:text-blue-600";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-105">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        WorkFinder
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    <Link
                        to="/"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/")}`}
                    >
                        Jobs
                    </Link>
                    {isLoggedIn && (
                        <Link
                            to="/dashboard"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive("/dashboard")}`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                    )}
                </nav>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    {isLoggedIn ? (
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild className="text-slate-600 hover:text-blue-600">
                                <Link to="/login">Log in</Link>
                            </Button>
                            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20">
                                <Link to="/register">Sign up</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? (
                        <X className="h-5 w-5 text-slate-600" />
                    ) : (
                        <Menu className="h-5 w-5 text-slate-600" />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
                    <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Jobs
                    </Link>
                    {isLoggedIn && (
                        <Link
                            to="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Dashboard
                        </Link>
                    )}
                    <div className="pt-2 border-t border-slate-100">
                        {isLoggedIn ? (
                            <button
                                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                Logout
                            </button>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
