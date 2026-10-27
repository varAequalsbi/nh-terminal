import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { database, closeDatabase } from '../server/database/client.js';
import { hashPassword } from '../server/security/password.js';

if (!['local', 'test'].includes(process.env.APP_ENV)) {
  throw new Error('The demo seed is restricted to APP_ENV=local or APP_ENV=test');
}

const uuid = (value) => {
  const hex = createHash('sha256').update(String(value)).digest('hex').slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`;
};

const countryCodes = {
  Australia: 'AU',
  Germany: 'DE',
  Japan: 'JP',
  'United States': 'US',
};

const data = JSON.parse(await readFile(new URL('../server/data/db.json', import.meta.url), 'utf8'));
const sql = database();
const userId = uuid('local-admin');
const password = process.env.DEMO_ACCOUNT_PASSWORD || 'NHAdmin1234!';
const passwordHash = await hashPassword(password);

try {
  await sql.begin(async (tx) => {
    await tx`
      insert into users (id, email, username, status, email_verified_at, created_at)
      values (${userId}, ${process.env.DEMO_ACCOUNT_EMAIL || data.profile.email}, ${data.profile.username}, 'active', now(), ${data.profile.joinedAt})
      on conflict (id) do update set email = excluded.email, username = excluded.username, status = 'active'
    `;
    await tx`
      insert into user_credentials (user_id, password_hash)
      values (${userId}, ${passwordHash})
      on conflict (user_id) do update set password_hash = excluded.password_hash, password_changed_at = now()
    `;
    await tx`
      insert into user_profiles (user_id, display_name, broker_identifier)
      values (${userId}, ${data.profile.name}, ${data.profile.ibId})
      on conflict (user_id) do update set display_name = excluded.display_name, broker_identifier = excluded.broker_identifier, updated_at = now()
    `;
    await tx`
      insert into user_preferences (user_id, language, timezone, theme, email_notifications, push_notifications)
      values (${userId}, ${data.profile.preferences.language || 'en'}, 'Asia/Jakarta', ${data.profile.preferences.theme || 'dark'}, ${Boolean(data.profile.preferences.emailNotifications)}, ${Boolean(data.profile.preferences.pushNotifications)})
      on conflict (user_id) do update set language = excluded.language, theme = excluded.theme,
        email_notifications = excluded.email_notifications, push_notifications = excluded.push_notifications, updated_at = now()
    `;
    await tx`
      insert into user_roles (user_id, role_id)
      select ${userId}, id from roles where code = ${data.profile.role}
      on conflict do nothing
    `;

    for (const [symbol, quote] of Object.entries(data.market)) {
      await tx`
        insert into price_snapshots (instrument_id, provider, price, observed_at)
        select id, 'nh-local-seed', ${quote.price}, ${quote.updatedAt || new Date().toISOString()} from instruments where symbol = ${symbol}
        on conflict do nothing
      `;
      await tx`
        update instruments set metadata = ${tx.json({ open: quote.open, high: quote.high, low: quote.low, change: quote.change })}
        where symbol = ${symbol}
      `;
    }

    for (const signal of data.signals) {
      const signalId = uuid(signal.id);
      await tx`
        insert into signals (id, author_id, instrument_id, source, direction, status, entry, stop_loss, analysis, session_name, published_at, created_at)
        select ${signalId}, ${userId}, id, ${signal.source}, ${signal.direction}, ${signal.status}, ${signal.entry}, ${signal.stopLoss}, ${signal.analysis}, ${signal.session}, ${signal.createdAt}, ${signal.createdAt}
        from instruments where symbol = ${signal.symbol}
        on conflict (id) do update set status = excluded.status, entry = excluded.entry, stop_loss = excluded.stop_loss,
          analysis = excluded.analysis, session_name = excluded.session_name, updated_at = now()
      `;
      await tx`delete from signal_targets where signal_id = ${signalId}`;
      for (const [index, target] of signal.targets.entries()) {
        await tx`insert into signal_targets (id, signal_id, position, price) values (${randomUUID()}, ${signalId}, ${index + 1}, ${target})`;
      }
      await tx`
        insert into signal_history (id, signal_id, actor_id, to_status, note, snapshot, created_at)
        values (${uuid(`${signal.id}-history`)}, ${signalId}, ${userId}, ${signal.status}, 'Imported local demo signal', ${tx.json({ result: signal.result, pips: signal.pips })}, ${signal.createdAt})
        on conflict (id) do nothing
      `;
    }

    for (const event of data.calendar) {
      await tx`
        insert into calendar_events (id, provider, provider_event_id, title, country_code, currency, impact, scheduled_at, previous_value, forecast_value, actual_value, revised_value, source_url)
        values (${uuid(event.id)}, 'nh-local-seed', ${event.id}, ${event.event}, ${countryCodes[event.country] || null}, ${event.currency}, ${event.impact}, ${event.date}, ${event.previous}, ${event.forecast}, ${event.actual}, ${event.revision}, ${event.source})
        on conflict (provider, provider_event_id) do update set scheduled_at = excluded.scheduled_at, previous_value = excluded.previous_value,
          forecast_value = excluded.forecast_value, actual_value = excluded.actual_value, revised_value = excluded.revised_value
      `;
    }

    for (const [kind, content] of [
      ['outlook', data.marketOutlook],
      ['research', data.marketResearch],
    ]) {
      await tx`
        insert into market_content (id, kind, title, body, source, payload, published_at)
        values (${uuid(`market-${kind}`)}, ${kind}, ${content.title || `Market ${kind}`}, ${content.body || content.title || kind}, 'NH local seed', ${tx.json(content)}, now())
        on conflict (id) do update set payload = excluded.payload, published_at = now()
      `;
    }

    for (const post of data.posts) {
      await tx`
        insert into forum_posts (id, author_id, title, body, created_at)
        values (${uuid(post.id)}, ${userId}, ${post.body.slice(0, 80)}, ${post.body}, ${post.createdAt})
        on conflict (id) do update set body = excluded.body, updated_at = now()
      `;
    }
    for (const comment of data.comments || []) {
      await tx`
        insert into forum_comments (id, post_id, author_id, parent_id, body, created_at)
        values (${uuid(comment.id)}, ${uuid(comment.postId)}, ${userId}, ${comment.parentId ? uuid(comment.parentId) : null}, ${comment.body}, ${comment.createdAt})
        on conflict (id) do update set body = excluded.body, updated_at = now()
      `;
    }

    for (const conversation of data.conversations) {
      const conversationId = uuid(conversation.id);
      await tx`
        insert into conversations (id, title, created_by, created_at)
        values (${conversationId}, ${conversation.title}, ${userId}, ${conversation.updatedAt})
        on conflict (id) do update set title = excluded.title
      `;
      await tx`
        insert into conversation_participants (conversation_id, user_id)
        values (${conversationId}, ${userId}) on conflict do nothing
      `;
    }
    for (const message of data.messages) {
      await tx`
        insert into messages (id, conversation_id, sender_id, body, created_at)
        values (${uuid(message.id)}, ${uuid(message.conversationId)}, ${userId}, ${message.body}, ${message.createdAt})
        on conflict (id) do update set body = excluded.body
      `;
    }

    for (const announcement of data.announcements) {
      await tx`
        insert into announcements (id, author_id, title, body, status, pinned, published_at, created_at)
        values (${uuid(announcement.id)}, ${userId}, ${announcement.title}, ${announcement.body}, 'published', ${Boolean(announcement.pinned)}, ${announcement.publishedAt}, ${announcement.publishedAt})
        on conflict (id) do update set title = excluded.title, body = excluded.body, pinned = excluded.pinned, updated_at = now()
      `;
    }

    for (const [index, course] of data.courses.entries()) {
      const courseId = uuid(course.id);
      await tx`
        insert into courses (id, title, required_tier_id, status, sort_order)
        select ${courseId}, ${course.title}, id, 'published', ${index}
        from reward_tiers where name = ${course.requiredTier}
        on conflict (id) do update set title = excluded.title, required_tier_id = excluded.required_tier_id, sort_order = excluded.sort_order
      `;
      await tx`
        insert into lessons (id, course_id, title, duration_seconds, sort_order, status)
        values (${uuid(`${course.id}-lesson`)}, ${courseId}, ${course.title}, ${course.durationSeconds}, 0, 'published')
        on conflict (course_id, sort_order) do update set title = excluded.title, duration_seconds = excluded.duration_seconds
      `;
    }
  });
  console.log('Seeded local NH Terminal data');
} finally {
  await closeDatabase();
}
