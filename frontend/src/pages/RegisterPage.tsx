import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Lock, Briefcase, GraduationCap, Building2, BookOpen, Hash, Globe } from "lucide-react";
import { Header } from "../components/Header";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import api from "../lib/api";

type RoleType = "candidate" | "recruiter" | "university_admin";

export function RegisterPage() {
    const [role, setRole] = useState<RoleType>("candidate");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Candidate - Student state
    const [isStudent, setIsStudent] = useState(false);
    const [matricule, setMatricule] = useState("");
    const [schoolEmail, setSchoolEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [graduationYear, setGraduationYear] = useState("");

    // Recruiter state
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyIndustry, setCompanyIndustry] = useState("");

    // University Admin state
    const [universityName, setUniversityName] = useState("");
    const [universityAcronym, setUniversityAcronym] = useState("");
    const [universityDomain, setUniversityDomain] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Prepare request body
        const payload: any = {
            email,
            password,
            role
        };

        if (role === "candidate") {
            payload.is_student = isStudent;
            if (isStudent) {
                if (!matricule.trim()) {
                    setError("Le matricule est obligatoire pour les étudiants.");
                    setLoading(false);
                    return;
                }
                payload.student_matricule = matricule;
                payload.school_email = schoolEmail || email;
                payload.department = department || "Génie Logiciel";
                payload.graduation_year = parseInt(graduationYear) || new Date().getFullYear();
            }
        } else if (role === "recruiter") {
            if (!companyName.trim()) {
                setError("Le nom de l'entreprise est obligatoire.");
                setLoading(false);
                return;
            }
            payload.company_name = companyName;
            payload.company_website = companyWebsite || null; // Optional website
            payload.company_industry = companyIndustry || "IT";
        } else if (role === "university_admin") {
            if (!universityName.trim() || !universityAcronym.trim()) {
                setError("Le nom et l'acronyme de l'université sont obligatoires.");
                setLoading(false);
                return;
            }
            payload.university_name = universityName;
            payload.university_acronym = universityAcronym;
            payload.university_domain = universityDomain || email.split("@")[1] || "iut-douala.cm";
        }

        try {
            await api.post("/auth/register", payload);
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
                        if (err.msg.includes("String should have at least 8 characters")) {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 font-sans text-white">
            <Header />

            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 relative overflow-hidden">
                {/* Background layout decor */}
                <motion.div
                    className="fixed -top-40 -left-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"
                    animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
                    transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                    className="relative w-full max-w-lg my-8"
                >
                    {/* Cameroon Visual Accent Flag Ribbon */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 flex rounded-t-2xl overflow-hidden z-20">
                        <div className="flex-1 bg-emerald-600" />
                        <div className="flex-1 bg-red-600 relative">
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] text-yellow-400">★</span>
                        </div>
                        <div className="flex-1 bg-yellow-500" />
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-950/20">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/35">
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold">Créer un compte</h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Rejoignez WorkFinder et propulsez votre carrière tech
                            </p>
                        </div>

                        {/* Role tabs */}
                        <div className="grid grid-cols-3 gap-2 p-1 mb-6 bg-slate-950/80 rounded-xl border border-slate-800">
                            {(["candidate", "recruiter", "university_admin"] as RoleType[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => {
                                        setRole(r);
                                        setError(null);
                                    }}
                                    className={`relative rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                        role === r
                                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                                    }`}
                                >
                                    {r === "candidate" && "Candidat"}
                                    {r === "recruiter" && "Recruteur"}
                                    {r === "university_admin" && "Université"}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 rounded-xl bg-red-950/30 p-3 text-sm text-red-400 border border-red-900/50"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Common: Email & Password */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                                        Email
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="nom@exemple.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                                        Mot de passe
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Conditional Panels */}
                            <AnimatePresence mode="wait">
                                {role === "candidate" && (
                                    <motion.div
                                        key="candidate"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden pt-2"
                                    >
                                        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                            <input
                                                type="checkbox"
                                                id="isStudent"
                                                checked={isStudent}
                                                onChange={(e) => setIsStudent(e.target.checked)}
                                                className="w-4 h-4 rounded text-violet-600 bg-slate-950 border-slate-800 focus:ring-violet-600 focus:ring-2 cursor-pointer"
                                            />
                                            <label htmlFor="isStudent" className="text-xs font-medium text-slate-300 cursor-pointer flex items-center gap-1.5">
                                                <GraduationCap className="h-4 w-4 text-violet-500" />
                                                Je suis étudiant
                                            </label>
                                        </div>

                                        {isStudent && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800"
                                            >
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                        <Hash className="h-3.5 w-3.5 text-slate-500" />
                                                        Matricule
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        placeholder="ex: 22IUT2451"
                                                        value={matricule}
                                                        onChange={(e) => setMatricule(e.target.value)}
                                                        required={isStudent}
                                                        className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                                                        Email Universitaire
                                                    </label>
                                                    <Input
                                                        type="email"
                                                        placeholder="ex: etu@iut-douala.cm"
                                                        value={schoolEmail}
                                                        onChange={(e) => setSchoolEmail(e.target.value)}
                                                        className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                        <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                                                        Filière / Département
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        placeholder="ex: Génie Logiciel"
                                                        value={department}
                                                        onChange={(e) => setDepartment(e.target.value)}
                                                        className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                        <Hash className="h-3.5 w-3.5 text-slate-500" />
                                                        Année de Diplomation
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        placeholder="ex: 2026"
                                                        value={graduationYear}
                                                        onChange={(e) => setGraduationYear(e.target.value)}
                                                        className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}

                                {role === "recruiter" && (
                                    <motion.div
                                        key="recruiter"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden pt-2"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                                            <div className="space-y-1.5 col-span-2 md:col-span-1">
                                                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                                    Nom de l'Entreprise
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="ex: KmerTech Solutions"
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    required={role === "recruiter"}
                                                    className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                                    Secteur
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="ex: Télécom & IT"
                                                    value={companyIndustry}
                                                    onChange={(e) => setCompanyIndustry(e.target.value)}
                                                    className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5 text-slate-500" />
                                                    Site Web (Optionnel)
                                                </label>
                                                <Input
                                                    type="url"
                                                    placeholder="ex: https://kmertech.cm"
                                                    value={companyWebsite}
                                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                                    className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {role === "university_admin" && (
                                    <motion.div
                                        key="university_admin"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden pt-2"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                                            <div className="space-y-1.5 col-span-2 md:col-span-1">
                                                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                                    Nom officiel de l'Établissement
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="ex: IUT de Douala"
                                                    value={universityName}
                                                    onChange={(e) => setUniversityName(e.target.value)}
                                                    required={role === "university_admin"}
                                                    className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                                    Acronyme
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="ex: IUT-YUM"
                                                    value={universityAcronym}
                                                    onChange={(e) => setUniversityAcronym(e.target.value)}
                                                    required={role === "university_admin"}
                                                    className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5 text-slate-500" />
                                                    Domaine E-mail Académique
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="ex: iut-douala.cm (détecté depuis votre email)"
                                                    value={universityDomain}
                                                    onChange={(e) => setUniversityDomain(e.target.value)}
                                                    className="rounded-xl h-10 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="pt-2"
                            >
                                <Button
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm font-semibold"
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
                            className="mt-6 text-center text-sm text-slate-500"
                        >
                            Vous avez déjà un compte ?{" "}
                            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                                Se connecter
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
