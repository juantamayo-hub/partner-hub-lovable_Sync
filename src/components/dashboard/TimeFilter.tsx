import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimePeriod = "diario" | "semanal" | "mensual" | "anual";

interface TimeFilterProps {
    value: TimePeriod;
    onChange: (value: TimePeriod) => void;
}

const periods: { value: TimePeriod; label: string }[] = [
    { value: "diario", label: "Diario" },
    { value: "semanal", label: "Semanal" },
    { value: "mensual", label: "Mensual" },
    { value: "anual", label: "Anual" },
];

export function TimeFilter({ value, onChange }: TimeFilterProps) {
    return (
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
            {periods.map((period) => (
                <Button
                    key={period.value}
                    variant={value === period.value ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                        "h-8 px-3 text-xs font-medium transition-all",
                        value === period.value ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-white/50"
                    )}
                    onClick={() => onChange(period.value)}
                >
                    {period.label}
                </Button>
            ))}
        </div>
    );
}
