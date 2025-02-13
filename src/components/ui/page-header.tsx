interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight animate-slide-down">
        {title}
      </h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
