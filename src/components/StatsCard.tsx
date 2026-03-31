import { memo } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "accent" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card border border-border/40",
  primary: "gradient-primary text-primary-foreground",
  accent: "gradient-brand text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-foreground/15 text-primary-foreground",
  accent: "bg-accent-foreground/15 text-accent-foreground",
  success: "bg-success-foreground/15 text-success-foreground",
  warning: "bg-warning-foreground/15 text-warning-foreground",
};

export const StatsCard = memo(function StatsCard({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <div className={cn(
      "rounded-2xl p-5 shadow-card transition-all duration-200 hover:shadow-card-hover animate-fade-in",
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-medium", variant === "default" ? "text-muted-foreground" : "opacity-85")}>
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", variant === "default" ? "text-muted-foreground" : "opacity-75")}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn("rounded-xl p-3", iconVariantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
});
