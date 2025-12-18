import { Donation } from '@/types';
import { getCauseLabel } from './classification';

export function generateImpactMessage(donation: Donation): string {
  const templates = {
    disaster_relief: [
      `Your $${donation.amount} helps provide emergency supplies to families affected by disasters.`,
      `Thanks to your $${donation.amount}, emergency responders can reach more people in need.`,
      `Your $${donation.amount} contribution supports immediate relief efforts for disaster survivors.`,
    ],
    health_crisis: [
      `Your $${donation.amount} helps deliver critical medical care to those facing health emergencies.`,
      `Thanks to your $${donation.amount}, vulnerable communities can access life-saving healthcare.`,
      `Your $${donation.amount} supports medical teams responding to health crises.`,
    ],
    climate_events: [
      `Your $${donation.amount} helps communities recover from climate-related disasters.`,
      `Thanks to your $${donation.amount}, families can rebuild after extreme weather events.`,
      `Your $${donation.amount} supports climate resilience and recovery efforts.`,
    ],
    humanitarian_crisis: [
      `Your $${donation.amount} provides shelter and food to displaced families.`,
      `Thanks to your $${donation.amount}, refugees receive essential humanitarian aid.`,
      `Your $${donation.amount} helps protect vulnerable populations in crisis zones.`,
    ],
    social_justice: [
      `Your $${donation.amount} supports communities fighting for equality and justice.`,
      `Thanks to your $${donation.amount}, marginalized voices can be heard.`,
      `Your $${donation.amount} helps create opportunities for underserved communities.`,
    ],
  };

  const messages = templates[donation.cause];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function generateMonthlySummary(donations: Donation[]): string {
  if (donations.length === 0) {
    return "You haven't made any donations yet. Start turning moments of emotion into moments of impact!";
  }

  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const causes = new Set(donations.map(d => d.cause));
  const causeList = Array.from(causes).map(c => getCauseLabel(c)).join(', ');

  if (donations.length === 1) {
    return `This month, you donated $${total} to support ${causeList}. Every contribution makes a difference!`;
  }

  return `This month, you made ${donations.length} donations totaling $${total} across ${causes.size} cause${causes.size > 1 ? 's' : ''}: ${causeList}. Your generosity is creating real impact!`;
}

export function generateWeeklySummary(donations: Donation[]): string {
  if (donations.length === 0) {
    return "No donations this week. When you see a story that moves you, FeelGive makes it easy to help.";
  }

  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  
  if (donations.length === 1) {
    return `This week, you donated $${total} to ${donations[0].charityName}. Thank you for taking action!`;
  }

  return `This week, you made ${donations.length} donations totaling $${total}. You're turning empathy into action!`;
}