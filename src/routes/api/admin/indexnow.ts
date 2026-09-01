import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { envConfigs } from '@/config';
import { getConfig } from '@/modules/config/service';
import {
  getPublicIndexNowUrls,
  submitIndexNowUrls,
} from '@/modules/indexnow/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const canManageSettings = await hasPermission(
      session.user.id,
      'admin.settings.write'
    );
    if (!canManageSettings) return respErr('Forbidden');

    const [key, configuredAppUrl] = await Promise.all([
      getConfig('indexnow_key'),
      getConfig('app_url'),
    ]);
    if (!key) return respErr('IndexNow key is not configured');

    const appUrl = configuredAppUrl || envConfigs.app_url;
    const result = await submitIndexNowUrls({
      siteUrl: appUrl,
      key,
      urls: getPublicIndexNowUrls(appUrl),
    });
    return respData(result);
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'IndexNow submission failed'
    );
  }
}

export const Route = createFileRoute('/api/admin/indexnow')({
  server: { handlers: { POST } },
});
