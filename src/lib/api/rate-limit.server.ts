// Gentle, phone-scoped abuse protection for the public auth endpoints.
// Backed by public.auth_rate_limits (service_role only). Limits are
// deliberately generous so a real customer retrying a few times is never
// blocked; they only stop scripted abuse.
//
// NOTE: this is an ad-hoc counter, not a platform primitive.

export type RateLimitRule = { limit: number; windowMinutes: number };

export const RATE_LIMITS = {
  register: { limit: 5, windowMinutes: 30 },
  reset: { limit: 5, windowMinutes: 30 },
  verify: { limit: 10, windowMinutes: 15 },
} satisfies Record<string, RateLimitRule>;

export class RateLimitError extends Error {}

function limitMessage(minutes: number) {
  return `عدد المحاولات كبير. يرجى المحاولة بعد ${minutes} دقيقة. / Too many attempts. Please try again in about ${minutes} minutes.`;
}

/**
 * Increments the counter for `bucket` and throws when the caller exceeds the
 * rule inside the rolling window. Any storage failure fails OPEN (never
 * blocks a real customer because of an infrastructure hiccup).
 */
export async function enforceRateLimit(
  supabaseAdmin: any,
  bucket: string,
  rule: RateLimitRule,
): Promise<void> {
  const now = Date.now();
  const windowMs = rule.windowMinutes * 60 * 1000;

  try {
    const { data: row } = await supabaseAdmin
      .from("auth_rate_limits")
      .select("bucket, attempts, window_start")
      .eq("bucket", bucket)
      .maybeSingle();

    const startedAt = row ? new Date(row.window_start).getTime() : 0;
    const withinWindow = !!row && now - startedAt < windowMs;

    if (withinWindow && (row.attempts ?? 0) >= rule.limit) {
      const remaining = Math.max(1, Math.ceil((startedAt + windowMs - now) / 60000));
      throw new RateLimitError(limitMessage(remaining));
    }

    await supabaseAdmin.from("auth_rate_limits").upsert(
      {
        bucket,
        attempts: withinWindow ? (row!.attempts ?? 0) + 1 : 1,
        window_start: withinWindow ? row!.window_start : new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: "bucket" },
    );
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    // fail open
  }
}
