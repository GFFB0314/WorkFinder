import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import api from "../lib/api";

interface CreateWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateWatchlistModal({ isOpen, onClose, onSuccess }: CreateWatchlistModalProps) {
    const [keywords, setKeywords] = useState("");
    const [location, setLocation] = useState("");
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [experienceLevel, setExperienceLevel] = useState("");
    const [minSalary, setMinSalary] = useState("");
    const [maxSalary, setMaxSalary] = useState("");
    const [frequency, setFrequency] = useState("daily");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k);

            if (keywordList.length === 0) {
                setError("Please enter at least one keyword");
                setLoading(false);
                return;
            }

            const watchlistData = {
                keywords: keywordList,
                location: location || null,
                remote_only: remoteOnly,
                experience_level: experienceLevel || null,
                min_salary: minSalary ? parseInt(minSalary) : null,
                max_salary: maxSalary ? parseInt(maxSalary) : null,
                frequency,
                active: true
            };

            await api.post("/watchlists", watchlistData);
            onSuccess();
            onClose();

            // Reset form
            setKeywords("");
            setLocation("");
            setRemoteOnly(false);
            setExperienceLevel("");
            setMinSalary("");
            setMaxSalary("");
            setFrequency("daily");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to create watchlist");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 py-8 px-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl my-auto rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="mb-6 text-2xl font-bold text-slate-900">Create Watchlist</h2>
                <p className="mb-6 text-sm text-slate-600">
                    Get notified when new jobs match your criteria
                </p>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Keywords */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Keywords <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Python, React, Machine Learning (comma-separated)"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500">Separate multiple keywords with commas</p>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Location (Optional)
                        </label>
                        <Input
                            placeholder="London, Remote, USA"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Remote Only */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remoteOnly"
                            checked={remoteOnly}
                            onChange={(e) => setRemoteOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="remoteOnly" className="text-sm font-medium text-slate-700">
                            Remote jobs only
                        </label>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Experience Level (Optional)
                        </label>
                        <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                            <option value="">Any</option>
                            <option value="junior">Junior</option>
                            <option value="mid">Mid-Level</option>
                            <option value="senior">Senior</option>
                            <option value="lead">Lead</option>
                        </select>
                    </div>

                    {/* Salary Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Min Salary (Optional)
                            </label>
                            <Input
                                type="number"
                                placeholder="50000"
                                value={minSalary}
                                onChange={(e) => setMinSalary(e.target.value)}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Max Salary (Optional)
                            </label>
                            <Input
                                type="number"
                                placeholder="150000"
                                value={maxSalary}
                                onChange={(e) => setMaxSalary(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Notification Frequency */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Notification Frequency
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                            <option value="instant">Instant</option>
                            <option value="daily">Daily Digest</option>
                            <option value="weekly">Weekly Digest</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Watchlist"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
