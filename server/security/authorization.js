import { ApiError } from '../api-error.js';

export const permissionsByRole = Object.freeze({
  member: new Set(['forum.write', 'message.write']),
  expert: new Set(['forum.write', 'message.write', 'signal.publish', 'signal.edit.own']),
  moderator: new Set(['forum.write', 'message.write', 'forum.moderate']),
  admin: new Set([
    'forum.write',
    'message.write',
    'forum.moderate',
    'signal.publish',
    'signal.edit.any',
    'signal.delete',
    'announcement.publish',
    'live-session.manage',
  ]),
  'super-admin': new Set([
    'forum.write',
    'message.write',
    'forum.moderate',
    'signal.publish',
    'signal.edit.any',
    'signal.delete',
    'announcement.publish',
    'live-session.manage',
  ]),
});

export function hasPermission(role, permission) {
  return permissionsByRole[role]?.has(permission) || false;
}

export function requirePermission(
  profile,
  permission,
  message = 'You do not have permission to perform this action'
) {
  if (!hasPermission(profile.role, permission)) throw new ApiError(403, 'FORBIDDEN', message);
}

export function requireOwnerOrPermission(
  profile,
  ownerId,
  permission,
  message = 'You do not have permission to modify this resource'
) {
  if (profile.id !== ownerId && !hasPermission(profile.role, permission))
    throw new ApiError(403, 'FORBIDDEN', message);
}
