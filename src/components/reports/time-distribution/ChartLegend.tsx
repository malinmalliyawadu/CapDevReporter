import { Badge } from "@/components/ui/badge";

interface ChartLegendProps {
  items: Array<{
    name: string;
    value: number;
    color: string;
    percentage: number;
    capDevHours?: number;
  }>;
  total: number;
}

export function ChartLegend({ items, total }: ChartLegendProps) {
  return (
    <div className="mt-4 space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium flex items-center gap-2">
              {item.name}
              {item.capDevHours && item.capDevHours > 0 ? (
                <Badge
                  variant="secondary"
                  className="bg-sky-100 text-sky-700 hover:bg-sky-100"
                >
                  CapDev
                </Badge>
              ) : null}
            </span>
          </div>
          <div className="text-right">
            <span className="font-medium">
              {item.percentage < 0.1 ? "<0.1" : item.percentage.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground ml-2">
              ({item.value < 0.1 ? "<0.1" : item.value.toFixed(1)} hours)
            </span>
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center border-t pt-2 mt-3">
        <span className="text-sm font-semibold">Total</span>
        <span className="font-semibold">
          {total < 0.1 ? "<0.1" : total.toFixed(1)} hours
        </span>
      </div>
    </div>
  );
}
