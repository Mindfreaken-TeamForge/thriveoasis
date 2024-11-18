export type OasisRole = 'owner' | 'administrator' | 'moderator' | 'member';

export interface TabPermissions {
  community: boolean;
  moderation: boolean;
  admin: boolean;
  settings: boolean;
}

export function getTabPermissions(role: OasisRole | null): TabPermissions {
  switch (role) {
    case 'owner':
      return {
        community: true,
        moderation: true,
        admin: true,
        settings: true
      };
    case 'administrator':
      return {
        community: true,
        moderation: true,
        admin: true,
        settings: false
      };
    case 'moderator':
      return {
        community: true,
        moderation: true,
        admin: false,
        settings: false
      };
    case 'member':
    default:
      return {
        community: true,
        moderation: false,
        admin: false,
        settings: false
      };
  }
} 