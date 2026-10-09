import type { Resource } from '../engine/types';

export const DEATHS: Record<Resource, Record<'low' | 'high', { title: string; line: string }>> = {
  cash: {
    low: { title: 'Payroll bounced.', line: 'The bank called before your team did.' },
    high: { title: 'Forced out for hoarding.', line: 'The board wanted growth, not a savings account.' },
  },
  users: {
    low: { title: 'Nobody came.', line: 'The product works perfectly. No one is using it.' },
    high: { title: 'Drowned in signups.', line: 'The support queue hit four days. Then it stopped mattering.' },
  },
  team: {
    low: { title: 'Everyone quit.', line: 'The last engineer left a polite note and the server password.' },
    high: { title: 'Overhired.', line: 'Sixty people, eleven standups, and nobody knows who owns checkout.' },
  },
  cred: {
    low: { title: 'No one takes your calls.', line: "Your emails don't bounce. They just vanish." },
    high: { title: 'Overhyped.', line: 'You promised the moon on stage. The moon is running late.' },
  },
};
