'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/profile&image/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBar } from '@/components/toolbar/search-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Pencil,
  Trash,
  Filter,
  Grid3x3,
  List,
  Users,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { IOrganization_member } from '@/interface';

interface MemberGridCardsProps {
  members: IOrganization_member[];
  onView?: (member: IOrganization_member) => void;
  onEdit?: (member: IOrganization_member) => void;
  onDelete?: (member: IOrganization_member) => void;
}

export function MemberGridCards({ members, onView, onEdit, onDelete }: MemberGridCardsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  // Get unique departments
  const departments = Array.from(
    new Set(members.map((m: any) => m.groupName || m.departments?.name).filter(Boolean))
  );

  // Filter members
  const filteredMembers = members.filter((member: any) => {
    const user = member.user;

    // Get name from user_profiles
    const fullName = user
      ? [user.first_name, user.user.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      : '';

    // Get email from user_profiles
    const email = (user?.email || '').toLowerCase();

    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && member.is_active) ||
      (filterStatus === 'inactive' && !member.is_active);

    const memberDept = member.groupName || member.departments?.name;
    const matchesDepartment = filterDepartment === 'all' || memberDept === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate member stats (mock data - replace with real data)
  const getMemberStats = (_member: IOrganization_member) => {
    return {
      attendance: Math.floor(Math.random() * 30) + 70, // 70-100%
      hoursThisMonth: Math.floor(Math.random() * 80) + 120, // 120-200 hours
      lateCount: Math.floor(Math.random() * 5), // 0-5 late
      present: Math.floor(Math.random() * 20) + 10, // 10-30 present
    };
  };

  const MemberCard = ({ member }: { member: IOrganization_member }) => {
    const user = (member as any).user;
    const fullName = user
      ? [user.first_name, user.user.last_name]
        .filter(Boolean)
        .join(' ') || user.display_name || (user.email && !user.email.toLowerCase().endsWith('@dummy.local') ? user.email : null)
      : 'No Name';

    const stats = getMemberStats(member);
    const department = (member as any).groupName || member.departments?.name || 'No Department';
    const position = member.positions?.title || 'No Position';
    const role = (member as any).role;
    const isAdmin = role?.code === 'A001';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-none shadow-lg hover:shadow-xl transition-all overflow-hidden group">
          {/* Header with gradient */}
          <div className="h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onView?.(member)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(member)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Member
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(member)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CardContent className="pt-0 pb-6 px-6 -mt-12 relative">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={user?.profile_photo_url || undefined} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name & Status */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-bold">{fullName}</h3>
                <p className="text-sm text-muted-foreground">{position}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-xs">
                    {member.is_active ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" />Active</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                    )}
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />Admin
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="w-full mt-4 space-y-2">
                {user?.email && !user.email.toLowerCase().endsWith('@dummy.local') && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{user?.phone && user.phone.trim() !== '' ? user.phone : 'No Phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{department}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="w-full mt-4 pt-4 border-t grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-700">{stats.attendance}%</div>
                  <div className="text-xs text-muted-foreground">Attendance</div>
                </div>
                <div className="text-center border-x">
                  <div className="text-xl font-bold text-slate-700">{stats.present}</div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">{stats.lateCount}</div>
                  <div className="text-xs text-muted-foreground">Late</div>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onView?.(member)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit?.(member)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <SearchBar
            placeholder="Search members by name or email..."
            initialQuery={searchQuery}
            onSearch={setSearchQuery}
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredMembers.length}</span> of{' '}
          <span className="font-semibold text-foreground">{members.length}</span> members
        </p>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        /* List View - TODO: Implement list view */
        <div className="text-center text-muted-foreground py-12">
          List view coming soon...
        </div>
      )}

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No members found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </motion.div>
      )}
    </div>
  );
}
