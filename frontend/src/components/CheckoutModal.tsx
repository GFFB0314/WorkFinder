import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Check, Phone, CreditCard, X, GraduationCap, Shield, Zap } from "lucide-react";
import api from "../lib/api";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type PlanType = "premium" | "student";
type PaymentMethod = "momo_mtn" | "momo_orange" | "card";
type FlowState = "select" | "processing" | "success";

const plans = {
    premium: {
        name: "Premium Standard",
        icon: Crown,
        monthlyPrice: "2 500",
        yearlyPrice: "25 000",
        color: "from-amber-400 via-orange-500 to-red-500",
        glowColor: "shadow-orange-500/20",
        features: [
            "Alertes illimitées",
            "Analyse IA de compatibilité CV",
            "Upload CV & parsing automatique",
            "Notifications email en temps réel",
            "Accès prioritaire aux nouvelles offres",
        ],
    },
    student: {
        name: "Premium Étudiant",
        icon: GraduationCap,
        monthlyPrice: "1 500",
        yearlyPrice: "15 000",
        color: "from-indigo-500 via-purple-500 to-pink-500",
        glowColor: "shadow-purple-500/20",
        features: [
            "Alertes illimitées",
            "Analyse IA de compatibilité CV",
            "Upload CV & parsing automatique",
            "Notifications email en temps réel",
            "Tarif étudiant exclusif",
        ],
    },
};

const paymentMethods = [
    { id: "momo_mtn" as PaymentMethod, label: "MTN MoMo", color: "bg-yellow-400 text-yellow-950", activeGlow: "shadow-yellow-400/30", icon: "📱" },
    { id: "momo_orange" as PaymentMethod, label: "Orange Money", color: "bg-orange-500 text-white", activeGlow: "shadow-orange-500/30", icon: "📱" },
    { id: "card" as PaymentMethod, label: "Carte Bancaire", color: "bg-indigo-600 text-white", activeGlow: "shadow-indigo-500/30", icon: "💳" },
];

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>("premium");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo_mtn");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [flowState, setFlowState] = useState<FlowState>("select");
    const [error, setError] = useState("");

    const handlePay = async () => {
        setError("");

        // Validate inputs
        if ((paymentMethod === "momo_mtn" || paymentMethod === "momo_orange") && phoneNumber.length < 9) {
            setError("Veuillez entrer un numéro de téléphone valide.");
            return;
        }
        if (paymentMethod === "card" && cardNumber.length < 10) {
            setError("Veuillez entrer un numéro de carte valide.");
            return;
        }

        setFlowState("processing");

        try {
            // Simulate processing delay for realistic UX
            await new Promise((resolve) => setTimeout(resolve, 2500));

            const response = await api.post("/auth/subscribe", {
                plan: selectedPlan,
                payment_method: paymentMethod,
                phone_number: paymentMethod !== "card" ? phoneNumber : undefined,
                card_number: paymentMethod === "card" ? cardNumber : undefined,
            });

            if (response.data.status === "success") {
                localStorage.setItem("subStatus", response.data.subscription_status);
                setFlowState("success");
                setTimeout(() => {
                    onSuccess();
                    resetAndClose();
                }, 3000);
            }
        } catch (err: any) {
            setFlowState("select");
            setError(err?.response?.data?.detail || "Une erreur est survenue. Réessayez.");
        }
    };

    const resetAndClose = () => {
        setFlowState("select");
        setPhoneNumber("");
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget && flowState === "select") resetAndClose(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/50 dark:border-slate-800/50"
                    >
                        {/* Close button */}
                        {flowState === "select" && (
                            <button
                                onClick={resetAndClose}
                                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                        {/* Processing State */}
                        {flowState === "processing" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-24 px-8"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="mb-6"
                                >
                                    <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    Traitement en cours...
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                                    Vérification du paiement via {paymentMethods.find(p => p.id === paymentMethod)?.label}
                                </p>
                                <motion.div
                                    className="mt-6 h-1.5 w-48 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                                >
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2.5, ease: "easeInOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                    />
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Success State */}
                        {flowState === "success" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-24 px-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-xl shadow-emerald-500/30"
                                >
                                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
                                >
                                    🎉 Paiement réussi !
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-slate-500 dark:text-slate-400"
                                >
                                    Bienvenue dans le club Premium ! Profitez de toutes les fonctionnalités.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-4 text-4xl"
                                >
                                    ✨🚀🎊
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Selection State */}
                        {flowState === "select" && (
                            <div className="p-6 sm:p-8">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-4"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Passez à Premium
                                    </motion.div>
                                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit">
                                        Débloquez tout le potentiel de WorkFinder
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        Choisissez votre plan et commencez dès maintenant
                                    </p>
                                </div>

                                {/* Plan Cards */}
                                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                                    {(Object.entries(plans) as [PlanType, typeof plans.premium][]).map(([key, plan]) => {
                                        const isSelected = selectedPlan === key;
                                        const Icon = plan.icon;
                                        return (
                                            <motion.button
                                                key={key}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedPlan(key)}
                                                className={`relative text-left rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? `border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-lg ${plan.glowColor}`
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                                                }`}
                                            >
                                                {isSelected && (
                                                    <motion.div
                                                        layoutId="planIndicator"
                                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md"
                                                    >
                                                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                                    </motion.div>
                                                )}

                                                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${plan.color} mb-3`}>
                                                    <Icon className="h-5 w-5 text-white" />
                                                </div>

                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{plan.name}</h3>
                                                <div className="mt-1 flex items-baseline gap-1">
                                                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{plan.monthlyPrice}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">FCFA/mois</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                    ou {plan.yearlyPrice} FCFA/an
                                                </p>

                                                <ul className="mt-3 space-y-1.5">
                                                    {plan.features.map((f) => (
                                                        <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                            <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Payment Method */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-indigo-500" />
                                        Mode de paiement
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {paymentMethods.map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold transition-all cursor-pointer border-2 ${
                                                    paymentMethod === method.id
                                                        ? `${method.color} border-transparent shadow-lg ${method.activeGlow}`
                                                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                                }`}
                                            >
                                                <span className="text-lg">{method.icon}</span>
                                                {method.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Fields */}
                                <div className="mb-6 space-y-3">
                                    {(paymentMethod === "momo_mtn" || paymentMethod === "momo_orange") && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                <Phone className="h-3.5 w-3.5 inline mr-1" />
                                                Numéro de téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder={paymentMethod === "momo_mtn" ? "6XX XXX XXX" : "6XX XXX XXX"}
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    )}

                                    {paymentMethod === "card" && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                    <CreditCard className="h-3.5 w-3.5 inline mr-1" />
                                                    Numéro de carte
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="4242 4242 4242 4242"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                        Expiration
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/AA"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                        CVV
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        value={cardCvv}
                                                        onChange={(e) => setCardCvv(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Pay Button */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handlePay}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Zap className="h-4 w-4" />
                                    Payer {plans[selectedPlan].monthlyPrice} FCFA maintenant
                                </motion.button>

                                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-3">
                                    🔒 Paiement sécurisé • Annulation à tout moment • 30 jours d&apos;accès
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
