import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  type PageResult,
} from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Backlink = {
  id: string;
  siteName: string;
  targetUrl: string;
  displayText: string;
  imageUrl: string | null;
  placement: string;
  rel: string;
  status: string;
  enabled: boolean;
  notes: string | null;
};
const empty = {
  siteName: '',
  targetUrl: '',
  displayText: '',
  imageUrl: '',
  placement: 'footer',
  rel: 'nofollow',
  status: 'pending',
  enabled: false,
  notes: '',
};

function BacklinksPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['admin-backlinks'],
    queryFn: () =>
      apiGet<PageResult<Backlink>>('/api/admin/backlinks?page=1&pageSize=100'),
  });
  const save = useMutation({
    mutationFn: () =>
      editing
        ? apiPut('/api/admin/backlinks', { id: editing, ...form })
        : apiPost('/api/admin/backlinks', form),
    onSuccess: () => {
      toast.success(m['admin.backlinks.saved']());
      setForm(empty);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-backlinks'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/backlinks?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-backlinks'] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (key: keyof typeof empty, value: string | boolean) =>
    setForm((v) => ({ ...v, [key]: value }));
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {m['admin.backlinks.title']()}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {m['admin.backlinks.description']()}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {editing ? m['admin.backlinks.edit']() : m['admin.backlinks.add']()}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(
            [
              'siteName',
              'targetUrl',
              'displayText',
              'imageUrl',
              'placement',
              'notes',
            ] as const
          ).map((key) => (
            <Input
              key={key}
              placeholder={m[`admin.backlinks.field_${key}`]()}
              value={form[key] as string}
              onChange={(e) => set(key, e.target.value)}
            />
          ))}
          <select
            className="bg-background h-9 rounded-md border px-3 text-sm"
            value={form.rel}
            onChange={(e) => set('rel', e.target.value)}
          >
            <option value="nofollow">nofollow</option>
            <option value="sponsored">sponsored</option>
          </select>
          <select
            className="bg-background h-9 rounded-md border px-3 text-sm"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="pending">pending</option>
            <option value="approved">approved</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
            />{' '}
            {m['admin.backlinks.enabled']()}
          </label>
          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {m['admin.backlinks.save']()}
            </Button>
            {editing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                {m['common.cancel']()}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2 pt-6">
          {query.data?.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium">
                  {item.siteName}{' '}
                  <Badge
                    variant={
                      item.enabled && item.status === 'approved'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-sm">
                  {item.displayText} · {item.targetUrl}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(item.id);
                    setForm({
                      siteName: item.siteName,
                      targetUrl: item.targetUrl,
                      displayText: item.displayText,
                      imageUrl: item.imageUrl || '',
                      placement: item.placement,
                      rel: item.rel,
                      status: item.status,
                      enabled: item.enabled,
                      notes: item.notes || '',
                    });
                  }}
                >
                  {m['admin.backlinks.edit']()}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!query.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {m['admin.backlinks.empty']()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export const Route = createFileRoute('/admin/backlinks')({
  component: BacklinksPage,
});
