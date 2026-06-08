'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardTitle } from '@/shared/ui/card';

export interface CreateWillFormProps {
  onSubmit: (data: { title: string; testatorName?: string }) => void;
  isLoading: boolean;
  error?: string;
}

export function CreateWillForm({ onSubmit, isLoading, error }: CreateWillFormProps) {
  const [title, setTitle] = useState('My Last Will and Testament');
  const [testatorName, setTestatorName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      testatorName: testatorName || undefined,
    });
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardTitle className="mb-4">Create a new will</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Testator name (optional)</label>
          <Input value={testatorName} onChange={(e) => setTestatorName(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create will'}
        </Button>
      </form>
    </Card>
  );
}
