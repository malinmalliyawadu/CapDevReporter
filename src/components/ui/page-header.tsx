interface PageHeaderProps {
  title: React.ReactNode;
  description: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={`relative pb-8 ${className}`}>
      {/* Content */}
      <div className="relative">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-4xl text-base text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
