"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("inline-flex", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  isDisabled?: boolean
  size?: "default" | "sm" | "lg" | "icon"
} & React.ComponentProps<"button">

const PaginationLink = ({
  className,
  isActive,
  isDisabled,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <button
    aria-current={isActive ? "page" : undefined}
    disabled={isDisabled}
    className={cn(
      buttonVariants({
        variant: isActive ? "default" : "outline",
        size: size === "icon" ? "sm" : size,
      }),
      "h-9 w-9 p-0 text-sm font-medium transition-all duration-200",
      "flex items-center justify-center shrink-0",
      isActive && "pointer-events-none",
      isDisabled && "pointer-events-none opacity-50",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="icon" className={className} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="icon" className={className} {...props}>
    <ChevronRight className="h-4 w-4" />
    <span className="sr-only">Next</span>
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-md",
      "border border-border bg-background text-muted-foreground",
      className
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export type PaginationFooterProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  from: number
  to: number
  total: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  const delta = 1
  const range: number[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      range.push(i)
    }
  }

  const rangeWithDots: (number | "...")[] = []
  let prev: number | undefined

  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) {
        rangeWithDots.push(prev + 1)
      } else if (i - prev !== 1) {
        rangeWithDots.push("...")
      }
    }
    rangeWithDots.push(i)
    prev = i
  }

  return rangeWithDots
}

export function PaginationFooter({
  page,
  totalPages,
  onPageChange,
  isLoading = false,
  from,
  to,
  total,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationFooterProps) {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const pages = getPageNumbers(page, safeTotalPages)

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4">
      <div className={cn(
        "flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4", 
        "text-sm text-muted-foreground w-full lg:w-auto"
      )}>
        <span>
          Showing{" "}
          <span className="font-medium text-foreground">{from}–{to}</span>
          {" "}of{" "}
          <span className="font-medium text-foreground">{total.toLocaleString()}</span>
          {" "}data
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs whitespace-nowrap">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-[70px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanan: page buttons — pakai primitives di atas */}
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              isDisabled={page <= 1 || isLoading}
            />
          </PaginationItem>

          {pages.map((p, idx) =>
            p === "..." ? (
              <PaginationItem key={`dots-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  isDisabled={isLoading}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              isDisabled={page >= safeTotalPages || isLoading}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

// ─── Named exports untuk penggunaan standalone ────────────────────────────────

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}