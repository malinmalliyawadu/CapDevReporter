interface ChartTooltipProps {
  children: React.ReactNode;
}

export function ChartTooltip({ children }: ChartTooltipProps) {
  return (
    <div
      className="text-white"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
      }}
    >
      {children}
    </div>
  );
}
