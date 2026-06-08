'use client';

import { Card, CardTitle } from '@/shared/ui/card';
import type { ValidationIssue, ValidationReport } from '@/shared/api/types/validation';

function IssueList({
  title,
  issues,
  variant,
}: {
  title: string;
  issues: ValidationIssue[];
  variant: 'completion' | 'error' | 'warning';
}) {
  if (issues.length === 0) return null;

  const color =
    variant === 'error'
      ? 'text-destructive'
      : variant === 'warning'
        ? 'text-amber-700'
        : 'text-muted-foreground';

  return (
    <div className="mb-4">
      <h4 className={`mb-2 text-sm font-medium ${color}`}>{title}</h4>
      <ul className="space-y-2">
        {issues.map((issue, i) => (
          <li key={`${issue.code}-${i}`} className="rounded border border-border px-3 py-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>
            <p>{issue.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ValidationPanelProps {
  report?: ValidationReport;
  isLoading: boolean;
}

export function ValidationPanel({ report, isLoading }: ValidationPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Checking validation…</p>;
  }

  if (!report) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle>Validation</CardTitle>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            report.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {report.isValid ? 'Valid' : 'Issues found'}
        </span>
      </div>
      <IssueList title="Completion" issues={report.completionIssues} variant="completion" />
      <IssueList title="Errors" issues={report.errors} variant="error" />
      <IssueList title="Warnings" issues={report.warnings} variant="warning" />
    </Card>
  );
}
