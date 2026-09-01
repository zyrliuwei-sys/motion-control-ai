import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { authClient, signIn, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { resolveAfterAuthUrl, safeInternalPath } from '@/lib/redirect';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import {
  AuthDivider,
  authInputClass,
  authLabelClass,
  AuthSocialButtons,
} from './-auth-ui';

const signInSchema = z.object({
  email: z.string().email(m['common.sign.email_placeholder']()),
  password: z.string().min(1),
});

function SignInPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  // Set right before we navigate so the already-signed-in effect doesn't also fire.
  const navigatingRef = useRef(false);
  const [error, setError] = useState('');

  // callbackUrl: internal page path, goes there directly after login.
  // redirect: either an internal path (same thing) or an app protocol URL like
  // `myapp://auth/callback`, which detours through /auth-callback for a token.
  const [redirectParam, setRedirectParam] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectParam(params.get('redirect'));
    setCallbackUrl(params.get('callbackUrl'));
  }, []);

  // Already signed in (visited /sign-in directly, or a stale callbackUrl looped
  // back here) → go to the admin console. The auth pages never gate themselves,
  // so this can't loop.
  useEffect(() => {
    if (sessionPending || navigatingRef.current) return;
    if (session?.user) {
      navigatingRef.current = true;
      router.push('/admin');
    }
  }, [sessionPending, session?.user, router]);

  // Allow only same-site relative paths, and never an auth page (would loop).
  const safeCallbackUrl = safeInternalPath(callbackUrl);

  const afterLoginUrl = resolveAfterAuthUrl({
    redirect: redirectParam,
    callbackUrl,
    fallback: '/admin',
  });

  // Carry callbackUrl/redirect across to sign-up so the destination survives the switch.
  const switchQuery = (() => {
    const p = new URLSearchParams();
    if (safeCallbackUrl) p.set('callbackUrl', safeCallbackUrl);
    if (redirectParam) p.set('redirect', redirectParam);
    const s = p.toString();
    return s ? `?${s}` : '';
  })();

  const configQuery = usePublicConfig();
  const configs = configQuery.data ?? {};

  const configsLoaded = configQuery.isSuccess;
  const emailEnabled = configs.email_auth_enabled !== 'false';
  const googleEnabled = configs.google_auth_enabled === 'true';
  const githubEnabled = configs.github_auth_enabled === 'true';
  const passwordResetEnabled = configs.password_reset_enabled === 'true';
  const hasSocial = googleEnabled || githubEnabled;
  const hasAnyMethod = emailEnabled || hasSocial;

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const result: any = await signIn.email({
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          const status = result.error.status;
          const code = result.error.code;
          const msg = result.error.message || '';
          if (
            code === 'EMAIL_NOT_VERIFIED' ||
            (status === 403 && /not verified/i.test(msg))
          ) {
            const verifyPath = `/verify-email?sent=1&email=${encodeURIComponent(
              value.email
            )}&callbackUrl=${encodeURIComponent(afterLoginUrl)}`;
            void authClient.sendVerificationEmail({
              email: value.email,
              callbackURL: localizeHref(afterLoginUrl),
            });
            router.push(verifyPath);
            return;
          }
          setError(msg || 'Sign in failed');
        } else {
          // Hard navigation so the destination reloads with a fresh session
          // cookie — a client push would let the guard read a stale (logged-out)
          // session store and bounce straight back to /sign-in.
          navigatingRef.current = true;
          window.location.assign(localizeHref(afterLoginUrl));
        }
      } catch (err: any) {
        setError(err.message || 'Sign in failed');
      }
    },
  });

  async function handleSocial(provider: 'google' | 'github') {
    await signIn.social({ provider, callbackURL: afterLoginUrl });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-50">
      <div className="flex w-full max-w-sm flex-col">
        <Link href="/" className="self-center font-serif text-lg italic">
          {configs.app_name || envConfigs.app_name}
        </Link>

        <div className="mt-10 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {m['common.sign.sign_in_title']()}
          </h1>
          <Link
            href={`/sign-up${switchQuery}`}
            className="text-sm font-medium text-zinc-400 underline-offset-4 hover:text-zinc-50 hover:underline"
          >
            {m['common.sign.sign_up_title']()}
          </Link>
        </div>

        {configsLoaded && !hasAnyMethod ? (
          <div className="mt-8 rounded-lg border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-medium">
              {m['common.sign.no_methods_title']()}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {m['common.sign.no_methods_description']()}
            </p>
          </div>
        ) : (
          <>
            {emailEnabled && (
              <form
                className="mt-8"
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="gap-5">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <form.Field name="email">
                    {(field) => (
                      <TextField
                        field={field}
                        label={m['common.sign.email_title']()}
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={m['common.sign.email_placeholder']()}
                        labelClassName={authLabelClass}
                        inputClassName={authInputClass}
                      />
                    )}
                  </form.Field>
                  <form.Field name="password">
                    {(field) => {
                      const err = field.state.meta.isTouched
                        ? (field.state.meta.errors?.[0] as any)
                        : null;
                      const errMsg =
                        err == null
                          ? null
                          : typeof err === 'string'
                            ? err
                            : err.message
                              ? String(err.message)
                              : String(err);
                      return (
                        <Field>
                          <div className="flex items-center justify-between">
                            <FieldLabel
                              htmlFor={field.name}
                              className={authLabelClass}
                            >
                              {m['common.sign.password_title']()}
                            </FieldLabel>
                            {passwordResetEnabled && (
                              <Link
                                href="/forgot-password"
                                className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-50 hover:underline"
                              >
                                {m['common.sign.forgot_password']()}
                              </Link>
                            )}
                          </div>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="password"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            required
                            placeholder={m[
                              'common.sign.password_placeholder'
                            ]()}
                            aria-invalid={errMsg ? true : undefined}
                            className={authInputClass}
                          />
                          {errMsg && (
                            <p className="text-sm text-red-400">{errMsg}</p>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 w-full rounded-lg bg-zinc-50 font-medium text-zinc-950 hover:bg-white"
                      >
                        {isSubmitting
                          ? '...'
                          : m['common.sign.sign_in_title']()}
                      </Button>
                    )}
                  </form.Subscribe>
                </FieldGroup>
              </form>
            )}

            {hasSocial && emailEnabled && (
              <div className="mt-8">
                <AuthDivider label={m['common.sign.or']()} />
              </div>
            )}

            {hasSocial && (
              <div className="mt-6">
                <AuthSocialButtons
                  googleEnabled={googleEnabled}
                  githubEnabled={githubEnabled}
                  onSocial={handleSocial}
                  googleLabel={m['common.sign.google_sign_in']()}
                  githubLabel={m['common.sign.github_sign_in']()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
});
