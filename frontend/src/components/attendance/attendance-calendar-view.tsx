'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/profile&image/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { IAttendance } from '@/interface';

interface AttendanceCalendarViewProps {
  attendanceData: IAttendance[];
  employeeName?: string;
  employeePhoto?: string;
}

export function AttendanceCalendarView({
  attendanceData,
  employeeName = 'Employee',
  employeePhoto
}: AttendanceCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, IAttendance>();
    attendanceData.forEach(record => {
      const dateKey = format(parseISO(record.attendance_date), 'yyyy-MM-dd');
      map.set(dateKey, record);
    });
    return map;
  }, [attendanceData]);

  // Get attendance for a specific date
  const getAttendanceForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return attendanceMap.get(dateKey);
  };

  // Get color based on status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'late':
        return 'bg-amber-500';
      case 'absent':
        return 'bg-red-500';
      case 'excused':
        return 'bg-blue-500';
      default:
        return 'bg-gray-200';
    }
  };

  // Get intensity for heatmap (based on work duration)
  const getIntensity = (attendance?: IAttendance) => {
    if (!attendance) return 0;
    // Use actual duration or default to 8 hours if checked in but not checked out
    const duration = attendance.work_duration_minutes || (attendance.actual_check_in && !attendance.actual_check_out ? 480 : 0);
    if (duration >= 480) return 1; // 8+ hours
    if (duration >= 360) return 0.7; // 6+ hours
    if (duration >= 240) return 0.4; // 4+ hours
    return 0.2;
  };

  const handleDateClick = (date: Date) => {
    const attendance = getAttendanceForDate(date);
    if (attendance) {
      setSelectedDate(date);
      setDetailDialogOpen(true);
    }
  };

  const selectedAttendance = selectedDate ? getAttendanceForDate(selectedDate) : null;

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'present').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const avgDuration = attendanceData.reduce((sum, a) => sum + (a.work_duration_minutes || 0), 0) / total || 0;

    return { total, present, late, absent, avgDuration };
  }, [attendanceData]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Days</p>
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
                <p className="text-3xl font-bold text-amber-600">{stats.late}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absences</p>
                <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <User className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Hours/Day</p>
                <p className="text-3xl font-bold">{(stats.avgDuration / 60).toFixed(1)}h</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {employeePhoto && (
                  <Avatar className="h-12 w-12 border-2 border-background shadow-lg">
                    <AvatarImage src={employeePhoto} />
                    <AvatarFallback>{employeeName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <CardTitle>{employeeName}'s Attendance</CardTitle>
                  <CardDescription>
                    {format(currentDate, 'MMMM yyyy')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {daysInMonth.map((date) => {
                const attendance = getAttendanceForDate(date);
                const intensity = getIntensity(attendance);
                const hasAttendance = !!attendance;
                const isToday = isSameDay(date, new Date());

                return (
                  <motion.button
                    key={date.toISOString()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDateClick(date)}
                    disabled={!hasAttendance}
                    className={cn(
                      'aspect-square rounded-lg border-2 transition-all duration-200',
                      'flex flex-col items-center justify-center p-1 relative',
                      hasAttendance ? 'cursor-pointer hover:shadow-lg' : 'cursor-default opacity-40',
                      isToday && 'ring-2 ring-blue-500 ring-offset-2',
                      !hasAttendance && 'bg-muted/30 border-muted',
                    )}
                    style={{
                      backgroundColor: hasAttendance
                        ? `rgba(34, 197, 94, ${intensity})`
                        : undefined,
                      borderColor: hasAttendance
                        ? `rgba(34, 197, 94, ${Math.min(intensity + 0.3, 1)})`
                        : undefined,
                    }}
                  >
                    <span className={cn(
                      'text-sm font-semibold',
                      hasAttendance ? 'text-white' : 'text-muted-foreground'
                    )}>
                      {format(date, 'd')}
                    </span>
                    {attendance && (
                      <div className={cn(
                        'absolute bottom-1 w-1.5 h-1.5 rounded-full',
                        getStatusColor(attendance.status)
                      )} />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Less</span>
                {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                  <div
                    key={intensity}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgba(34, 197, 94, ${intensity})` }}
                  />
                ))}
                <span className="text-sm text-muted-foreground">More</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <AnimatePresence>
        {detailDialogOpen && selectedAttendance && selectedDate && (
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </DialogTitle>
                <DialogDescription>
                  Attendance details and timeline
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={selectedAttendance.status === 'present' ? 'default' :
                      selectedAttendance.status === 'late' ? 'secondary' : 'destructive'}
                    className="text-base px-4 py-1"
                  >
                    {selectedAttendance.status?.toUpperCase()}
                  </Badge>
                </div>

                {/* Timeline Visualization */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Work Timeline
                  </h4>

                  {/* Timeline Bar */}
                  <div className="relative h-16 bg-muted rounded-lg overflow-hidden">
                    {/* Hour markers */}
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 border-r border-muted-foreground/10" />
                      ))}
                    </div>

                    {/* Work period bar */}
                    {selectedAttendance.actual_check_in && selectedAttendance.actual_check_out && (() => {
                      const checkInHour = parseInt(selectedAttendance.actual_check_in.split(':')[0] || '0');
                      const checkOutHour = parseInt(selectedAttendance.actual_check_out.split(':')[0] || '0');
                      return (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: 'auto' }}
                          className="absolute top-2 bottom-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs font-semibold shadow-lg"
                          style={{
                            left: `${(checkInHour / 24) * 100}%`,
                            right: `${100 - (checkOutHour / 24) * 100}%`
                          }}
                        >
                          {selectedAttendance.work_duration_minutes &&
                            `${Math.floor(selectedAttendance.work_duration_minutes / 60)}h ${selectedAttendance.work_duration_minutes % 60}m`
                          }
                        </motion.div>
                      );
                    })()}
                  </div>

                  {/* Time labels */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      {selectedAttendance.actual_check_in || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      {selectedAttendance.actual_check_out || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Work Duration</p>
                    <p className="text-lg font-semibold">
                      {selectedAttendance.work_duration_minutes
                        ? `${Math.floor(selectedAttendance.work_duration_minutes / 60)}h ${selectedAttendance.work_duration_minutes % 60}m`
                        : (selectedAttendance.actual_check_in ? '8h' : 'N/A')
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Overtime</p>
                    <p className="text-lg font-semibold">
                      {selectedAttendance.overtime_minutes
                        ? `${selectedAttendance.overtime_minutes}m`
                        : '0m'
                      }
                    </p>
                  </div>
                </div>

                {/* Location */}
                {selectedAttendance.checkin_location && (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{selectedAttendance.checkin_location}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedAttendance.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedAttendance.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
