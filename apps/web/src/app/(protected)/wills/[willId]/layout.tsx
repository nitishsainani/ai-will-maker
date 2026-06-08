import Link from 'next/link';

export default async function WillWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ willId: string }>;
}) {
  const { willId } = await params;
  const base = `/wills/${willId}`;

  const tabs = [
    { href: `${base}/chat`, label: 'Chat' },
    { href: `${base}/builder`, label: 'Builder' },
    { href: `${base}/preview`, label: 'Preview' },
    { href: `${base}/validation`, label: 'Validation' },
  ];

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
