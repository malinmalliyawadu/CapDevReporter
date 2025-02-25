interface ChartTooltipProps {
  children: React.ReactNode;
}

export function ChartTooltip({ children }: ChartTooltipProps) {
  return (
    <div
      className="text-white"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {children}
    </div>
  );
}
