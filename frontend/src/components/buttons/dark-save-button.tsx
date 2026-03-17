import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface DarkSaveButtonProps extends React.ComponentProps<typeof Button> {
  label?: string;
}

export function DarkSaveButton({
  label = "Save",
  className,
  ...props
}: DarkSaveButtonProps) {
  return (
    <Button
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-[#E2E8F0]",
        "bg-[#1E3A8A] border border-[#2A3F96]",
        "hover:bg-[#1D4ED8]",
        "active:bg-[#1E40AF]",
        "focus-visible:ring-2 focus-visible:ring-blue-700/50 focus-visible:ring-offset-0",
        className,
      )}
      {...props}
    >
      <Save className="h-4 w-4" />
      {label}
    </Button>
  );
}


