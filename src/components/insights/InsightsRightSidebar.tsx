"use client"
import { useState, useMemo } from "react"
import { ChevronRight } from "lucide-react"
import { SearchBar } from "@/components/customs/search-bar"
import type { Member, Team } from "@/lib/data/dummy-data"
import type { SelectedFilter } from "@/components/insights/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  members?: Member[]
  teams?: Team[]
  selectedFilter?: SelectedFilter
  onSelectedFilterChange?: (filter: SelectedFilter) => void
}

import { useEffect } from "react"

export function InsightsRightSidebar({ open, onOpenChange, members, teams, selectedFilter, onSelectedFilterChange }: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onOpenChange])
  const [teamsOpen, setTeamsOpen] = useState(true)
  const [membersOpen, setMembersOpen] = useState(true)
  const [memberQuery, setMemberQuery] = useState("")
  const [teamQuery, setTeamQuery] = useState("")

  const filteredMembers = useMemo(
    () => (members ?? []).filter(m => m.name.toLowerCase().includes(memberQuery.toLowerCase())),
    [members, memberQuery]
  )

  const filteredTeams = useMemo(
    () => (teams ?? []).filter(t => t.name.toLowerCase().includes(teamQuery.toLowerCase())),
    [teams, teamQuery]
  )

  const activeMemberId = selectedFilter?.type === "members" && !selectedFilter.all ? selectedFilter.id : undefined
  const activeTeamId = selectedFilter?.type === "teams" && !selectedFilter.all ? selectedFilter.id : undefined

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-50 lg:relative lg:inset-auto bg-white border-l border-gray-200 
        transition-[width,transform] duration-300 ease-in-out 
        ${open ? "w-80 translate-x-0" : "w-0 lg:w-10 translate-x-full lg:translate-x-0"}
      `}>
        {open ? (
          <aside className="p-6 h-full flex flex-col">
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {/* Teams */}
              <div className="border border-gray-200 rounded-md bg-white">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => setTeamsOpen(o => !o)}
                  aria-expanded={teamsOpen}
                  aria-controls="teams-section"
                >
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Teams</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${teamsOpen ? "rotate-90" : ""}`} />
                </button>
                {teamsOpen && (
                  <div id="teams-section" className="px-4 py-4 space-y-3">
                    <SearchBar
                      placeholder="Search teams"
                      initialQuery={teamQuery}
                      onSearch={setTeamQuery}
                    />

                    {filteredTeams.length > 0 ? (
                      <ul className="space-y-1">
                        {filteredTeams.map(t => {
                          const active = activeTeamId === t.id
                          return (
                            <li key={t.id}>
                              <button
                                className={`w-full flex items-center justify-between px-2 py-2 rounded ${active ? "bg-zinc-100 text-zinc-900" : "hover:bg-gray-50"}`}
                                onClick={() => onSelectedFilterChange?.({ type: "teams", all: false, id: t.id })}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                    {t.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-sm truncate">{t.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{t.members.length} members</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">No teams found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="border border-gray-200 rounded-md bg-white">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => setMembersOpen(o => !o)}
                  aria-expanded={membersOpen}
                  aria-controls="members-section"
                >
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Members</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${membersOpen ? "rotate-90" : ""}`} />
                </button>
                {membersOpen && (
                  <div id="members-section" className="px-4 py-4 space-y-3">
                    <SearchBar
                      placeholder="Search members"
                      initialQuery={memberQuery}
                      onSearch={setMemberQuery}
                    />

                    {filteredMembers.length > 0 ? (
                      <ul className="space-y-1">
                        {filteredMembers.map(m => {
                          const initials = m.name.split(" ").map(s => s[0]).slice(0, 2).join("")
                          const active = activeMemberId === m.id
                          return (
                            <li key={m.id}>
                              <button
                                className={`w-full flex items-center justify-between px-2 py-2 rounded ${active ? "bg-zinc-100 text-zinc-900" : "hover:bg-gray-50"}`}
                                onClick={() => onSelectedFilterChange?.({ type: "members", all: false, id: m.id })}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                    {initials}
                                  </div>
                                  <span className="text-sm truncate">{m.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{m.activityScore}%</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-600">No members to display</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        ) : (
          <div className="h-full hidden lg:flex items-start pt-6 justify-center">
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={() => onOpenChange(true)}
              aria-label="Show sidebar"
              title="Show sidebar"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
