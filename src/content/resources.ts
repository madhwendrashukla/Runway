import { BRAND } from '../config/brand';
import type { Resource } from '../engine/types';

export const RESOURCE_META: Record<Resource, { label: string; color: string }> = {
  cash: { label: 'Cash', color: BRAND.colors.cash },
  users: { label: 'Users', color: BRAND.colors.users },
  team: { label: 'Team', color: BRAND.colors.team },
  cred: { label: 'Cred', color: BRAND.colors.cred },
};
