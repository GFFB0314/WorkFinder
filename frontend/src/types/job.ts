export interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    remote: boolean;
    posted_at: string | null;
    created_at: string;
    source_id: number;
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    tech_stack: string[];
    normalized_hash?: string;
    source?: string;
}

export interface JobFilter {
    search?: string;
    location?: string;
    remote?: boolean;
    skills?: string;
    page?: number;
    limit?: number;
}
