import { randomUUID } from 'node:crypto';
import { database } from './client.js';
import { ApiError } from '../api-error.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import { createSessionToken, hashSessionToken, sessionDurationMs } from '../security/session.js';
import { requireOwnerOrPermission, requirePermission } from '../security/authorization.js';
import { calculatePips, requireSignalTransition, signalOutcome } from '../domain/signals.js';
import { verifyLiveInput } from '../cloudflare/stream.js';

const countryNames = { AU: 'Australia', DE: 'Germany', JP: 'Japan', US: 'United States' };
const number = (value) => (value === null || value === undefined ? null : Number(value));

function mapSignal(row) {
  const snapshot = row.snapshot || {};
  const demo = (row.history || []).some((item) => item.note === 'Imported local demo signal');
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    archived: row.visibility === 'archived',
    demo,
    historicalSample:
      demo &&
      row.status === 'running' &&
      Date.now() - new Date(row.created_at).getTime() > 24 * 60 * 60 * 1000,
    source: row.source,
    symbol: row.symbol,
    direction: row.direction,
    entry: number(row.entry),
    stopLoss: number(row.stop_loss),
    targets: (row.targets || []).map(Number),
    status: row.status,
    result:
      snapshot.result ||
      (row.status === 'cancelled' ? 'cancelled' : row.status === 'completed' ? 'win' : 'open'),
    pips: Number(snapshot.pips || 0),
    exitPrice: number(snapshot.exitPrice),
    pipSize: number(row.pip_size),
    session: row.session_name,
    analysis: row.analysis,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    history: (row.history || []).map((item) => ({
      status: item.to_status,
      at: new Date(item.created_at).toISOString(),
      note: item.note,
      actorName: item.actor_name,
    })),
  };
}

export class PostgresRepository {
  constructor(sql = database()) {
    this.sql = sql;
  }

  async health() {
    const [row] = await this
      .sql`select current_database() as database, current_setting('server_version') as version`;
    return { storage: 'postgresql', database: row.database, version: row.version };
  }

  async consumeAuthRateLimit(scope, keyHash, limit, windowSeconds) {
    const [row] = await this.sql`
      insert into auth_rate_limits (scope, key_hash, window_started_at, attempts, updated_at)
      values (${scope}, ${keyHash}, now(), 1, now())
      on conflict (scope, key_hash) do update set
        attempts = case
          when auth_rate_limits.window_started_at <= now() - (${windowSeconds} * interval '1 second') then 1
          else auth_rate_limits.attempts + 1
        end,
        window_started_at = case
          when auth_rate_limits.window_started_at <= now() - (${windowSeconds} * interval '1 second') then now()
          else auth_rate_limits.window_started_at
        end,
        updated_at = now()
      returning attempts, window_started_at
    `;
    if (row.attempts > limit) {
      const retryAfter = Math.max(
        1,
        windowSeconds - Math.floor((Date.now() - new Date(row.window_started_at).getTime()) / 1000)
      );
      const error = new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later');
      error.retryAfter = retryAfter;
      throw error;
    }
  }

  async clearAuthRateLimit(scope, keyHash) {
    await this.sql`delete from auth_rate_limits where scope = ${scope} and key_hash = ${keyHash}`;
  }

  async recordAuthEvent(action, { actorId = null, ipHash = null, metadata = {} } = {}) {
    await this.sql`
      insert into audit_logs (id, actor_id, action, target_type, ip_hash, metadata)
      values (${randomUUID()}, ${actorId}, ${action}, 'authentication', ${ipHash}, ${this.sql.json(metadata)})
    `;
  }

  async profileForUser(userId, sql = this.sql) {
    const [row] = await sql`
      select u.id, u.email, u.username, u.created_at, p.display_name, p.broker_identifier,
        coalesce((select r.code from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = u.id
          order by case r.code when 'super-admin' then 5 when 'admin' then 4 when 'moderator' then 3 when 'expert' then 2 else 1 end desc limit 1), 'member') as role,
        coalesce((select sum(quantity) from lot_ledger where user_id = u.id), 0) as lots,
        pref.language, pref.timezone, pref.theme, pref.email_notifications, pref.push_notifications
      from users u
      join user_profiles p on p.user_id = u.id
      left join user_preferences pref on pref.user_id = u.id
      where u.id = ${userId} and u.deleted_at is null
    `;
    if (!row) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required');
    const tiers = await sql`select code, name, required_lots from reward_tiers order by sort_order`;
    const lots = number(row.lots) || 0;
    const current =
      [...tiers].reverse().find((tier) => lots >= number(tier.required_lots)) || tiers[0];
    const next = tiers.find((tier) => number(tier.required_lots) > lots);
    return {
      id: row.id,
      name: row.display_name,
      username: row.username,
      email: row.email,
      role: row.role,
      tier: current?.name || 'INACTIVE',
      ibId: row.broker_identifier,
      lots,
      nextTier: next?.name || null,
      nextTierLots: next ? number(next.required_lots) : null,
      joinedAt: new Date(row.created_at).toISOString(),
      preferences: {
        language: row.language || 'en',
        timezone: row.timezone || 'Asia/Jakarta',
        theme: row.theme || 'dark',
        emailNotifications: row.email_notifications ?? true,
        pushNotifications: row.push_notifications ?? true,
      },
    };
  }

