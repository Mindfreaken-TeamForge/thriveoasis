export type RoleType = 'owner' | 'admin' | 'moderator' | 'member';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'moderation' | 'content' | 'voice' | 'advanced';
}

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  color: string;
  permissions: string[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export const DEFAULT_PERMISSIONS: Record<RoleType, string[]> = {
  owner: [
    'manage_oasis',
    'manage_roles',
    'manage_members',
    'manage_bans',
    'manage_invites',
    'manage_channels',
    'manage_webhooks',
    'view_audit_log',
    'create_posts',
    'delete_posts',
    'pin_messages',
    'mention_everyone',
    'manage_nicknames',
    'kick_members',
    'ban_members',
    'view_analytics',
    'administrator'
  ],
  admin: [
    'manage_members',
    'manage_bans',
    'manage_invites',
    'manage_channels',
    'view_audit_log',
    'create_posts',
    'delete_posts',
    'pin_messages',
    'mention_everyone',
    'manage_nicknames',
    'kick_members',
    'ban_members',
    'view_analytics'
  ],
  moderator: [
    'manage_bans',
    'view_audit_log',
    'create_posts',
    'delete_posts',
    'pin_messages',
    'manage_nicknames',
    'kick_members',
    'ban_members'
  ],
  member: [
    'create_posts',
    'view_channels'
  ]
};

export const PERMISSION_CATEGORIES = {
  general: [
    'view_channels',
    'manage_channels',
    'create_invites',
    'manage_nicknames'
  ],
  moderation: [
    'kick_members',
    'ban_members',
    'manage_messages',
    'view_audit_log'
  ],
  content: [
    'create_posts',
    'delete_posts',
    'pin_messages',
    'mention_everyone'
  ],
  voice: [
    'connect',
    'speak',
    'stream',
    'mute_members',
    'deafen_members',
    'move_members'
  ],
  advanced: [
    'manage_roles',
    'manage_webhooks',
    'manage_oasis',
    'administrator'
  ]
};