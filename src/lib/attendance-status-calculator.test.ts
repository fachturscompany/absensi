import { describe, it, expect } from 'vitest';
import {
    calculateAttendanceStatus,
    validateScheduleRule,
    getDayOfWeek,
    getScheduleRuleForDay,
    ScheduleRule,
} from './attendance-status-calculator';

const DEFAULT_RULE: ScheduleRule = {
    day_of_week: 1, // Monday
    start_time: '08:00',
    end_time: '17:30',
    core_hours_start: '09:00',
    core_hours_end: '17:00',
};

describe('validateScheduleRule', () => {
    it('should return null for valid rule', () => {
        expect(validateScheduleRule(DEFAULT_RULE)).toBeNull();
    });

    it('should reject when core_hours_end <= core_hours_start', () => {
        const rule = { ...DEFAULT_RULE, core_hours_end: '08:00' };
        expect(validateScheduleRule(rule)).toContain('core_hours_end must be later');
    });

    it('should reject when start_time >= core_hours_start', () => {
        const rule = { ...DEFAULT_RULE, start_time: '09:00' };
        expect(validateScheduleRule(rule)).toContain('start_time must be earlier');
    });

    it('should reject when end_time <= core_hours_end', () => {
        const rule = { ...DEFAULT_RULE, end_time: '17:00' };
        expect(validateScheduleRule(rule)).toContain('end_time must be later');
    });
});

describe('calculateAttendanceStatus', () => {
    describe('PRESENT status', () => {
        it('should return PRESENT when check-in is before core hours', () => {
            const result = calculateAttendanceStatus('08:30', '17:30', DEFAULT_RULE);
            expect(result.status).toBe('present');
            expect(result.present).toBe(true);
        });

        it('should return PRESENT when check-in is exactly at core hours start', () => {
            const result = calculateAttendanceStatus('09:00', '17:30', DEFAULT_RULE);
            expect(result.status).toBe('present');
            expect(result.present).toBe(true);
        });
    });

    describe('LATE status', () => {
        it('should return LATE when check-in is after core hours start', () => {
            const result = calculateAttendanceStatus('09:01', '17:30', DEFAULT_RULE);
            expect(result.status).toBe('late');
            expect(result.present).toBe(true);
            expect(result.details.lateMinutes).toBe(1);
        });

        it('should return LATE when check-in is significantly after core hours', () => {
            const result = calculateAttendanceStatus('10:00', '17:30', DEFAULT_RULE);
            expect(result.status).toBe('late');
            expect(result.details.lateMinutes).toBe(60);
        });
    });

    describe('EARLY_LEAVE status/LATE status variants', () => {
        it('should return LATE (early leave variant) when check-out is before core hours end', () => {
            const result = calculateAttendanceStatus('08:30', '16:59', DEFAULT_RULE);
            expect(result.status).toBe('late'); // Logic returns 'late' for any non-compliance
            expect(result.present).toBe(true);
            expect(result.details.earlyLeaveMinutes).toBe(1);
        });
    });

    describe('ABSENT status', () => {
        it('should return ABSENT when check-in is missing', () => {
            const result = calculateAttendanceStatus(null, '17:30', DEFAULT_RULE);
            expect(result.status).toBe('absent');
            expect(result.present).toBe(false);
        });

        it('should return ABSENT when check-out is missing', () => {
            const result = calculateAttendanceStatus('08:30', null, DEFAULT_RULE);
            expect(result.status).toBe('absent');
            expect(result.present).toBe(false);
        });

        it('should return ABSENT for invalid rule configuration', () => {
            const invalidRule = { ...DEFAULT_RULE, core_hours_end: '08:00' };
            const result = calculateAttendanceStatus('08:30', '17:30', invalidRule);
            expect(result.status).toBe('absent');
            expect(result.present).toBe(false);
        });
    });

    describe('Edge cases', () => {
        it('should handle HH:MM:SS format', () => {
            const result = calculateAttendanceStatus('08:30:00', '17:30:00', DEFAULT_RULE);
            expect(result.status).toBe('present');
        });

        it('should summarize late and early_leave when both occur', () => {
            const result = calculateAttendanceStatus('09:30', '16:30', DEFAULT_RULE);
            expect(result.status).toBe('late');
            expect(result.details.lateMinutes).toBe(30);
            expect(result.details.earlyLeaveMinutes).toBe(30);
        });
    });
});

describe('getDayOfWeek', () => {
    it('should return correct day for Monday', () => {
        // 2026-01-12 is a Monday
        expect(getDayOfWeek('2026-01-12')).toBe(1);
    });

    it('should return 0 for Sunday', () => {
        // 2026-01-11 is a Sunday
        expect(getDayOfWeek('2026-01-11')).toBe(0);
    });
});

describe('getScheduleRuleForDay', () => {
    const rules: ScheduleRule[] = [
        { ...DEFAULT_RULE, day_of_week: 1 },
        { ...DEFAULT_RULE, day_of_week: 2, core_hours_start: '10:00' },
    ];

    it('should find rule for matching day', () => {
        const rule = getScheduleRuleForDay(2, rules);
        expect(rule?.core_hours_start).toBe('10:00');
    });

    it('should return undefined for non-matching day', () => {
        const rule = getScheduleRuleForDay(0, rules);
        expect(rule).toBeUndefined();
    });
});
