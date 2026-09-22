import * as crypto from 'crypto';

import { getAllConfigs } from '@/modules/config/service';
import { hasRestrictedPromptContent } from '@/lib/prompt-policy';
import { assertTextAllowed, getSeeApiKey } from '@/lib/seeapi-moderation';

const WAFFO_API_URL = 'https://api.waffo.ai';
const SCAN_PROMPT_PATH = '/v1/actions/verification/scan-prompt';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 15_000;

export class PromptScreeningError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'PromptScreeningError';
  }
}

function normalizePrivateKey(value: string): string {
  const pem = value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
  if (pem.includes('-----BEGIN')) return pem;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(pem)) {
    throw new Error('Invalid Waffo private key');
  }

  const base64 = pem.replace(/\s+/g, '');
  const wrapped = base64.match(/.{1,64}/g)?.join('\n');
  if (!wrapped) throw new Error('Empty Waffo private key');
  return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----`;
}

function screeningLocale(acceptLanguage: string | null): 'en' | 'zh' | 'ja' {
  const language = acceptLanguage?.toLowerCase() ?? '';
  if (language.includes('zh')) return 'zh';
  if (language.includes('ja')) return 'ja';
  return 'en';
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Screen a generation prompt before it is persisted, billed, or sent to a
 * generation provider. SeeAPI's sexual-content check runs before Waffo and
 * before any input media moderation, so a flagged prompt short-circuits the
 * rest of the request.
 */
export async function screenGenerationPrompt(
  prompt: string,
  acceptLanguage: string | null
): Promise<void> {
  if (!prompt.trim() || prompt.length > 10_000) {
    throw new PromptScreeningError(
      'Please enter a prompt between 1 and 10,000 characters.',
      400
    );
  }

  if (hasRestrictedPromptContent(prompt)) {
    throw new PromptScreeningError(
      'This prompt cannot be used under our content rules. Please revise your prompt and try again.',
      400
    );
  }

  await assertTextAllowed({
    apiKey: getSeeApiKey(),
    text: prompt,
  });

  const configs = await getAllConfigs();

  const merchantId = configs.waffo_merchant_id?.trim();
  const privateKey = configs.waffo_private_key?.trim();
  if (!merchantId || !privateKey) {
    throw new PromptScreeningError(
      'Prompt review is temporarily unavailable. Please try again later.',
      503
    );
  }

  const payload = {
    prompt,
    locale: screeningLocale(acceptLanguage),
    semantic: 'enforce',
  };
  const body = JSON.stringify(payload);

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const bodyHash = crypto
        .createHash('sha256')
        .update(body)
        .digest('base64');
      const canonical = `POST\n${SCAN_PROMPT_PATH}\n${timestamp}\n${bodyHash}`;
      const signature = crypto
        .sign(
          'RSA-SHA256',
          Buffer.from(canonical),
          normalizePrivateKey(privateKey)
        )
        .toString('base64');

      let response: Response;
      try {
        response = await fetch(`${WAFFO_API_URL}${SCAN_PROMPT_PATH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': merchantId,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
          },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch {
        if (attempt < MAX_ATTEMPTS - 1) {
          await wait(5_000 * 2 ** attempt);
          continue;
        }
        throw new PromptScreeningError(
          'Prompt review is temporarily unavailable. Please try again later.',
          503
        );
      }

      if (response.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
        await wait(5_000 * 2 ** attempt);
        continue;
      }

      if (!response.ok) {
        console.error('[prompt-safety] Waffo screening request failed', {
          status: response.status,
        });
        throw new PromptScreeningError(
          'Prompt review is temporarily unavailable. Please try again later.',
          response.status >= 500 ? 503 : 502
        );
      }

      const result = (await response.json().catch(() => null)) as {
        data?: { action?: unknown; reasonCode?: unknown; requestId?: unknown };
      } | null;
      const verdict = result?.data;
      if (verdict?.action === 'allow') return;

      const reasonCode =
        typeof verdict?.reasonCode === 'string'
          ? verdict.reasonCode
          : 'unknown';
      console.info('[prompt-safety] Waffo screening did not allow generation', {
        action:
          typeof verdict?.action === 'string' ? verdict.action : 'invalid',
        reasonCode,
        requestId:
          typeof verdict?.requestId === 'string'
            ? verdict.requestId
            : undefined,
      });

      if (verdict?.action === 'block') {
        throw new PromptScreeningError(
          'This prompt cannot be used under our content rules. Please revise it and try again.',
          400
        );
      }

      throw new PromptScreeningError(
        'Prompt review did not approve this request. Please edit your prompt or try again later.',
        409
      );
    }
  } catch (error) {
    if (error instanceof PromptScreeningError) throw error;
    console.error('[prompt-safety] Waffo screening could not be completed');
    throw new PromptScreeningError(
      'Prompt review is temporarily unavailable. Please try again later.',
      503
    );
  }
}
