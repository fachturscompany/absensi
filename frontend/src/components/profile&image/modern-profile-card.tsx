'use client';

import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  UserCheck,
  UserX,
  Activity,
  Award,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Share2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/profile&image/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  position: string;
  department: string;
  location?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  attendanceRate: number;
  performance?: 'excellent' | 'good' | 'average' | 'needs-improvement';
  skills?: string[];
  recentActivity?: {
    checkIn?: string;
    checkOut?: string;
  };
  stats?: {
    totalDays: number;
    onTime: number;
    late: number;
    absent: number;
  };
}

interface ProfileCardProps {
  profile: MemberProfile;
  variant?: 'default' | 'compact' | 'detailed';
  onEdit?: () => void;
  onDelete?: () => void;
  onMessage?: () => void;
  onClick?: () => void;
  className?: string;
}

export function ModernProfileCard({
  profile,
  variant = 'default',
  onEdit,
  onDelete,
  onMessage,
  onClick,
  className,
}: ProfileCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    'on-leave': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            className
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">{profile.name}</h4>
                  <Badge variant="outline" className={cn('text-xs', statusColors[profile.status])}>
                    {profile.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {profile.position} • {profile.department}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        {/* Header with gradient background */}
        <div className="relative h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onMessage && (
                  <DropdownMenuItem onClick={onMessage}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Profile Info */}
        <CardHeader className="relative -mt-12">
          <div className="flex items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-lg">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{profile.name}</h3>
                {profile.performance === 'excellent' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Award className="h-5 w-5 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Top Performer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.position}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusColors[profile.status]}>
                  {profile.status === 'active' ? (
                    <UserCheck className="mr-1 h-3 w-3" />
                  ) : profile.status === 'on-leave' ? (
                    <Clock className="mr-1 h-3 w-3" />
                  ) : (
                    <UserX className="mr-1 h-3 w-3" />
                  )}
                  {profile.status.replace('-', ' ')}
                </Badge>
                <Badge variant="outline">
                  <Building className="mr-1 h-3 w-3" />
                  {profile.department}
                </Badge>
                {profile.location && (
                  <Badge variant="outline">
                    <MapPin className="mr-1 h-3 w-3" />
                    {profile.location}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-2">
            {profile.email && !profile.email.toLowerCase().endsWith('@dummy.local') && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${profile.email}`}
                  className="text-primary hover:underline"
                >
                  {profile.email}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profile.phone && profile.phone.trim() !== '' ? profile.phone : 'No Phone'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {profile.joinDate}</span>
            </div>
          </div>

          <Separator />

          {/* Attendance Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Attendance Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{profile.attendanceRate}%</span>
                {profile.attendanceRate >= 95 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : profile.attendanceRate >= 80 ? (
                  <Activity className="h-4 w-4 text-amber-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <Progress value={profile.attendanceRate} className="h-2" />
            {profile.stats && (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold">{profile.stats.totalDays}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">On Time</p>
                  <p className="text-sm font-semibold text-green-600">
                    {profile.stats.onTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Late</p>
                  <p className="text-sm font-semibold text-amber-600">
                    {profile.stats.late}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Absent</p>
                  <p className="text-sm font-semibold text-red-600">
                    {profile.stats.absent}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Recent Activity */}
          {profile.recentActivity && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Today's Activity</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Check In</span>
                  </div>
                  <span className="font-mono">
                    {profile.recentActivity.checkIn || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Check Out</span>
                  </div>
                  <span className="font-mono">
                    {profile.recentActivity.checkOut || '-'}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {variant === 'detailed' && (
          <CardFooter className="flex gap-2">
            <Button className="flex-1" onClick={onClick}>
              View Full Profile
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            {onMessage && (
              <Button variant="outline" size="icon" onClick={onMessage}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

// Grid layout for multiple profile cards
export function ProfileCardGrid({
  profiles,
  onProfileClick,
}: {
  profiles: MemberProfile[];
  onProfileClick?: (profile: MemberProfile) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile, index) => (
        <motion.div
          key={profile.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ModernProfileCard
            profile={profile}
            onClick={() => onProfileClick?.(profile)}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Team member list with compact cards
export function TeamMemberList({
  members,
  onMemberClick,
}: {
  members: MemberProfile[];
  onMemberClick?: (member: MemberProfile) => void;
}) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <ModernProfileCard
          key={member.id}
          profile={member}
          variant="compact"
          onClick={() => onMemberClick?.(member)}
        />
      ))}
    </div>
  );
}
