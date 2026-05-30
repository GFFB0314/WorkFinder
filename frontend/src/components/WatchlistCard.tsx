import { Bell, MapPin, DollarSign, Briefcase, Trash2, Pencil, Wifi, Clock } from "lucide-react";
import { Button } from "./ui/button";

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

interface WatchlistCardProps {
    watchlist: Watchlist;
    onDelete: (id: number) => void;
    onEdit: (watchlist: Watchlist) => void;
}

export function WatchlistCard({ watchlist, onDelete, onEdit }: WatchlistCardProps) {
    const formatSalary = (amount?: number) => {
        if (!amount) return null;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const frequencyLabel: Record<string, string> = {
        instant: "Instant",
        daily: "Daily Digest",
        weekly: "Weekly Digest",
    };

    const experienceColors: Record<string, string> = {
        junior: "bg-emerald-50 text-emerald-700 border-emerald-200",
        mid: "bg-blue-50 text-blue-700 border-blue-200",
        senior: "bg-purple-50 text-purple-700 border-purple-200",
        lead: "bg-amber-50 text-amber-700 border-amber-200",
    };

    return (
        <div className={`group relative rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
            watchlist.active
                ? "border-slate-200/80 hover:border-blue-200"
                : "border-slate-200/50 opacity-75"
        }`}>
            {/* Active indicator dot */}
            <div className="absolute top-5 right-5">
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    watchlist.active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                        watchlist.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`} />
                    {watchlist.active ? "Active" : "Paused"}
                </div>
            </div>

            {/* Keywords */}
            <div className="mb-4 pr-20">
                <div className="flex flex-wrap gap-2">
                    {watchlist.keywords.map((keyword, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:from-blue-100 hover:to-indigo-100"
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                {watchlist.location && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 transition-colors hover:bg-slate-100">
                        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 font-medium truncate">{watchlist.location}</span>
                    </div>
                )}

                {watchlist.remote_only && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5">
                        <Wifi className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-emerald-700 font-medium">Remote Only</span>
                    </div>
                )}

                {watchlist.experience_level && (
                    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${experienceColors[watchlist.experience_level] || "bg-slate-50 text-slate-600"}`}>
                        <Briefcase className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium capitalize">{watchlist.experience_level} Level</span>
                    </div>
                )}

                {(watchlist.min_salary || watchlist.max_salary) && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5">
                        <DollarSign className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-amber-700 font-medium">
                            {watchlist.min_salary && watchlist.max_salary
                                ? `${formatSalary(watchlist.min_salary)} – ${formatSalary(watchlist.max_salary)}`
                                : watchlist.min_salary
                                    ? `From ${formatSalary(watchlist.min_salary)}`
                                    : `Up to ${formatSalary(watchlist.max_salary)}`}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5">
                    <Bell className="h-4 w-4 text-violet-500 flex-shrink-0" />
                    <span className="text-sm text-violet-700 font-medium">{frequencyLabel[watchlist.frequency] || watchlist.frequency}</span>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                    <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-500 font-medium">
                        {new Date(watchlist.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(watchlist)}
                    className="flex-1 gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(watchlist.id)}
                    className="rounded-xl border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all px-3"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
