'use server'

import { createClient } from '@/utils/supabase/server'

const BUCKET_NAME = 'screenshots'
const INTERVAL_SECONDS = 600 // 10 menit = 600 detik

// ============================================================
// Types
// ============================================================

export interface IScreenshot {
    id: number
    organization_member_id: number
    project_id: number | null
    task_id: number | null
    activity_id: number | null
    screenshot_date: string
    time_slot: string
    recorded_at: string
    full_url: string
    thumb_url: string | null
    screen_number: number
    width: number | null
    height: number | null
    is_blurred: boolean
    is_deleted: boolean
    created_at: string
}

export interface IScreenshotWithActivity extends IScreenshot {
    // Dari join activities
    keyboard_seconds: number | null
    mouse_seconds: number | null
    // Computed
    activity_progress: number // 0-100
}

export interface ISimpleMember {
    id: string          // organization_member id (sebagai string)
    name: string
    avatarUrl: string | null
}

export interface UploadScreenshotParams {
    orgId: string
    memberId: number
    file: File | Blob
    thumbFile?: File | Blob | null
    projectId?: number | null
    taskId?: number | null
    activityId?: number | null
    screenshotDate: string       // format: YYYY-MM-DD
    timeSlot: string             // format: ISO timestamp
    recordedAt: string           // format: ISO timestamp
    screenNumber?: number
    width?: number
    height?: number
}

// ============================================================
// Upload screenshot ke Supabase Storage + simpan ke DB
// ============================================================

export async function uploadScreenshot(params: UploadScreenshotParams): Promise<{
    success: boolean
    data?: IScreenshot
    message?: string
}> {
    const supabase = await createClient()

    const {
        orgId,
        memberId,
        file,
        thumbFile,
        projectId,
        taskId,
        activityId,
        screenshotDate,
        timeSlot,
        recordedAt,
        screenNumber = 1,
        width,
        height,
    } = params

    const timestamp = Date.now()
    const basePath = `${orgId}/${memberId}/${screenshotDate}`

    // --- Upload full screenshot ---
    const fullPath = `${basePath}/full_${timestamp}_screen${screenNumber}.jpg`
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fullPath, file, {
            contentType: 'image/jpeg',
            upsert: false,
        })

    if (uploadError) {
        console.error('Upload full screenshot failed:', uploadError)
        return { success: false, message: uploadError.message }
    }

    const { data: { publicUrl: fullUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fullPath)

    // --- Upload thumbnail (optional) ---
    let thumbUrl: string | null = null
    if (thumbFile) {
        const thumbPath = `${basePath}/thumb_${timestamp}_screen${screenNumber}.jpg`
        const { error: thumbError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(thumbPath, thumbFile, {
                contentType: 'image/jpeg',
                upsert: false,
            })

        if (!thumbError) {
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(thumbPath)
            thumbUrl = publicUrl
        }
    }

    // --- Simpan ke tabel screenshots ---
    const { data, error: dbError } = await supabase
        .from('screenshots')
        .insert({
            organization_member_id: memberId,
            project_id: projectId ?? null,
            task_id: taskId ?? null,
            activity_id: activityId ?? null,
            screenshot_date: screenshotDate,
            time_slot: timeSlot,
            recorded_at: recordedAt,
            full_url: fullUrl,
            thumb_url: thumbUrl,
            screen_number: screenNumber,
            width: width ?? null,
            height: height ?? null,
            is_blurred: false,
            is_deleted: false,
        })
        .select()
        .single()

    if (dbError) {
        console.error('Insert screenshot to DB failed:', dbError)
        return { success: false, message: dbError.message }
    }

    return { success: true, data }
}

// ============================================================
// Ambil screenshots berdasarkan member & range tanggal
// Sekaligus join activities untuk activity_progress
// ============================================================

export async function getScreenshotsByMemberAndDate(
    organizationMemberId: number,
    startDate: string,   // YYYY-MM-DD
    endDate: string      // YYYY-MM-DD
): Promise<{ success: boolean; data?: IScreenshotWithActivity[]; message?: string }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('screenshots')
        .select(`
      *,
      activities (
        keyboard_seconds,
        mouse_seconds
      )
    `)
        .eq('organization_member_id', organizationMemberId)
        .gte('screenshot_date', startDate)
        .lte('screenshot_date', endDate)
        .eq('is_deleted', false)
        .order('time_slot', { ascending: true })

    // Perbaikan offset timezone dengan menggunakan local date components

    if (error) {
        return { success: false, message: error.message }
    }

    // Hitung activity_progress dari keyboard_seconds + mouse_seconds
    const mapped: IScreenshotWithActivity[] = (data ?? []).map((row: any) => {
        const kbd = row.activities?.keyboard_seconds ?? 0
        const mouse = row.activities?.mouse_seconds ?? 0
        const totalActive = kbd + mouse
        // Max active = INTERVAL_SECONDS (600s untuk 10 menit)
        const progress = Math.min(100, Math.round((totalActive / INTERVAL_SECONDS) * 100))

        return {
            ...row,
            keyboard_seconds: kbd,
            mouse_seconds: mouse,
            activity_progress: progress,
        }
    })

    return { success: true, data: mapped }
}

