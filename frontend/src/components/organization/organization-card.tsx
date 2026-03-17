import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Organization } from "@/lib/types/organization"

interface OrganizationCardProps {
  organization: Organization
  onSelect: (org: Organization) => void
}

export function OrganizationCard({ organization, onSelect }: OrganizationCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{organization.name}</CardTitle>
            <CardDescription>{organization.code}</CardDescription>
          </div>
          <Badge variant="outline">{organization.country_code}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{organization.timezone}</p>
        <Button
          className="w-full cursor-pointer hover:shadow-lg"
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(organization)
          }}
        >
          Select
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

