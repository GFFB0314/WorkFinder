import { MapPin, Building2, Calendar, ExternalLink, Lock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Job } from "../types/job";

interface JobCardProps {
    job: Job;
    matchScore?: number | null;
    isPremium?: boolean;
}

export function JobCard({ job, matchScore, isPremium = false }: JobCardProps) {
    const postedDate = job.posted_at ? new Date(job.posted_at) : new Date(job.created_at);
    const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

    // Match score badge color logic
    const getScoreBadge = () => {
        if (matchScore === undefined || matchScore === null) return null;
        if (matchScore >= 80) {
            return {
                bg: "bg-gradient-to-r from-emerald-500 to-green-500",
                glow: "shadow-emerald-500/30",
                text: `${matchScore}% Match`,
            };
        }
        if (matchScore >= 50) {
            return {
                bg: "bg-gradient-to-r from-amber-400 to-orange-500",
                glow: "shadow-amber-500/30",
                text: `${matchScore}% Match`,
            };
        }
        return {
            bg: "bg-gradient-to-r from-rose-400 to-red-500",
            glow: "shadow-rose-500/30",
            text: `${matchScore}% Match`,
        };
    };

    const scoreBadge = getScoreBadge();

    return (
        <div className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 dark:hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200/60 dark:hover:border-indigo-700/60">
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/30 group-hover:to-purple-50/20 dark:group-hover:from-indigo-950/20 dark:group-hover:to-purple-950/10 transition-all duration-500 pointer-events-none" />

            {/* Match Score Badge */}
            {isPremium && scoreBadge && (
                <div className={`absolute -top-2.5 -right-2.5 z-10 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white ${scoreBadge.bg} shadow-lg ${scoreBadge.glow} flex items-center gap-1`}>
                    <Zap className="h-3 w-3" />
                    {scoreBadge.text}
                </div>
            )}
            {!isPremium && (
                <div className="absolute -top-2.5 -right-2.5 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 backdrop-blur-sm cursor-pointer" title="Passez à Premium pour voir votre score">
                    <Lock className="h-3 w-3" />
                    Match Score
                </div>
            )}

            <div className="relative flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {job.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{job.company}</span>
                    </div>
                </div>
                {job.remote && (
                    <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors">
                        Télétravail
                    </Badge>
                )}
            </div>

            <div className="relative flex flex-wrap gap-1.5">
                {job.tech_stack?.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="tech" className="transition-transform hover:scale-105">
                        {tech}
                    </Badge>
                ))}
                {job.tech_stack?.length > 4 && (
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">+{job.tech_stack.length - 4}</Badge>
                )}
            </div>

            <div className="relative mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{timeAgo}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-transparent text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all opacity-100 flex">
                        <a href={`/jobs/${job.id}`}>Détails</a>
                    </Button>
                    <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all">
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                            Postuler <ExternalLink className="ml-1.5 h-3 w-3" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