  async login(email, password, metadata = {}) {
    const [account] = await this.sql`
      select u.id, c.password_hash, c.locked_until
      from users u join user_credentials c on c.user_id = u.id
      where lower(u.email) = lower(${email}) and u.status = 'active' and u.deleted_at is null
    `;
    const valid =
      account && (!account.locked_until || new Date(account.locked_until) <= new Date())
        ? await verifyPassword(password, account.password_hash)
        : false;
    if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    const token = createSessionToken();
    const sessionId = randomUUID();
    await this.sql`
      insert into sessions (id, family_id, user_id, token_hash, user_agent, ip_hash, expires_at)
      values (${sessionId}, ${sessionId}, ${account.id}, ${hashSessionToken(token)}, ${metadata.userAgent || null}, ${metadata.ipHash || null}, ${new Date(Date.now() + sessionDurationMs)})
    `;
    return { token, user: await this.profileForUser(account.id) };
  }

  async register(input, _metadata = {}) {
    const userId = randomUUID();
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const username = input.username?.trim() || null;
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.sql.begin(async (tx) => {
        await tx`
          insert into users (id, email, username, status)
          values (${userId}, ${email}, ${username}, 'pending')
        `;
        await tx`insert into user_credentials (user_id, password_hash) values (${userId}, ${passwordHash})`;
        await tx`insert into user_profiles (user_id, display_name) values (${userId}, ${name})`;
        await tx`insert into user_preferences (user_id) values (${userId})`;
        await tx`
          insert into user_roles (user_id, role_id)
          select ${userId}, id from roles where code = 'member'
        `;
        const verificationToken = createSessionToken();
        await tx`
          insert into email_verification_tokens (id, user_id, token_hash, expires_at)
          values (${randomUUID()}, ${userId}, ${hashSessionToken(verificationToken)}, now() + interval '30 minutes')
        `;
        return { verificationToken, user: await this.profileForUser(userId, tx) };
      });
    } catch (error) {
      if (error?.code === '23505') {
        const [existing] = await this
          .sql`select status from users where lower(email) = lower(${email}) and deleted_at is null`;
        if (existing?.status === 'pending')
          throw new ApiError(
            409,
            'PENDING_ACCOUNT_EXISTS',
            'This account is waiting for email verification'
          );
        throw new ApiError(
          409,
          'ACCOUNT_EXISTS',
          'An account already exists for this email or username'
        );
      }
      throw error;
    }
  }

  async requestEmailVerification(email) {
    const [account] = await this
      .sql`select id, email from users where lower(email) = lower(${email}) and status = 'pending' and deleted_at is null`;
    if (!account) return null;
    const token = createSessionToken();
    await this.sql.begin(async (tx) => {
      await tx`update email_verification_tokens set used_at = now() where user_id = ${account.id} and used_at is null`;
      await tx`insert into email_verification_tokens (id, user_id, token_hash, expires_at) values (${randomUUID()}, ${account.id}, ${hashSessionToken(token)}, now() + interval '30 minutes')`;
    });
    return { token, userId: account.id, email: account.email };
  }

  async verifyEmail(token) {
    const userId = await this.sql.begin(async (tx) => {
      let [verification] = await tx`
        update email_verification_tokens set used_at = now()
        where token_hash = ${hashSessionToken(token)} and used_at is null and expires_at > now()
        returning user_id
      `;
      if (!verification) {
        [verification] = await tx`
          select verification.user_id
          from email_verification_tokens verification
          join users on users.id = verification.user_id
          where verification.token_hash = ${hashSessionToken(token)}
            and verification.used_at is not null
            and verification.expires_at > now()
            and users.email_verified_at is not null
        `;
        if (!verification)
          throw new ApiError(
            400,
            'INVALID_VERIFICATION_TOKEN',
            'This verification link is invalid or expired'
          );
        return verification.user_id;
      }
      await tx`update users set status = 'active', email_verified_at = now(), updated_at = now() where id = ${verification.user_id} and status = 'pending'`;
      await tx`update email_verification_tokens set used_at = now() where user_id = ${verification.user_id} and used_at is null`;
      await tx`insert into audit_logs (id, actor_id, action, target_type, target_id) values (${randomUUID()}, ${verification.user_id}, 'auth.email.verified', 'user', ${verification.user_id})`;
      return verification.user_id;
    });
    return this.profileForUser(userId);
  }

  async session(token) {
    if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required');
    const tokenHash = hashSessionToken(token);
    const [row] = await this.sql`
      update sessions set last_seen_at = now()
      where token_hash = ${tokenHash} and revoked_at is null and expires_at > now()
      returning id, user_id, family_id
    `;
    if (row) return { sessionId: row.id, userId: row.user_id, familyId: row.family_id, tokenHash };

    const [inactive] = await this.sql`
      select id, user_id, family_id, revoked_at, rotated_at, revocation_reason
      from sessions where token_hash = ${tokenHash}
    `;
    if (inactive?.revocation_reason === 'rotated') {
      const graceMs = 5_000;
      const rotationAge =
        Date.now() - new Date(inactive.rotated_at || inactive.revoked_at).getTime();
      if (rotationAge <= graceMs)
        throw new ApiError(
          401,
          'SESSION_ROTATED',
          'Your session was refreshed; retry with the latest cookie'
        );
      await this.revokeReusedSessionFamily(inactive);
      throw new ApiError(
        401,
        'SESSION_REUSE_DETECTED',
        'Session reuse was detected. Sign in again on this device'
      );
    }
    throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired');
  }

  async rotateSession(token, metadata = {}) {
    if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required');
    const tokenHash = hashSessionToken(token);
    const result = await this.sql.begin(async (tx) => {
      const [current] = await tx`select * from sessions where token_hash = ${tokenHash} for update`;
      if (!current) return { state: 'expired' };
      if (current.revoked_at) {
        if (current.revocation_reason !== 'rotated') return { state: 'expired' };
        await tx`
          update sessions set revoked_at = coalesce(revoked_at, now()), reuse_detected_at = now(), revocation_reason = 'reuse-detected'
          where family_id = ${current.family_id}
        `;
        await tx`
          insert into audit_logs (id, actor_id, action, target_type, target_id, ip_hash, metadata)
          values (${randomUUID()}, ${current.user_id}, 'auth.session.reuse_detected', 'session-family', ${current.family_id}, ${metadata.ipHash || null}, ${tx.json({ sessionId: current.id })})
        `;
        return { state: 'reused' };
      }
      if (new Date(current.expires_at) <= new Date()) {
        await tx`update sessions set revoked_at = now(), revocation_reason = 'expired' where id = ${current.id}`;
        return { state: 'expired' };
      }

      const nextToken = createSessionToken();
      const nextSessionId = randomUUID();
      await tx`
        insert into sessions (id, family_id, parent_session_id, user_id, token_hash, user_agent, ip_hash, expires_at)
        values (${nextSessionId}, ${current.family_id}, ${current.id}, ${current.user_id}, ${hashSessionToken(nextToken)}, ${metadata.userAgent || current.user_agent}, ${metadata.ipHash || current.ip_hash}, ${new Date(Date.now() + sessionDurationMs)})
      `;
      await tx`
        update sessions set revoked_at = now(), rotated_at = now(), replaced_by_session_id = ${nextSessionId}, revocation_reason = 'rotated'
        where id = ${current.id}
      `;
      await tx`
        insert into audit_logs (id, actor_id, action, target_type, target_id, ip_hash, metadata)
        values (${randomUUID()}, ${current.user_id}, 'auth.session.rotated', 'session', ${nextSessionId}, ${metadata.ipHash || current.ip_hash}, ${tx.json({ previousSessionId: current.id, familyId: current.family_id })})
      `;
      return { state: 'rotated', token: nextToken, userId: current.user_id };
    });
    if (result.state === 'reused')
      throw new ApiError(
        401,
        'SESSION_REUSE_DETECTED',
        'Session reuse was detected. Sign in again on this device'
      );
    if (result.state !== 'rotated')
      throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired');
    return { token: result.token, user: await this.profileForUser(result.userId) };
  }

  async revokeReusedSessionFamily(session) {
    await this.sql.begin(async (tx) => {
      await tx`
        update sessions set revoked_at = coalesce(revoked_at, now()), reuse_detected_at = now(), revocation_reason = 'reuse-detected'
        where family_id = ${session.family_id}
      `;
      await tx`
        insert into audit_logs (id, actor_id, action, target_type, target_id, metadata)
        values (${randomUUID()}, ${session.user_id}, 'auth.session.reuse_detected', 'session-family', ${session.family_id}, ${tx.json({ sessionId: session.id })})
      `;
    });
  }

  async logout(token) {
    if (!token) return;
    const [current] = await this
      .sql`select family_id from sessions where token_hash = ${hashSessionToken(token)}`;
    if (current)
      await this
        .sql`update sessions set revoked_at = coalesce(revoked_at, now()), revocation_reason = case when revoked_at is null then 'logout' else revocation_reason end where family_id = ${current.family_id}`;
  }

  async listSessions(token) {
    const { userId, tokenHash } = await this.session(token);
    const rows = await this.sql`
      select id, token_hash, user_agent, created_at, last_seen_at, expires_at
      from sessions
      where user_id = ${userId} and revoked_at is null and expires_at > now()
      order by last_seen_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      current: row.token_hash === tokenHash,
      userAgent: row.user_agent || 'Unknown browser',
      createdAt: new Date(row.created_at).toISOString(),
      lastSeenAt: new Date(row.last_seen_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
    }));
  }

  async revokeOtherSessions(token) {
    const { userId, familyId } = await this.session(token);
    const rows = await this.sql`
      update sessions set revoked_at = now(), revocation_reason = 'revoked-by-user'
      where user_id = ${userId} and family_id <> ${familyId} and revoked_at is null
      returning id
    `;
    return rows.length;
  }

  async requestPasswordReset(email) {
    const [account] = await this
      .sql`select id from users where lower(email) = lower(${email}) and status = 'active' and deleted_at is null`;
    if (!account) return null;
    const token = createSessionToken();
    await this.sql.begin(async (tx) => {
      await tx`update password_reset_tokens set used_at = now() where user_id = ${account.id} and used_at is null`;
      await tx`
        insert into password_reset_tokens (id, user_id, token_hash, expires_at)
        values (${randomUUID()}, ${account.id}, ${hashSessionToken(token)}, now() + interval '30 minutes')
      `;
    });
    return token;
  }

  async resetPassword(token, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    await this.sql.begin(async (tx) => {
      const [reset] = await tx`
        update password_reset_tokens set used_at = now()
        where token_hash = ${hashSessionToken(token)} and used_at is null and expires_at > now()
        returning user_id
      `;
      if (!reset)
        throw new ApiError(
          400,
          'INVALID_RESET_TOKEN',
          'This password reset link is invalid or expired'
        );
      await tx`update user_credentials set password_hash = ${passwordHash}, password_changed_at = now() where user_id = ${reset.user_id}`;
      await tx`update sessions set revoked_at = now(), revocation_reason = 'password-reset' where user_id = ${reset.user_id} and revoked_at is null`;
    });
  }

  async getProfile(token) {
    const { userId } = await this.session(token);
    return this.profileForUser(userId);
  }

  async updateProfile(token, input) {
    const { userId } = await this.session(token);
    try {
      await this.sql.begin(async (tx) => {
        if (typeof input.email === 'string' || typeof input.username === 'string') {
          await tx`update users set email = coalesce(${typeof input.email === 'string' ? input.email.trim() : null}, email), username = coalesce(${typeof input.username === 'string' ? input.username.trim() : null}, username), updated_at = now() where id = ${userId}`;
        }
        if (typeof input.name === 'string')
          await tx`update user_profiles set display_name = ${input.name.trim()}, updated_at = now() where user_id = ${userId}`;
      });
    } catch (error) {
      if (error?.code === '23505')
        throw new ApiError(409, 'PROFILE_CONFLICT', 'That email or username is already in use');
      throw error;
    }
    return this.profileForUser(userId);
  }

  async updatePreferences(token, input) {
    const { userId } = await this.session(token);
    const current = (await this.profileForUser(userId)).preferences;
    const next = { ...current, ...input };
    await this.sql`
      insert into user_preferences (user_id, language, timezone, theme, email_notifications, push_notifications)
      values (${userId}, ${next.language}, ${next.timezone || 'Asia/Jakarta'}, ${next.theme}, ${Boolean(next.emailNotifications)}, ${Boolean(next.pushNotifications)})
      on conflict (user_id) do update set language = excluded.language, timezone = excluded.timezone, theme = excluded.theme,
        email_notifications = excluded.email_notifications, push_notifications = excluded.push_notifications, updated_at = now()
    `;
    return (await this.profileForUser(userId)).preferences;
  }

  async changePassword(token, currentPassword, newPassword) {
    const { userId } = await this.session(token);
    const [row] = await this
      .sql`select password_hash from user_credentials where user_id = ${userId}`;
    if (!row || !(await verifyPassword(currentPassword, row.password_hash)))
      throw new ApiError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
    const passwordHash = await hashPassword(newPassword);
    await this.sql.begin(async (tx) => {
      await tx`update user_credentials set password_hash = ${passwordHash}, password_changed_at = now() where user_id = ${userId}`;
      await tx`update sessions set revoked_at = coalesce(revoked_at, now()), revocation_reason = case when revoked_at is null then 'password-change' else revocation_reason end where user_id = ${userId}`;
    });
  }

  async tiers() {
    const rows = await this
      .sql`select code as id, name, required_lots from reward_tiers order by sort_order`;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      minimumLots: number(row.required_lots),
      reward: '-',
    }));
  }

  async signalRows(sql = this.sql, { includeArchived = false } = {}) {
    return sql`
      select s.*, i.symbol, i.pip_size, author_profile.display_name as author_name,
        coalesce((select json_agg(st.price order by st.position) from signal_targets st where st.signal_id = s.id), '[]') as targets,
        coalesce((select json_agg(json_build_object('to_status', h.to_status, 'created_at', h.created_at, 'note', h.note, 'actor_name', actor_profile.display_name) order by h.created_at) from signal_history h left join user_profiles actor_profile on actor_profile.user_id = h.actor_id where h.signal_id = s.id), '[]') as history,
        coalesce((select h.snapshot from signal_history h where h.signal_id = s.id order by h.created_at desc limit 1), '{}') as snapshot
      from signals s join instruments i on i.id = s.instrument_id
      join user_profiles author_profile on author_profile.user_id = s.author_id
      where (${includeArchived} or s.visibility <> 'archived')
      order by s.created_at desc
    `;
  }

  async signals(filters = {}) {
    const archived = filters.archived === 'true';
    let items = (await this.signalRows(this.sql, { includeArchived: archived }))
      .map(mapSignal)
      .filter((item) => item.archived === archived);
    for (const key of ['source', 'status', 'session', 'result'])
      if (filters[key])
        items = items.filter(
          (item) => String(item[key]).toLowerCase() === String(filters[key]).toLowerCase()
        );
    if (filters.search)
      items = items.filter((item) =>
        `${item.symbol} ${item.analysis}`
          .toLowerCase()
          .includes(String(filters.search).toLowerCase())
      );
    if (filters.history === 'true')
      items = items.filter((item) => ['completed', 'cancelled', 'expired'].includes(item.status));
    return items;
  }

  async signal(id) {
    const item = (await this.signalRows()).map(mapSignal).find((row) => row.id === id);
    if (!item) throw new ApiError(404, 'NOT_FOUND', 'Signal not found');
    return item;
  }

  async createSignal(token, input) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    requirePermission(profile, 'signal.publish', 'Signal publishing permission is required');
    const id = randomUUID();
    await this.sql.begin(async (tx) => {
      const [instrument] =
        await tx`select id from instruments where symbol = upper(${input.symbol}) and enabled = true`;
      if (!instrument) throw new ApiError(400, 'VALIDATION_ERROR', 'Unknown instrument');
      await tx`
        insert into signals (id, author_id, instrument_id, source, direction, status, entry, stop_loss, analysis, session_name, published_at)
        values (${id}, ${userId}, ${instrument.id}, 'expert', ${input.direction}, 'running', ${input.entry}, ${input.stopLoss}, ${input.analysis}, ${input.session}, now())
      `;
      for (const [index, target] of input.targets.entries())
        await tx`insert into signal_targets (id, signal_id, position, price) values (${randomUUID()}, ${id}, ${index + 1}, ${target})`;
      await tx`insert into signal_history (id, signal_id, actor_id, to_status, note, snapshot) values (${randomUUID()}, ${id}, ${userId}, 'running', 'Signal published', ${tx.json({ result: 'open', pips: 0 })})`;
    });
    return this.signal(id);
  }

  async updateSignal(token, id, input) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    await this.sql.begin(async (tx) => {
      const [ownedSignal] =
        await tx`select author_id, visibility from signals where id = ${id} for update`;
      if (!ownedSignal || ownedSignal.visibility === 'archived')
        throw new ApiError(404, 'NOT_FOUND', 'Signal not found');
      if (profile.id === ownedSignal.author_id)
        requirePermission(
          profile,
          profile.role === 'expert' ? 'signal.edit.own' : 'signal.edit.any',
          'Signal editing permission is required'
        );
      else
        requirePermission(
          profile,
          'signal.edit.any',
          'Only the signal owner or an administrator may edit this signal'
        );
      const current = (await this.signalRows(tx)).map(mapSignal).find((row) => row.id === id);
      const nextStatus = input.status || current.status;
      if (input.status) requireSignalTransition(current.status, nextStatus);
      if (['entry', 'stopLoss', 'targets', 'session'].some((field) => input[field] !== undefined))
        throw new ApiError(409, 'SIGNAL_LEVELS_LOCKED', 'Published signal levels cannot be edited');
      if (nextStatus === 'completed' && nextStatus !== current.status && !input.exitPrice)
        throw new ApiError(400, 'VALIDATION_ERROR', 'An executed exit price is required');
      if (nextStatus === 'cancelled' && nextStatus !== current.status && !input.note)
        throw new ApiError(400, 'VALIDATION_ERROR', 'A cancellation reason is required');
      let exitPrice = input.exitPrice ?? current.exitPrice;
      let pips = current.pips;
      if (input.status && nextStatus !== current.status) {
        if (nextStatus === 'stopped') exitPrice = input.exitPrice ?? current.stopLoss;
        if (nextStatus === 'target-hit') exitPrice = input.exitPrice ?? current.targets[0];
        if (['completed', 'stopped', 'target-hit'].includes(nextStatus))
          pips = calculatePips({
            direction: current.direction,
            entry: current.entry,
            exitPrice,
            pipSize: current.pipSize,
          });
        if (['cancelled', 'expired'].includes(nextStatus)) pips = 0;
      }
      const result = signalOutcome(nextStatus, pips);
      const closedAt =
        input.status &&
        nextStatus !== current.status &&
        ['stopped', 'cancelled', 'expired', 'completed'].includes(nextStatus)
          ? new Date()
          : null;
      await tx`
        update signals set status = ${nextStatus}, analysis = ${input.analysis ?? current.analysis},
          closed_at = coalesce(${closedAt}, closed_at), updated_at = now(), version = version + 1
        where id = ${id}
      `;
      if ((input.status && nextStatus !== current.status) || input.analysis !== undefined)
        await tx`insert into signal_history (id, signal_id, actor_id, from_status, to_status, note, snapshot) values (${randomUUID()}, ${id}, ${userId}, ${current.status}, ${nextStatus}, ${input.note || (input.analysis !== undefined ? 'Analysis updated' : `Signal ${nextStatus}`)}, ${tx.json({ result, pips, exitPrice })})`;
    });
    return this.signal(id);
  }

  async archiveSignal(token, id, reason) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    requirePermission(profile, 'signal.delete', 'Signal archiving permission is required');
    await this.sql.begin(async (tx) => {
      const [row] = await tx`select status, visibility from signals where id = ${id} for update`;
      if (!row || row.visibility === 'archived')
        throw new ApiError(404, 'NOT_FOUND', 'Signal not found');
      if (!['completed', 'stopped', 'cancelled', 'expired'].includes(row.status))
        throw new ApiError(
          409,
          'SIGNAL_STILL_ACTIVE',
          'Close or cancel the signal before archiving'
        );
      const [last] = await tx`
        select snapshot from signal_history where signal_id = ${id}
        order by created_at desc, id desc limit 1
      `;
      await tx`
        update signals set visibility = 'archived', updated_at = now(), version = version + 1
        where id = ${id}
      `;
      await tx`
        insert into signal_history (id, signal_id, actor_id, from_status, to_status, note, snapshot)
        values (${randomUUID()}, ${id}, ${userId}, ${row.status}, ${row.status}, ${`Archived: ${reason}`}, ${tx.json(last?.snapshot || {})})
      `;
    });
    return { id, archived: true };
  }

  async quote(symbol) {
    const [row] = await this.sql`
      select i.symbol, i.metadata, p.price, p.observed_at from instruments i
      join lateral (select price, observed_at from price_snapshots where instrument_id = i.id order by observed_at desc limit 1) p on true
      where i.symbol = upper(${symbol})
    `;
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'Symbol not found');
    return {
      symbol: row.symbol,
      price: number(row.price),
      open: number(row.metadata.open) ?? number(row.price),
      high: number(row.metadata.high) ?? number(row.price),
      low: number(row.metadata.low) ?? number(row.price),
      change: number(row.metadata.change) ?? 0,
      updatedAt: new Date(row.observed_at).toISOString(),
    };
  }

  async calendar() {
    const rows = await this.sql`select * from calendar_events order by scheduled_at`;
    return rows.map((row) => ({
      id: row.id,
      demo: row.provider === 'nh-local-seed',
      receivedAt: new Date(row.received_at).toISOString(),
      date: new Date(row.scheduled_at).toISOString(),
      country: countryNames[row.country_code] || row.country_code,
      currency: row.currency,
      impact: row.impact,
      event: row.title,
      previous: row.previous_value,
      forecast: row.forecast_value,
      actual: row.actual_value,
      source: row.provider === 'nh-local-seed' ? 'Local sample data' : row.source_url,
      revision: row.revised_value,
    }));
  }

  async marketContent(kind) {
    const [row] = await this
      .sql`select payload, source from market_content where kind = ${kind} and (expires_at is null or expires_at > now()) order by published_at desc limit 1`;
    return row ? { ...row.payload, demo: row.source === 'NH local seed' } : null;
  }

  async forumPosts() {
    const rows = await this.sql`
      select p.id, p.body, p.created_at, up.display_name as author,
        coalesce((select count(*) from forum_reactions r where r.post_id = p.id), 0) as reactions,
        coalesce((select count(*) from forum_comments c where c.post_id = p.id and c.deleted_at is null), 0) as comments
      from forum_posts p join user_profiles up on up.user_id = p.author_id where p.deleted_at is null order by p.created_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      author: row.author,
      tier: 'SULTAN',
      body: row.body,
      reactions: Number(row.reactions),
      comments: Number(row.comments),
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async createForumPost(token, input) {
    const { userId } = await this.session(token);
    requirePermission(await this.profileForUser(userId), 'forum.write');
    const id = randomUUID();
    await this
      .sql`insert into forum_posts (id, author_id, title, body) values (${id}, ${userId}, ${input.body.trim().slice(0, 80)}, ${input.body.trim()})`;
    return (await this.forumPosts()).find((post) => post.id === id);
  }

  async comments(postId) {
    const rows = await this.sql`
      select c.id, c.post_id, c.parent_id, c.body, c.created_at, p.display_name as author,
        coalesce((select r.code from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = c.author_id
          order by case r.code when 'super-admin' then 5 when 'admin' then 4 when 'moderator' then 3 when 'expert' then 2 else 1 end desc limit 1), 'member') as role
      from forum_comments c join user_profiles p on p.user_id = c.author_id where c.post_id = ${postId} and c.deleted_at is null order by c.created_at
    `;
    return rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      parentId: row.parent_id,
      author: row.author,
      role: row.role,
      body: row.body,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async createComment(token, postId, input) {
    const { userId } = await this.session(token);
    requirePermission(await this.profileForUser(userId), 'forum.write');
    const [post] = await this
      .sql`select id from forum_posts where id = ${postId} and deleted_at is null`;
    if (!post) throw new ApiError(404, 'NOT_FOUND', 'Forum post not found');
    if (input.parentId) {
      const [parent] = await this
        .sql`select id from forum_comments where id = ${input.parentId} and post_id = ${postId} and deleted_at is null`;
      if (!parent)
        throw new ApiError(
          400,
          'INVALID_PARENT_COMMENT',
          'Reply parent must be a comment on the same post'
        );
    }
    const id = randomUUID();
    await this
      .sql`insert into forum_comments (id, post_id, author_id, parent_id, body) values (${id}, ${postId}, ${userId}, ${input.parentId || null}, ${input.body.trim()})`;
    return (await this.comments(postId)).find((comment) => comment.id === id);
  }

  async updateForumPost(token, id, input) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    const [post] = await this
      .sql`select author_id from forum_posts where id = ${id} and deleted_at is null`;
    if (!post) throw new ApiError(404, 'NOT_FOUND', 'Forum post not found');
    requireOwnerOrPermission(profile, post.author_id, 'forum.moderate');
    await this
      .sql`update forum_posts set title = ${input.body.trim().slice(0, 80)}, body = ${input.body.trim()}, updated_at = now() where id = ${id}`;
    return (await this.forumPosts()).find((item) => item.id === id);
  }

  async deleteForumPost(token, id) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    const [post] = await this
      .sql`select author_id from forum_posts where id = ${id} and deleted_at is null`;
    if (!post) throw new ApiError(404, 'NOT_FOUND', 'Forum post not found');
    requireOwnerOrPermission(profile, post.author_id, 'forum.moderate');
    await this.sql`update forum_posts set deleted_at = now(), updated_at = now() where id = ${id}`;
  }

  async updateComment(token, postId, id, input) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    const [comment] = await this
      .sql`select author_id from forum_comments where id = ${id} and post_id = ${postId} and deleted_at is null`;
    if (!comment) throw new ApiError(404, 'NOT_FOUND', 'Comment not found');
    requireOwnerOrPermission(profile, comment.author_id, 'forum.moderate');
    await this
      .sql`update forum_comments set body = ${input.body.trim()}, updated_at = now() where id = ${id}`;
    return (await this.comments(postId)).find((item) => item.id === id);
  }

  async deleteComment(token, postId, id) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    const [comment] = await this
      .sql`select author_id from forum_comments where id = ${id} and post_id = ${postId} and deleted_at is null`;
    if (!comment) throw new ApiError(404, 'NOT_FOUND', 'Comment not found');
    requireOwnerOrPermission(profile, comment.author_id, 'forum.moderate');
    await this
      .sql`update forum_comments set deleted_at = now(), updated_at = now() where id = ${id}`;
  }

  async conversations(token) {
    const { userId } = await this.session(token);
    const rows = await this.sql`
      select c.id, c.title, coalesce(max(m.created_at), c.created_at) as updated_at,
        count(m.id) filter (where m.sender_id <> ${userId} and (cp.last_read_at is null or m.created_at > cp.last_read_at)) as unread_count
      from conversations c join conversation_participants cp on cp.conversation_id = c.id and cp.user_id = ${userId}
      left join messages m on m.conversation_id = c.id group by c.id, cp.last_read_at order by updated_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      unreadCount: Number(row.unread_count),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  async messages(token, conversationId) {
    const { userId } = await this.session(token);
    await this.requireConversationMembership(userId, conversationId);
    const rows = await this
      .sql`select * from messages where conversation_id = ${conversationId} and deleted_at is null order by created_at`;
    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      body: row.body,
      createdAt: new Date(row.created_at).toISOString(),
      status: 'delivered',
    }));
  }

  async createMessage(token, conversationId, input) {
    const { userId } = await this.session(token);
    requirePermission(await this.profileForUser(userId), 'message.write');
    await this.requireConversationMembership(userId, conversationId);
    const id = randomUUID();
    await this
      .sql`insert into messages (id, conversation_id, sender_id, body, client_request_id) values (${id}, ${conversationId}, ${userId}, ${input.body}, ${input.clientRequestId || null})`;
    return (await this.messages(token, conversationId)).find((message) => message.id === id);
  }

  async markConversationRead(token, conversationId) {
    const { userId } = await this.session(token);
    await this.requireConversationMembership(userId, conversationId);
    await this
      .sql`update conversation_participants set last_read_at = now() where conversation_id = ${conversationId} and user_id = ${userId}`;
  }

  async requireConversationMembership(userId, conversationId) {
    const [membership] = await this
      .sql`select 1 from conversation_participants where conversation_id = ${conversationId} and user_id = ${userId}`;
    if (!membership) throw new ApiError(403, 'FORBIDDEN', 'Conversation access denied');
  }

  async announcements() {
    const rows = await this.sql`
      select a.*, p.display_name as author, coalesce((select json_agg(ar.user_id) from announcement_reads ar where ar.announcement_id = a.id), '[]') as read_by
      from announcements a join user_profiles p on p.user_id = a.author_id where a.status = 'published' and (a.expires_at is null or a.expires_at > now()) order by a.pinned desc, a.published_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      author: row.author,
      publishedAt: new Date(row.published_at).toISOString(),
      pinned: row.pinned,
      title: row.title,
      body: row.body,
      readBy: row.read_by,
    }));
  }

  async createAnnouncement(token, input) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    requirePermission(profile, 'announcement.publish', 'Administrator access required');
    const id = randomUUID();
    await this
      .sql`insert into announcements (id, author_id, title, body, status, pinned, published_at) values (${id}, ${userId}, ${input.title.trim()}, ${input.body.trim()}, 'published', ${Boolean(input.pinned)}, now())`;
    return (await this.announcements()).find((item) => item.id === id);
  }

  async announcement(id) {
    const item = (await this.announcements()).find((row) => row.id === id);
    if (!item) throw new ApiError(404, 'NOT_FOUND', 'Announcement not found');
    return item;
  }

  async markAnnouncementRead(token, id) {
    const { userId } = await this.session(token);
    await this.announcement(id);
    await this
      .sql`insert into announcement_reads (announcement_id, user_id) values (${id}, ${userId}) on conflict do nothing`;
  }

  async courses(token) {
    const { userId } = await this.session(token);
    const rows = await this.sql`
      select c.id, c.title, rt.name as required_tier, coalesce(sum(l.duration_seconds), 0) as duration_seconds,
        coalesce(sum(lp.position_seconds), 0) as progress_seconds, bool_and(lp.completed_at is not null) filter (where lp.lesson_id is not null) as completed
      from courses c left join reward_tiers rt on rt.id = c.required_tier_id left join lessons l on l.course_id = c.id
      left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = ${userId}
      where c.status = 'published' group by c.id, rt.name order by c.sort_order
    `;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      requiredTier: row.required_tier,
      durationSeconds: Number(row.duration_seconds),
      progressSeconds: Number(row.progress_seconds),
      completed: Boolean(row.completed),
    }));
  }

  async liveSession() {
    const [row] = await this
      .sql`select value, updated_at from app_configuration where key = 'community.cloudflare_live'`;
    return {
      title: 'NH Live Trade',
      inputId: row?.value?.inputId || null,
      updatedAt: row?.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  }

  async updateLiveSession(token, inputId, validateInput = verifyLiveInput) {
    const { userId } = await this.session(token);
    const profile = await this.profileForUser(userId);
    requirePermission(profile, 'live-session.manage', 'Administrator access required');
    if (inputId.trim()) await validateInput(inputId.trim());
    await this.sql`
      insert into app_configuration (key, value, description)
      values ('community.cloudflare_live', ${this.sql.json({ inputId: inputId.trim() || null })}, 'Protected Cloudflare live input')
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `;
    return this.liveSession();
  }
}
