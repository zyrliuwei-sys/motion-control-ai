import { and, desc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { backlink, type NewBacklink } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

export async function list(params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const where = params.search
    ? or(
        like(backlink.siteName, `%${params.search}%`),
        like(backlink.targetUrl, `%${params.search}%`)
      )
    : undefined;
  const [items, count] = await Promise.all([
    db()
      .select()
      .from(backlink)
      .where(where)
      .orderBy(desc(backlink.createdAt))
      .limit(params.pageSize)
      .offset(offset),
    db()
      .select({ count: sql<number>`count(*)` })
      .from(backlink)
      .where(where),
  ]);
  return { items, total: Number(count[0]?.count ?? 0) };
}

export async function create(
  data: Omit<NewBacklink, 'id' | 'createdAt' | 'updatedAt'>
) {
  const [result] = await db()
    .insert(backlink)
    .values({ id: getUuid(), ...data })
    .returning();
  return result;
}

export async function update(id: string, data: Partial<NewBacklink>) {
  const [result] = await db()
    .update(backlink)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(backlink.id, id))
    .returning();
  return result;
}

export async function remove(id: string) {
  await db().delete(backlink).where(eq(backlink.id, id));
}

export async function listEnabled(placement?: string) {
  return db()
    .select()
    .from(backlink)
    .where(
      and(
        eq(backlink.enabled, true),
        eq(backlink.status, 'approved'),
        placement ? eq(backlink.placement, placement) : undefined
      )
    );
}
