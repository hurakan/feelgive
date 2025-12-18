import { Donation } from '@/types';

const STORAGE_KEY = 'feelgive_donations';
const USER_PREFS_KEY = 'feelgive_user_prefs';

export interface UserPreferences {
  monthlyCapEnabled: boolean;
  monthlyCap: number;
  email?: string;
}

export function saveDonation(donation: Donation): void {
  const donations = getDonations();
  donations.unshift(donation); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
}

export function getDonations(): Donation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getTotalDonated(): number {
  const donations = getDonations();
  return donations.reduce((sum, d) => sum + d.amount, 0);
}

export function getDonationsByMonth(): { month: string; total: number }[] {
  const donations = getDonations();
  const byMonth: { [key: string]: number } = {};
  
  donations.forEach(d => {
    const date = new Date(d.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + d.amount;
  });
  
  return Object.entries(byMonth)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export function getCurrentMonthTotal(): number {
  const donations = getDonations();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return donations
    .filter(d => {
      const date = new Date(d.timestamp);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, d) => sum + d.amount, 0);
}

export function getUserPreferences(): UserPreferences {
  const stored = localStorage.getItem(USER_PREFS_KEY);
  if (!stored) {
    return {
      monthlyCapEnabled: false,
      monthlyCap: 50,
    };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return {
      monthlyCapEnabled: false,
      monthlyCap: 50,
    };
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
}

export function updateUserEmail(email: string): void {
  const prefs = getUserPreferences();
  prefs.email = email;
  saveUserPreferences(prefs);
}

export function canDonate(amount: number): { allowed: boolean; reason?: string } {
  const prefs = getUserPreferences();
  
  if (!prefs.monthlyCapEnabled) {
    return { allowed: true };
  }
  
  const currentTotal = getCurrentMonthTotal();
  if (currentTotal + amount > prefs.monthlyCap) {
    return {
      allowed: false,
      reason: `This would exceed your monthly cap of $${prefs.monthlyCap}. You've donated $${currentTotal.toFixed(2)} this month.`,
    };
  }
  
  return { allowed: true };
}

export function generateDonationId(): string {
  return `don_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}