// ============================================================
// Ambil ringkasan insight member (Worked Time, Avg Activity, Focus, Unusual)
// ============================================================

export async function getMemberInsightsSummary(
    organizationMemberId: number,
    startDate: string,   // YYYY-MM-DD
    endDate: string      // YYYY-MM-DD
): Promise<{ success: boolean; data?: any; message?: string }> {
    const supabase = await createClient()

    try {
        // 1. Ambil data dari timesheets (Worked Time, Focus, Unusual)
        // PERBAIKAN LOGIK: Cari timesheet yang MENCAKUP rentang tanggal yang dipilih,
        // bukan yang start/end-nya persis sama dengan range tersebut.
        const { data: timesheetsData, error: timesheetsError } = await supabase
            .from('timesheets')
            .select(`
                id,
                total_tracked_seconds,
                focus_seconds,
                unusual_activity_count,
                start_date,
                end_date
            `)
            .eq('organization_member_id', organizationMemberId)
            .lte('start_date', endDate)   // Timesheet mulai sebelum/pada akhir range
            .gte('end_date', startDate)   // Timesheet berakhir sesudah/pada awal range

        if (timesheetsError) {
            return { success: false, message: timesheetsError.message }
        }

        let totalWorkedSeconds = 0
        let totalFocusSeconds = 0
        let totalUnusualCount = 0
        const avgActivitySum = 0

        if (timesheetsData && timesheetsData.length > 0) {
            const ts = timesheetsData[0]
            if (ts) {
                totalWorkedSeconds = ts.total_tracked_seconds || 0
                totalFocusSeconds = ts.focus_seconds || 0
                totalUnusualCount = ts.unusual_activity_count || 0
            }
        }

        // 2. Ambil klasifikasi kerja dari productivity_categories & tool_usages/url_visits
        // Logika ini tetap sama (menggunakan mock atau query real jika sudah ada)
        // ... (sisanya tetap sesuai kebutuhan UI)
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('overall_seconds, keyboard_seconds, mouse_seconds')
            .eq('organization_member_id', organizationMemberId)
            .gte('activity_date', startDate)
            .lte('activity_date', endDate)

        if (activitiesError) {
            console.error('Activities error:', activitiesError.message)
        }

        let totalOverallSeconds = 0
        let totalKbdSeconds = 0
        let totalMouseSeconds = 0

        if (activitiesData && activitiesData.length > 0) {
            activitiesData.forEach((act: any) => {
                let rowOverall = act.overall_seconds || 0
                // Fallback: Jika overall_seconds 0 tapi ada aktivitas input,
                // asumsikan slot ini terpakai (600s).
                if (rowOverall === 0 && ((act.keyboard_seconds || 0) > 0 || (act.mouse_seconds || 0) > 0)) {
                    rowOverall = 600
                }
                totalOverallSeconds += rowOverall
                totalKbdSeconds += (act.keyboard_seconds || 0)
                totalMouseSeconds += (act.mouse_seconds || 0)
            })

            // FALLBACK: Jika worked_seconds dari timesheet adalah 0, gunakan totalOverallSeconds dari activities
            if (totalWorkedSeconds === 0) {
                totalWorkedSeconds = totalOverallSeconds
            }
        }

        const avgActivityPercent = totalOverallSeconds > 0
            ? Math.min(100, Math.round(((totalKbdSeconds + totalMouseSeconds) / totalOverallSeconds) * 100))
            : 0

        // 3. Work Classification dari url_visits & tool_usages
        // Ambil URL Visits
        const { data: urlsData, error: urlsError } = await supabase
            .from('url_visits')
            .select('url, tracked_seconds, is_productive')
            .eq('organization_member_id', organizationMemberId)
            .gte('visit_date', startDate)
            .lte('visit_date', endDate)

        if (urlsError) throw new Error(`URL visits error: ${urlsError.message}`)

        // Ambil Tool Usages
        const { data: toolsData, error: toolsError } = await supabase
            .from('tool_usages')
            .select('tool_name, tracked_seconds, is_productive')
            .eq('organization_member_id', organizationMemberId)
            .gte('usage_date', startDate)
            .lte('usage_date', endDate)

        if (toolsError) throw new Error(`Tool usages error: ${toolsError.message}`)

        // Aggregate Data Classification
        let coreWorkSeconds = 0
        let nonCoreWorkSeconds = 0
        let unproductiveSeconds = 0

        const coreItemsMap: Record<string, number> = {}
        const nonCoreItemsMap: Record<string, number> = {}
        const unproductiveItemsMap: Record<string, number> = {}

        const processActivityItem = (name: string, seconds: number, classification: string) => {
            if (!seconds) return

            if (classification === 'core-work') {
                coreWorkSeconds += seconds
                coreItemsMap[name] = (coreItemsMap[name] || 0) + seconds
            } else if (classification === 'unproductive') {
                unproductiveSeconds += seconds
                unproductiveItemsMap[name] = (unproductiveItemsMap[name] || 0) + seconds
            } else { // non-core-work
                nonCoreWorkSeconds += seconds
                nonCoreItemsMap[name] = (nonCoreItemsMap[name] || 0) + seconds
            }
        }

        urlsData?.forEach((item: any) => processActivityItem(item.url, item.tracked_seconds, item.is_productive))
        toolsData?.forEach((item: any) => processActivityItem(item.tool_name, item.tracked_seconds, item.is_productive))

        const totalClassificationSeconds = coreWorkSeconds + nonCoreWorkSeconds + unproductiveSeconds

        const formatItems = (mapObj: Record<string, number>, totalSecs: number) => {
            return Object.entries(mapObj)
                .map(([name, time]) => ({
                    name,
                    time,
                    percentage: totalSecs > 0 ? Math.round((time / totalSecs) * 100) : 0
                }))
                .sort((a, b) => b.time - a.time)
                .slice(0, 5) // Top 5
        }

        const classificationData = {
            coreWork: {
                time: coreWorkSeconds,
                percentage: totalClassificationSeconds > 0 ? Math.round((coreWorkSeconds / totalClassificationSeconds) * 100) : 0,
                items: formatItems(coreItemsMap, coreWorkSeconds)
            },
            nonCoreWork: {
                time: nonCoreWorkSeconds,
                percentage: totalClassificationSeconds > 0 ? Math.round((nonCoreWorkSeconds / totalClassificationSeconds) * 100) : 0,
                items: formatItems(nonCoreItemsMap, nonCoreWorkSeconds)
            },
            unproductive: {
                time: unproductiveSeconds,
                percentage: totalClassificationSeconds > 0 ? Math.round((unproductiveSeconds / totalClassificationSeconds) * 100) : 0,
                items: formatItems(unproductiveItemsMap, unproductiveSeconds)
            }
        }

        return {
            success: true,
            data: {
                workedSeconds: totalWorkedSeconds,
                focusSeconds: totalFocusSeconds,
                unusualCount: totalUnusualCount,
                avgActivityPercent: avgActivitySum || Math.min(100, avgActivityPercent),
                classification: classificationData
            }
        }
    } catch (err: any) {
        console.error("Error getMemberInsightsSummary:", err)
        return { success: false, message: err.message }
    }
}

