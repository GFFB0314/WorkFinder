import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Building2, Calendar, ExternalLink, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import api from "../lib/api";
import type { Job } from "../types/job";
import { Header } from "../components/Header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export function JobDetailsPage() {
    const { id } = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await api.get(`/jobs/${id}`);
                setJob(response.data);
            } catch (error) {
                console.error("Failed to fetch job", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <Header />
                <div className="container mx-auto py-20 px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                        <p className="text-slate-500">Loading job details...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <Header />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="container mx-auto py-20 px-4 text-center"
                >
                    <h2 className="text-xl font-semibold text-slate-700">Job not found</h2>
                    <Button variant="link" asChild className="mt-4">
                        <Link to="/">Back to Jobs</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    const postedDate = job.posted_at ? new Date(job.posted_at) : new Date(job.created_at);
    const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

    const createMarkup = () => {
        return { __html: job.description || "" };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 font-sans text-slate-900">
            <Header />

            <div className="container mx-auto max-w-4xl px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="ghost" asChild className="mb-6 pl-0 hover:pl-2 transition-all rounded-xl group">
                        <Link to="/" className="gap-2">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Jobs
                        </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
                    className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-8 shadow-xl shadow-blue-900/5"
                >
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-600">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    <span className="font-medium">{job.company}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">Posted {timeAgo}</span>
                                </div>
                            </div>
                        </motion.div>
                        {job.url && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                            >
                                <Button size="lg" asChild className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                                        Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="mb-8 flex flex-wrap gap-2"
                    >
                        {job.remote && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200/60">Remote</Badge>
                        )}
                        {job.tech_stack?.map((tech) => (
                            <Badge key={tech} variant="tech">{tech}</Badge>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="prose prose-slate max-w-none border-t border-slate-100 pt-8 dark:prose-invert"
                    >
                        <h3 className="text-lg font-semibold text-slate-900">Description</h3>
                        <div
                            dangerouslySetInnerHTML={createMarkup()}
                            className="[&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>li]:mb-1 text-slate-600 leading-relaxed"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
