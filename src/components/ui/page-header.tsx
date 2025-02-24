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
        <h1 className="text-3xl font-bold tracking-tight animate-in fade-in duration-300">
          {title}
        </h1>
        <p className="mt-2 max-w-4xl text-base text-muted-foreground animate-in fade-in duration-300 delay-75">
          {description}
        </p>

        {/* Decorative line */}
        <div className="mt-4 flex gap-1">
          <div className="h-0.5 w-12 rounded-full bg-orange-500/60 animate-in fade-in duration-300 delay-150" />
          <div className="h-0.5 w-3 rounded-full bg-orange-300/60 animate-in fade-in duration-300 delay-200" />
          <div className="h-0.5 w-1.5 rounded-full bg-orange-200/60 animate-in fade-in duration-300 delay-250" />
        </div>
      </div>
    </div>
  );
}
