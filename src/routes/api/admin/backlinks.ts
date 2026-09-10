import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import * as service from '@/modules/backlinks/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr, respOk, respPage } from '@/lib/resp';

async function checkAdmin(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user || !(await hasPermission(session.user.id, 'admin.*')))
    throw new Error('Forbidden');
  return session;
}

function validUrl(value: unknown) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

async function GET({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const u = new URL(request.url);
    const result = await service.list({
      page: Math.max(1, Number(u.searchParams.get('page') || 1)),
      pageSize: Math.min(
        100,
        Math.max(1, Number(u.searchParams.get('pageSize') || 20))
      ),
      search: u.searchParams.get('search') || undefined,
    });
    return respPage(result.items, result.total);
  } catch (e: any) {
    return respErr(e.message || 'Internal error');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    const session = await checkAdmin(request);
    const body = await request.json();
    if (
      !body.siteName ||
      !body.displayText ||
      !validUrl(body.targetUrl) ||
      (body.imageUrl && !validUrl(body.imageUrl))
    )
      return respErr('Invalid backlink fields');
    return respData(
      await service.create({
        siteName: body.siteName,
        targetUrl: body.targetUrl,
        displayText: body.displayText,
        imageUrl: body.imageUrl || null,
        placement: body.placement || 'footer',
        rel: body.rel === 'sponsored' ? 'sponsored' : 'nofollow',
        status: body.status === 'approved' ? 'approved' : 'pending',
        enabled: Boolean(body.enabled),
        notes: body.notes || '',
        createdBy: session.user.id,
      })
    );
  } catch (e: any) {
    return respErr(e.message || 'Internal error');
  }
}

async function PUT({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const body = await request.json();
    if (
      !body.id ||
      !validUrl(body.targetUrl) ||
      (body.imageUrl && !validUrl(body.imageUrl))
    )
      return respErr('Invalid backlink fields');
    return respData(
      await service.update(body.id, {
        siteName: body.siteName,
        targetUrl: body.targetUrl,
        displayText: body.displayText,
        imageUrl: body.imageUrl || null,
        placement: body.placement || 'footer',
        rel: body.rel === 'sponsored' ? 'sponsored' : 'nofollow',
        status: body.status === 'approved' ? 'approved' : 'pending',
        enabled: Boolean(body.enabled),
        notes: body.notes || '',
      })
    );
  } catch (e: any) {
    return respErr(e.message || 'Internal error');
  }
}

async function DELETE({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return respErr('ID is required');
    await service.remove(id);
    return respOk();
  } catch (e: any) {
    return respErr(e.message || 'Internal error');
  }
}
export const Route = createFileRoute('/api/admin/backlinks')({
  server: { handlers: { GET, POST, PUT, DELETE } },
});
