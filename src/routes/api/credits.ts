import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  getBalance,
  getHistory,
  hasPaidCredits,
} from '@/modules/credits/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const [balance, history, hasPaidCreditsResult] = await Promise.all([
      getBalance(session.user.id),
      getHistory(session.user.id),
      hasPaidCredits(session.user.id),
    ]);

    return respData({
      balance,
      history,
      hasPaidCredits: hasPaidCreditsResult,
    });
  } catch (error: any) {
    return respErr(error.message || 'Failed to get credits');
  }
}

export const Route = createFileRoute('/api/credits')({
  server: {
    handlers: { GET },
  },
});
