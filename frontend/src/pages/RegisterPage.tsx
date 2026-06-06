import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock } from "lucide-react";
import { Header } from "../components/Header";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import api from "../lib/api";

export function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/register", { email, password });
            navigate("/login");
        } catch (error: any) {
            console.error("Registration failed", error);
            let message = "Échec de l'inscription. Veuillez réessayer.";
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    message = detail === "Email already registered" 
                        ? "Cet email est déjà enregistré." 
                        : detail;
                } else if (Array.isArray(detail)) {
                    message = detail.map((err: any) => {
                        if (err.msg.includes("String should have at least 8 characters") || err.msg.includes("at least 8 characters")) {
                            return "Le mot de passe doit comporter au moins 8 caractères.";
                        }
                        if (err.msg.includes("value is not a valid email address")) {
                            return "L'adresse email n'est pas valide.";
                        }
                        return err.msg;
                    }).join(", ");
                }
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 font-sans text-slate-900 dark:text-white">
            <Header />

            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
                {/* Background orbs */}
                <motion.div
                    className="fixed -top-40 -left-40 h-96 w-96 rounded-full bg-violet-200/20 dark:bg-purple-500/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-200/20 dark:bg-indigo-500/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
                    transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                    className="relative w-full max-w-md"
                >
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 shadow-xl shadow-indigo-900/5 dark:shadow-indigo-500/5">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8 text-center"
                        >
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
                                <UserPlus className="h-7 w-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Créer un compte</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Rejoignez WorkFinder et commencez à suivre vos emplois de rêve
                            </p>
                        </motion.div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-5">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="email@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="rounded-xl h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    Mot de passe
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="rounded-xl h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500">Doit comporter au moins 8 caractères</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Button
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Création..." : "S'inscrire"}
                                </Button>
                            </motion.div>
                        </form>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                            Vous avez déjà un compte ?{" "}
                            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors">
                                Se connecter
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