// ============================================================
// Ambil daftar member untuk dropdown (screenshot page)
// ============================================================

export async function getMembersForScreenshot(
    organizationId: string,
    pageOptions?: { page: number; limit: number },
    searchQuery?: string
): Promise<{ success: boolean; data?: ISimpleMember[]; total?: number; message?: string }> {
    const supabase = await createClient()

    let query = supabase
        .from('organization_members')
        .select(`
          id,
          user_profiles!inner (
            first_name,
            last_name,
            display_name,
            profile_photo_url
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('id', { ascending: true })

    if (searchQuery) {
        // Search across names. Note we use !inner above to enforce the join filter if we use it, 
        // but Supabase text search on joined tables with `or` syntax can be tricky.
        // A simpler approach for search is `ilike` on the view, but here profile is a joined table so we do:
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`, { foreignTable: 'user_profiles' })
    }

    if (pageOptions) {
        // If pagination is explicitly requested, we do just ONE query for that page
        const { page, limit } = pageOptions
        const start = (page - 1) * limit
        const end = start + limit - 1
        query = query.range(start, end)

        const { data, count, error } = await query

        if (error) {
            return { success: false, message: error.message }
        }

        const members: ISimpleMember[] = (data || []).map((m: any) => {
            const profile = m.user_profiles
            const firstName = profile?.first_name ?? ''
            const lastName = profile?.last_name ?? ''
            const fullName = `${firstName} ${lastName}`.trim() || profile?.display_name || 'Unknown Member'
            return {
                id: String(m.id),
                name: fullName,
                avatarUrl: profile?.profile_photo_url ?? null,
            }
        })

        return { success: true, data: members, total: count || 0 }
    } else {
        // Existing behavior: fetch ALL members via looping (for backwards compatibility where it's used elsewhere)
        let allData: any[] = []
        let hasMore = true
        let pageIdx = 0
        const chunkSize = 1000
        let totalCount = 0

        while (hasMore) {
            let loopQuery = supabase
                .from('organization_members')
                .select(`
                  id,
                  user_profiles!inner (
                    first_name,
                    last_name,
                    display_name,
                    profile_photo_url
                  )
                `, { count: 'exact' })
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('id', { ascending: true })
                .range(pageIdx * chunkSize, (pageIdx + 1) * chunkSize - 1)

            if (searchQuery) {
                loopQuery = loopQuery.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`, { foreignTable: 'user_profiles' })
            }

            const { data, count, error } = await loopQuery

            if (error) {
                return { success: false, message: error.message }
            }

            if (pageIdx === 0) totalCount = count || 0

            if (data && data.length > 0) {
                allData = [...allData, ...data]
                pageIdx++
                if (data.length < chunkSize) {
                    hasMore = false
                }
            } else {
                hasMore = false
            }
        }

        const members: ISimpleMember[] = allData.map((m: any) => {
            const profile = m.user_profiles
            const firstName = profile?.first_name ?? ''
            const lastName = profile?.last_name ?? ''
            const fullName = `${firstName} ${lastName}`.trim() || profile?.display_name || 'Unknown Member'
            return {
                id: String(m.id),
                name: fullName,
                avatarUrl: profile?.profile_photo_url ?? null,
            }
        })

        return { success: true, data: members, total: totalCount }
    }
}

// ============================================================
// Soft delete screenshot
// ============================================================

export async function deleteScreenshot(
    screenshotId: number,
    deletedBy: string
): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('screenshots')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
        })
        .eq('id', screenshotId)

    if (error) {
        return { success: false, message: error.message }
    }

    return { success: true }
}

// ============================================================
// Generate signed URL (untuk bucket private - expire 1 jam)
// ============================================================

export async function getSignedUrl(
    filePath: string,
    expiresInSeconds = 3600
): Promise<{ success: boolean; signedUrl?: string; message?: string }> {
    const supabase = await createClient()

    const storagePath = filePath.includes('/storage/v1/object/')
        ? filePath.split(`/${BUCKET_NAME}/`)[1]
        : filePath

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath ?? '', expiresInSeconds)

    if (error) {
        return { success: false, message: error.message }
    }

    return { success: true, signedUrl: data.signedUrl }
}
