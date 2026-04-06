'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Fingerprint,
  Timer,
  LogIn,
  LogOut,
  Navigation,
  Shield,
  Activity,
  Loader2,
  ChevronRight,
  User,
  Building,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/profile&image/avatar';
import { cn } from '@/lib/utils';

interface AttendanceStats {
  onTime: number;
  late: number;
  early: number;
  totalDays: number;
}

interface CheckInData {
  time: string;
  location: string;
  method: 'gps' | 'wifi' | 'manual' | 'biometric' | 'rfid';
  status: 'success' | 'warning' | 'error';
  message?: string;
}

const mockStats: AttendanceStats = {
  onTime: 18,
  late: 2,
  early: 5,
  totalDays: 25,
};

export default function ModernCheckIn() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationEnabled, _setLocationEnabled] = useState(true);
  const [wifiConnected, _setWifiConnected] = useState(true);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'location' | 'manual' | 'biometric'>('location');

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCheckIn = async () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsCheckedIn(true);
      setCheckInData({
        time: formatTime(new Date()),
        location: 'Main Office - Building A',
        method: selectedMethod === 'location' ? 'gps' : selectedMethod === 'biometric' ? 'biometric' : 'manual',
        status: 'success',
        message: 'Successfully checked in',
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleCheckOut = async () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsCheckedIn(false);
      setCheckInData(null);
      setIsLoading(false);
    }, 2000);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'location':
        return <MapPin className="h-5 w-5" />;
      case 'biometric':
        return <Fingerprint className="h-5 w-5" />;
      case 'manual':
        return <User className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Clock */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">
          {formatTime(currentTime)}
        </h1>
        <p className="text-muted-foreground">
          {formatDate(currentTime)}
        </p>
      </motion.div>

      {/* Main Check-in Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Daily Attendance</CardTitle>
                <CardDescription>
                  Mark your attendance for today
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {locationEnabled && (
                  <Badge variant="outline" className="gap-1">
                    <Navigation className="h-3 w-3" />
                    GPS Active
                  </Badge>
                )}
                {wifiConnected && (
                  <Badge variant="outline" className="gap-1">
                    <Wifi className="h-3 w-3" />
                    Office WiFi
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/avatar.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">John Doe</h3>
                <p className="text-sm text-muted-foreground">Senior Developer</p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Building className="h-3 w-3" />
                    Engineering
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    Shift: 09:00 - 18:00
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in Methods */}
            {!isCheckedIn && !checkInData && (
              <div>
                <p className="text-sm font-medium mb-3">Select Check-in Method</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { id: 'location', icon: MapPin, label: 'GPS Location', desc: 'Use current location' },
                    { id: 'biometric', icon: Fingerprint, label: 'Biometric', desc: 'Fingerprint or Face ID' },
                    { id: 'manual', icon: User, label: 'Manual', desc: 'Request approval' },
                  ].map((method) => (
                    <motion.button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id as any)}
                      className={cn(
                        'relative p-4 rounded-lg border-2 text-left transition-all',
                        selectedMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <method.icon className={cn(
                        'h-5 w-5 mb-2',
                        selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <div className="font-medium text-sm">{method.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{method.desc}</div>
                      {selectedMethod === method.id && (
                        <motion.div
                          layoutId="selected-method"
                          className="absolute top-2 right-2"
                        >
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Display */}
            <AnimatePresence mode="wait">
              {checkInData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Alert className={cn(
                    'border-2',
                    checkInData.status === 'success' && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
                    checkInData.status === 'warning' && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
                    checkInData.status === 'error' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  )}>
                    <div className="flex items-start gap-3">
                      {checkInData.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-slate-700 dark:text-green-400 mt-0.5" />
                      ) : checkInData.status === 'warning' ? (
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertTitle>Checked In Successfully</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>Time: {checkInData.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>Location: {checkInData.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {getMethodIcon(checkInData.method)}
                            <span>Method: {checkInData.method.charAt(0).toUpperCase() + checkInData.method.slice(1)}</span>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>

                  {/* Work Timer */}
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Work Timer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time Elapsed</span>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-primary" />
                          <span className="font-mono font-medium">04:23:15</span>
                        </div>
                      </div>
                      <Progress value={54} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>4h 23m of 8h</span>
                        <span>54% Complete</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isCheckedIn ? (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleCheckIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Check In
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCheckOut}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-5 w-5" />
                      Check Out
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{mockStats.totalDays} Days</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-600" />
                  <span>On Time</span>
                </div>
                <span className="font-medium">{mockStats.onTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Late</span>
                </div>
                <span className="font-medium">{mockStats.late}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-black" />
                  <span>Early</span>
                </div>
                <span className="font-medium">{mockStats.early}</span>
              </div>
            </div>
            <Progress
              value={(mockStats.onTime / mockStats.totalDays) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Average Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">08:55 AM</div>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              5 min early
            </Badge>
            <div className="text-xs text-muted-foreground">
              Better than 73% of employees
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">96.5%</div>
            <Progress value={96.5} className="h-2" />
            <Badge variant="outline" className="gap-1 text-slate-700 dark:text-green-400">
              <Activity className="h-3 w-3" />
              Excellent
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your attendance history for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { day: 'Today', checkIn: '08:55', checkOut: '-', status: 'present' },
                { day: 'Yesterday', checkIn: '09:02', checkOut: '18:15', status: 'present' },
                { day: 'Monday', checkIn: '08:45', checkOut: '18:00', status: 'present' },
                { day: 'Sunday', checkIn: '-', checkOut: '-', status: 'weekend' },
                { day: 'Saturday', checkIn: '-', checkOut: '-', status: 'weekend' },
              ].map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      record.status === 'present' && 'bg-slate-600',
                      record.status === 'weekend' && 'bg-gray-400'
                    )} />
                    <div>
                      <p className="font-medium">{record.day}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {record.checkIn !== '-' && (
                          <span className="flex items-center gap-1">
                            <LogIn className="h-3 w-3" />
                            {record.checkIn}
                          </span>
                        )}
                        {record.checkOut !== '-' && (
                          <span className="flex items-center gap-1">
                            <LogOut className="h-3 w-3" />
                            {record.checkOut}
                          </span>
                        )}
                        {record.status === 'weekend' && (
                          <span>Weekend</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {record.checkIn !== '-' && record.checkOut !== '-' && (
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Full History
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
