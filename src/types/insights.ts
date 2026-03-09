export type FilterTab = "members" | "teams"

export interface PickerItem {
  id: string
  name: string
}

export interface SelectedFilter {
  type: "members" | "teams"
  all: boolean
  id?: string
}

export interface DateRange {
  startDate: Date
  endDate: Date
}
