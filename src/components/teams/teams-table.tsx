"use client"

import React from "react"
import { ITeams } from "@/interface"
import { Button } from "@/components/ui/button"
import { Pencil, Trash } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Helper slug untuk URL
function getTeamSlug(team: ITeams): string {
  return encodeURIComponent(team.code ?? String(team.id))
}

interface TeamsTableProps {
  data: ITeams[]
  isLoading?: boolean
  organizationId: string | number | null | undefined
  onEdit?: (team: ITeams) => void
  onDelete?: (team: ITeams) => void
}

export function TeamsTable({ data, isLoading = false, onEdit, onDelete }: TeamsTableProps) {
  return (
    <div className="w-full space-y-4">
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-xs propercase tracking-wide py-3 px-4">Code</TableHead>
              <TableHead className="font-semibold text-xs propercase tracking-wide">Name</TableHead>
              <TableHead className="font-semibold text-xs propercase tracking-wide">Description</TableHead>
              <TableHead className="font-semibold text-xs propercase tracking-wide">Status</TableHead>
              <TableHead className="w-20 text-right pr-6 font-semibold text-xs propercase tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-sm">
                  Loading teams...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground py-6">
                  No teams found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((team) => {
                const slug = getTeamSlug(team)
                
                return (
                  <TableRow key={team.id}>
                    <TableCell className="px-4 py-3">
                      <Link href={`/teams/${slug}`} className="hover:underline font-mono text-primary text-sm">
                        {team.code || "-"}
                      </Link>
                    </TableCell>
                    
                    <TableCell className="py-3">
                      <Link 
                        href={`/teams/${slug}`} 
                        className="font-medium text-sm block truncate max-w-[200px] hover:underline hover:text-primary transition-all decoration-primary/50 underline-offset-4"
                      >
                        {team.name}
                      </Link>
                    </TableCell>
                    
                    <TableCell className="text-sm text-muted-foreground">
                      {team.description || <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          team.is_active
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                        )}
                      >
                        {team.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="px-4 pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit?.(team)}
                          title="Edit team"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/50"
                          onClick={() => onDelete?.(team)}
                          title="Delete team"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}