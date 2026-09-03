import { CATEGORY_LABEL, CATEGORY_ORDER, type Category, type Drawing } from "@/data/drawings";
import { cn } from "@/lib/utils";

export type Filter = Category | "all";

interface CategoryTabsProps {
  drawings: Drawing[];
  value: Filter;
  onChange: (value: Filter) => void;
}

export function CategoryTabs({ drawings, value, onChange }: CategoryTabsProps) {
  const groups = CATEGORY_ORDER.map((category) => ({
    key: category,
    label: CATEGORY_LABEL[category],
    count: drawings.filter((drawing) => drawing.category === category).length,
  })).filter((group) => group.count > 0);

  // A lone group is just a label for the whole set — not a choice worth making.
  if (groups.length < 2) return null;

  const options: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Összes", count: drawings.length },
    ...groups,
  ];

  return (
    <div className="rail -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={cn(
              "label-caps shrink-0 border px-3.5 py-2 transition-colors duration-200",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {option.label}
            <span className={cn("ml-2 tabular-nums", active ? "text-white/60" : "text-primary/70")}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
