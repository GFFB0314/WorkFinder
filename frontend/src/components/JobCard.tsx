import { MapPin, Building2, Calendar, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Job } from "../types/job";

interface JobCardProps {
    job: Job;
}

export function JobCard({ job }: JobCardProps) {
    const postedDate = job.posted_at ? new Date(job.posted_at) : new Date(job.created_at);
    const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

    return (
        <div className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200/60">
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/30 group-hover:to-indigo-50/20 transition-all duration-500 pointer-events-none" />

            <div className="relative flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                        {job.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{job.company}</span>
                    </div>
                </div>
                {job.remote && (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100 transition-colors">
                        Remote
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
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500">+{job.tech_stack.length - 4}</Badge>
                )}
            </div>

            <div className="relative mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4 text-xs text-slate-500">
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
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all">
                        <a href={`/jobs/${job.id}`}>Details</a>
                    </Button>
                    <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all">
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                            Apply <ExternalLink className="ml-1.5 h-3 w-3" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
