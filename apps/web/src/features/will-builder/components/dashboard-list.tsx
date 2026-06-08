'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Card, CardTitle } from '@/shared/ui/card';
import type { WillSummary } from '@/shared/api/types/wills';

export interface DashboardListProps {
  wills: WillSummary[];
  isLoading: boolean;
}

export function DashboardList({ wills, isLoading }: DashboardListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading wills…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your wills</h1>
        <Link href="/wills/new">
          <Button>Create will</Button>
        </Link>
      </div>
      {wills.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">No wills yet. Create your first will to get started.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {wills.map((will) => (
            <li key={will.id}>
              <Link href={`/wills/${will.id}/chat`}>
                <Card className="transition hover:border-primary">
                  <CardTitle className="text-base">{will.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {will.status}
                  </p>
                  {will.testatorName && (
                    <p className="mt-1 text-sm">{will.testatorName}</p>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
