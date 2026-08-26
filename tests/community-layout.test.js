import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';

describe('community responsive regressions', () => {
  test('mobile chat exposes either the conversation list or active room', async () => {
    const css = await readFile('src/components/Community/community.css', 'utf8');
    expect(css).toContain('.chat-view:not(.mobile-room-open)>aside');
    expect(css).toContain('.chat-view.mobile-room-open>aside');
    expect(css).toContain('.chat-mobile-header');
  });

  test('forum threads and announcement dialogs have dedicated layouts', async () => {
    const css = await readFile('src/components/Community/community.css', 'utf8');
    expect(css).toContain('.post-thread');
    expect(css).toContain('.thread-reply');
    expect(css).toContain('.community-modal-backdrop');
  });
});
