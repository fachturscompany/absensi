"use client";

import { useState, useEffect, useCallback } from "react";
import { getSettingsMembers, SettingsMember } from "@/action/settings-members";

interface UseSettingsMembersResult {
    members: SettingsMember[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Simple in-memory cache
let cachedMembers: SettingsMember[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSettingsMembers(): UseSettingsMembersResult {
    const [members, setMembers] = useState<SettingsMember[]>(cachedMembers || []);
    const [loading, setLoading] = useState(!cachedMembers);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async (forceRefresh = false) => {
        // Use cache if valid and not forcing refresh
        const now = Date.now();
        if (!forceRefresh && cachedMembers && (now - cacheTimestamp) < CACHE_DURATION) {
            setMembers(cachedMembers);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getSettingsMembers();

            if (result.success) {
                cachedMembers = result.data;
                cacheTimestamp = Date.now();
                setMembers(result.data);
            } else {
                setError(result.message || "Failed to fetch members");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const refetch = useCallback(async () => {
        await fetchMembers(true);
    }, [fetchMembers]);

    return { members, loading, error, refetch };
}
