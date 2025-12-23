import { Donation, UserProfile, ImpactStory, MonthlyReport, ImpactMetric, CauseCategory, FollowUpStory, Classification } from '@/types';
import { getCauseLabel } from './classification';
import { getDonations, getTotalDonated, getCurrentMonthTotal } from './donations';

const FOLLOW_UP_STORAGE_KEY = 'feelgive_follow_up_stories';

// Impact conversion rates (how much impact per dollar) - EXPORTED
export const IMPACT_CONVERSIONS = {
  disaster_relief: {
    meals: 3,
    shelterDays: 0.5,
    emergencyKits: 0.2,
    families: 0.1,
  },
  health_crisis: {
    treatments: 2,
    vaccines: 5,
    medicalSupplies: 1,
    patients: 0.5,
  },
  climate_events: {
    trees: 10,
    families: 0.2,
    acres: 0.1,
    shelters: 0.1,
  },
  humanitarian_crisis: {
    meals: 4,
    shelterDays: 1,
    families: 0.15,
    supplies: 2,
  },
  social_justice: {
    students: 0.5,
    families: 0.2,
    programs: 0.1,
    communities: 0.05,
  },
};

export class StorytellerAgent {
  /**
   * Generate personalized impact story immediately after donation
   */
  static createImpactStory(
    donation: Donation, 
    userProfile: UserProfile,
    classification?: Classification
  ): ImpactStory {
    // Use classification data to create highly specific stories
    const affectedGroup = classification?.affectedGroups?.[0] || 'people in need';
    const geoName = classification?.geoName || donation.geo;
    const identifiedNeeds = classification?.identified_needs || [];
    const severityLevel = classification?.severityAssessment?.level || 'moderate';
    const articleTitle = donation.articleTitle;
    
    // Calculate specific impact metrics
    const conversions = IMPACT_CONVERSIONS[donation.cause];
    
    // Generate narrative based on cause and context
    let narrative = '';
    let visualSuggestion = '';
    let shareableQuote = '';
    let tone: ImpactStory['emotionalTone'] = 'hopeful';
    
    switch (donation.cause) {
      case 'disaster_relief':
        const meals = Math.floor(donation.amount * conversions.meals);
        const families = Math.max(1, Math.floor(donation.amount * conversions.families));
        
        if (severityLevel === 'extreme' || severityLevel === 'high') {
          narrative = `Right now in ${geoName}, ${affectedGroup} are facing a critical emergency${articleTitle ? ` following ${articleTitle.toLowerCase()}` : ''}. Your $${donation.amount} donation to ${donation.charityName} is providing ${meals} emergency meals and essential supplies to ${families} ${families === 1 ? 'family' : 'families'} who lost everything. Emergency responders are distributing these supplies as we speak. Your quick action is saving lives.`;
          tone = 'urgent';
        } else {
          narrative = `In ${geoName}, ${affectedGroup} are rebuilding after disaster${articleTitle ? ` (${articleTitle.toLowerCase()})` : ''}. Your $${donation.amount} to ${donation.charityName} is helping ${families} ${families === 1 ? 'family' : 'families'} get back on their feet with ${meals} meals and emergency supplies. They're receiving help right now because of your generosity.`;
          tone = 'hopeful';
        }
        
        visualSuggestion = `Image of ${affectedGroup} in ${geoName} receiving emergency supplies and food`;
        shareableQuote = `${meals} meals for families in crisis. $${donation.amount} = immediate relief for ${families} ${families === 1 ? 'family' : 'families'} in ${geoName}.`;
        break;
        
      case 'health_crisis':
        const treatments = Math.floor(donation.amount * conversions.treatments);
        const patients = Math.max(1, Math.floor(donation.amount * conversions.patients));
        
        if (identifiedNeeds.includes('medical')) {
          narrative = `In ${geoName}, ${affectedGroup} urgently need medical care${articleTitle ? ` due to ${articleTitle.toLowerCase()}` : ''}. Your $${donation.amount} donation to ${donation.charityName} is delivering ${treatments} critical medical treatments to ${patients} ${patients === 1 ? 'person' : 'people'} right now. Healthcare workers are using these resources to save lives as we speak. Your donation is literally keeping people alive.`;
          tone = 'urgent';
        } else {
          narrative = `Your $${donation.amount} is bringing healthcare to ${affectedGroup} in ${geoName}${articleTitle ? ` affected by ${articleTitle.toLowerCase()}` : ''}. ${donation.charityName} is providing ${treatments} treatments to ${patients} ${patients === 1 ? 'person' : 'people'} who desperately need medical attention. Doctors and nurses now have the supplies they need to help more patients.`;
          tone = 'hopeful';
        }
        
        visualSuggestion = `Image of healthcare workers treating ${affectedGroup} in ${geoName}`;
        shareableQuote = `${treatments} life-saving treatments delivered. $${donation.amount} = medical care for ${patients} ${patients === 1 ? 'person' : 'people'} in ${geoName}.`;
        break;
        
      case 'climate_events':
        const trees = Math.floor(donation.amount * conversions.trees);
        const climateFamilies = Math.max(1, Math.floor(donation.amount * conversions.families));
        
        if (identifiedNeeds.includes('shelter')) {
          narrative = `After climate disaster in ${geoName}${articleTitle ? ` (${articleTitle.toLowerCase()})` : ''}, ${affectedGroup} need safe shelter. Your $${donation.amount} to ${donation.charityName} is building climate-resilient emergency shelter for ${climateFamilies} ${climateFamilies === 1 ? 'family' : 'families'}. Plus, your donation is planting ${trees} trees to restore the damaged ecosystem and prevent future disasters. You're helping communities survive today and build resilience for tomorrow.`;
          tone = 'hopeful';
        } else {
          narrative = `Your $${donation.amount} is fighting climate change in ${geoName}${articleTitle ? ` where ${articleTitle.toLowerCase()}` : ''}. ${donation.charityName} is planting ${trees} trees and helping ${climateFamilies} ${climateFamilies === 1 ? 'family' : 'families'} of ${affectedGroup} adapt to extreme weather. These trees will absorb carbon, prevent erosion, and provide shade for generations. Your donation is healing the planet.`;
          tone = 'inspiring';
        }
        
        visualSuggestion = `Image of reforestation and climate-resilient shelter construction in ${geoName}`;
        shareableQuote = `${trees} trees planted + shelter for ${climateFamilies} ${climateFamilies === 1 ? 'family' : 'families'}. $${donation.amount} = climate action in ${geoName}.`;
        break;
        
      case 'humanitarian_crisis':
        const humanitarianMeals = Math.floor(donation.amount * conversions.meals);
        const shelterDays = Math.floor(donation.amount * conversions.shelterDays);
        const humanitarianFamilies = Math.max(1, Math.floor(donation.amount * conversions.families));
        
        if (severityLevel === 'extreme') {
          narrative = `Right now in ${geoName}, ${affectedGroup} are fleeing violence and persecution${articleTitle ? ` (${articleTitle.toLowerCase()})` : ''}. Your $${donation.amount} to ${donation.charityName} is providing ${humanitarianMeals} emergency meals and ${shelterDays} days of safe shelter for ${humanitarianFamilies} displaced ${humanitarianFamilies === 1 ? 'family' : 'families'}. They're receiving food, water, and safety right now because you took action. In their darkest hour, you brought hope.`;
          tone = 'urgent';
        } else {
          narrative = `In ${geoName}, ${affectedGroup} who fled crisis${articleTitle ? ` (${articleTitle.toLowerCase()})` : ''} are finding refuge. Your $${donation.amount} to ${donation.charityName} is feeding ${humanitarianFamilies} ${humanitarianFamilies === 1 ? 'family' : 'families'} with ${humanitarianMeals} meals and providing ${shelterDays} days of shelter. Families who lost everything now have food, safety, and dignity because of your compassion.`;
          tone = 'grateful';
        }
        
        visualSuggestion = `Image of ${affectedGroup} receiving humanitarian aid in ${geoName}`;
        shareableQuote = `${humanitarianMeals} meals + ${shelterDays} days of shelter. $${donation.amount} = safety for ${humanitarianFamilies} displaced ${humanitarianFamilies === 1 ? 'family' : 'families'} in ${geoName}.`;
        break;
        
      case 'social_justice':
        const students = Math.max(1, Math.floor(donation.amount * conversions.students));
        const justiceFamilies = Math.max(1, Math.floor(donation.amount * conversions.families));
        
        if (identifiedNeeds.includes('legal_aid')) {
          narrative = `In ${geoName}, ${affectedGroup} are fighting for their rights${articleTitle ? ` (${articleTitle.toLowerCase()})` : ''}. Your $${donation.amount} to ${donation.charityName} is providing legal representation and advocacy support for ${justiceFamilies} ${justiceFamilies === 1 ? 'family' : 'families'}. Lawyers are taking their cases right now. Your donation is amplifying voices that deserve to be heard and protecting people from injustice.`;
          tone = 'inspiring';
        } else if (identifiedNeeds.includes('education')) {
          narrative = `Your $${donation.amount} is opening doors for ${affectedGroup} in ${geoName}${articleTitle ? ` facing ${articleTitle.toLowerCase()}` : ''}. ${donation.charityName} is providing educational support for ${students} ${students === 1 ? 'student' : 'students'} from marginalized communities. These young people now have access to tutoring, scholarships, and resources that will change their lives. Education is the key to breaking cycles of inequality, and you just unlocked that door.`;
          tone = 'inspiring';
        } else {
          narrative = `In ${geoName}, ${affectedGroup} are organizing for justice${articleTitle ? ` (${articleTitle.toLowerCase()})` : ''}. Your $${donation.amount} to ${donation.charityName} is empowering ${justiceFamilies} ${justiceFamilies === 1 ? 'family' : 'families'} with community organizing resources, advocacy training, and support. Grassroots leaders are building power right now because of your support. You're helping create lasting systemic change.`;
          tone = 'inspiring';
        }
        
        visualSuggestion = `Image of ${affectedGroup} in ${geoName} accessing education and advocacy support`;
        shareableQuote = `Justice for ${justiceFamilies} ${justiceFamilies === 1 ? 'family' : 'families'}. $${donation.amount} = empowerment for ${affectedGroup} in ${geoName}.`;
        break;
    }
    
    // Generate follow-up story
    const followUpStory = this.generateFollowUpStory(
      donation.amount,
      geoName,
      donation.charityName,
      donation.cause,
      affectedGroup
    );
    
    // Schedule follow-up story
    this.scheduleFollowUpStory(donation.id, followUpStory, 7);
    
    return {
      narrative,
      visualSuggestion,
      shareableQuote,
      followUpStory,
      emotionalTone: tone,
    };
  }

  private static generateFollowUpStory(
    amount: number,
    geo: string,
    charity: string,
    cause: CauseCategory,
    affectedGroup: string
  ): string {
    const templates = {
      disaster_relief: [
        `One week update: The emergency response you supported in ${geo} has now built 50 temporary shelters. Your $${amount} was part of helping 2,000 ${affectedGroup} find safety. ${charity} reports that families are starting to rebuild their lives.`,
        `Update from ${geo}: The food program you funded has distributed 100,000 meals this week. Your $${amount} helped feed thousands of ${affectedGroup}. ${charity} says the immediate crisis is stabilizing thanks to donors like you.`,
      ],
      health_crisis: [
        `Health update from ${geo}: ${charity} has treated 3,000 ${affectedGroup} this week. Your $${amount} was part of this life-saving medical response. Mobile clinics are reaching remote areas because of support like yours.`,
        `One week later: The medical supplies you helped fund are being used in 15 facilities across ${geo}. Your $${amount} is saving lives every day. Healthcare workers send their gratitude.`,
      ],
      climate_events: [
        `Climate action update: ${charity} planted 50,000 trees in ${geo} this week. Your $${amount} was part of this massive effort. These trees will restore ecosystems and fight climate change for generations.`,
        `Update from ${geo}: The climate-resilient shelters you helped fund now protect 500 ${affectedGroup} from extreme weather. Your $${amount} is creating lasting safety.`,
      ],
      humanitarian_crisis: [
        `Refugee support update: ${charity} has provided shelter for 8,000 ${affectedGroup} in ${geo}. Your $${amount} was part of this humanitarian response. Families who fled violence now have safety and hope.`,
        `One week later: The food program you supported distributed 100,000 meals to ${affectedGroup} in ${geo}. Your $${amount} helped feed thousands. Your compassion is making a real difference.`,
      ],
      social_justice: [
        `Justice update from ${geo}: ${charity} provided legal aid to 50 ${affectedGroup} this week. Your $${amount} helped families fight discrimination and injustice. Real change is happening.`,
        `Education update: The scholarship program you supported awarded 100 grants to ${affectedGroup} in ${geo}. Your $${amount} opened doors to opportunity. Students from marginalized communities now have access to quality education.`,
      ],
    };
    
    const causeTemplates = templates[cause];
    return causeTemplates[Math.floor(Math.random() * causeTemplates.length)];
  }

  /**
   * Generate monthly impact report
   */
  static generateMonthlyReport(donations: Donation[]): MonthlyReport {
    if (donations.length === 0) {
      return {
        headline: "Start Your Impact Journey",
        story: "You haven't made any donations yet. When you see a story that moves you, FeelGive makes it easy to turn that emotion into action. Your first donation could change someone's life today.",
        impactMetrics: [],
        comparisonToOthers: "Join thousands of people making a difference, one story at a time.",
        suggestedNextAction: "Find a cause that resonates with you and make your first donation.",
        achievements: [],
        topCause: 'disaster_relief',
        totalImpact: "Your impact story starts here.",
      };
    }

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const causes = new Set(donations.map(d => d.cause));
    const causeBreakdown = donations.reduce((acc, d) => {
      acc[d.cause] = (acc[d.cause] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCause = Object.entries(causeBreakdown)
      .sort(([, a], [, b]) => b - a)[0][0] as CauseCategory;

    // Generate headline based on donation count
    let headline: string;
    if (donations.length === 1) {
      headline = "You Made Your First Impact!";
    } else if (donations.length < 5) {
      headline = `${donations.length} Moments of Empathy, ${donations.length} Acts of Impact`;
    } else if (donations.length < 10) {
      headline = `You're Building a Legacy of Generosity`;
    } else {
      headline = `You're a Champion of Change!`;
    }

    // Generate story
    const story = this.generateMonthlyStory(donations, totalAmount, causes.size, topCause);

    // Generate impact metrics
    const impactMetrics = this.calculateImpactMetrics(donations, totalAmount);

    // Generate comparison
    const comparisonToOthers = this.generateComparison(donations.length, totalAmount);

    // Generate suggested next action
    const suggestedNextAction = this.generateNextAction(donations, topCause);

    // Generate achievements
    const achievements = this.generateAchievements(donations, totalAmount);

    // Generate total impact summary
    const totalImpact = this.generateTotalImpact(donations, totalAmount);

    return {
      headline,
      story,
      impactMetrics,
      comparisonToOthers,
      suggestedNextAction,
      achievements,
      topCause,
      totalImpact,
    };
  }

  /**
   * Get pending follow-up stories
   */
  static getPendingFollowUpStories(): FollowUpStory[] {
    const stored = localStorage.getItem(FOLLOW_UP_STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const stories: FollowUpStory[] = JSON.parse(stored);
      const now = Date.now();
      
      // Return stories that are due and not yet delivered
      return stories.filter(s => !s.delivered && s.scheduledFor <= now);
    } catch {
      return [];
    }
  }

  /**
   * Mark follow-up story as delivered
   */
  static markFollowUpDelivered(donationId: string): void {
    const stored = localStorage.getItem(FOLLOW_UP_STORAGE_KEY);
    if (!stored) return;
    
    try {
      const stories: FollowUpStory[] = JSON.parse(stored);
      const updated = stories.map(s => 
        s.donationId === donationId ? { ...s, delivered: true } : s
      );
      localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
  }

  // Private helper methods

  private static scheduleFollowUpStory(
    donationId: string,
    story: string,
    daysFromNow: number
  ): void {
    const scheduledFor = Date.now() + (daysFromNow * 24 * 60 * 60 * 1000);
    
    const followUp: FollowUpStory = {
      donationId,
      scheduledFor,
      delivered: false,
      story,
      updateType: 'one-week',
    };

    const stored = localStorage.getItem(FOLLOW_UP_STORAGE_KEY);
    const existing: FollowUpStory[] = stored ? JSON.parse(stored) : [];
    existing.push(followUp);
    
    localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(existing));
  }

  private static generateMonthlyStory(
    donations: Donation[],
    totalAmount: number,
    causeCount: number,
    topCause: CauseCategory
  ): string {
    if (donations.length === 1) {
      return `This month, you made your first donation of $${totalAmount} to support ${getCauseLabel(topCause).toLowerCase()}. That single act of generosity created real impact. You turned a moment of empathy into a moment of action. This is just the beginning of your impact journey.`;
    }

    if (donations.length < 5) {
      return `This month, you made ${donations.length} donations totaling $${totalAmount} across ${causeCount} ${causeCount === 1 ? 'cause' : 'causes'}. Each time you saw a story that moved you, you took action. Your generosity is creating ripples of positive change across the world.`;
    }

    if (donations.length < 10) {
      return `This month, you turned ${donations.length} moments of empathy into ${donations.length} acts of impact. Your $${totalAmount} in donations supported ${causeCount} different causes. You're not just a donor—you're building a legacy of compassion and action. Your consistency is inspiring.`;
    }

    return `This month, you were a champion of change! ${donations.length} donations, $${totalAmount} in impact, ${causeCount} causes supported. You're in the top tier of givers, consistently turning emotion into action. Your dedication to making the world better is extraordinary. Thank you for your unwavering generosity.`;
  }

  private static calculateImpactMetrics(
    donations: Donation[],
    totalAmount: number
  ): ImpactMetric[] {
    const metrics: ImpactMetric[] = [];

    // Calculate cause-specific impacts
    const causeAmounts = donations.reduce((acc, d) => {
      acc[d.cause] = (acc[d.cause] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    for (const [cause, amount] of Object.entries(causeAmounts)) {
      const conversions = IMPACT_CONVERSIONS[cause as CauseCategory];
      
      switch (cause) {
        case 'disaster_relief':
          metrics.push({
            icon: '',
            label: 'Meals Provided',
            value: Math.floor(amount * conversions.meals).toString(),
            description: 'Emergency food for families in crisis',
          });
          break;
        case 'health_crisis':
          metrics.push({
            icon: '',
            label: 'Treatments Delivered',
            value: Math.floor(amount * conversions.treatments).toString(),
            description: 'Life-saving medical care provided',
          });
          break;
        case 'climate_events':
          metrics.push({
            icon: '',
            label: 'Trees Planted',
            value: Math.floor(amount * conversions.trees).toString(),
            description: 'Restoring ecosystems and fighting climate change',
          });
          break;
        case 'humanitarian_crisis':
          metrics.push({
            icon: '',
            label: 'Shelter Days',
            value: Math.floor(amount * conversions.shelterDays).toString(),
            description: 'Safe refuge for displaced families',
          });
          break;
        case 'social_justice':
          metrics.push({
            icon: '',
            label: 'Students Supported',
            value: Math.floor(amount * conversions.students).toString(),
            description: 'Education access for marginalized youth',
          });
          break;
      }
    }

    // Add total families helped
    const totalFamilies = donations.reduce((sum, d) => {
      const conversions = IMPACT_CONVERSIONS[d.cause];
      return sum + (d.amount * (conversions.families || 0.1));
    }, 0);

    metrics.push({
      icon: '',
      label: 'Families Helped',
      value: Math.floor(totalFamilies).toString(),
      description: 'Lives touched by your generosity',
    });

    return metrics.slice(0, 4); // Return top 4 metrics
  }

  private static generateComparison(donationCount: number, totalAmount: number): string {
    if (donationCount === 1) {
      return "You've joined thousands of people making a difference through FeelGive. Every journey starts with a single step.";
    }

    if (donationCount < 5) {
      return `You're more generous than 60% of FeelGive users. Your consistency is making a real difference.`;
    }

    if (donationCount < 10) {
      return `You're in the top 25% of FeelGive donors! Your dedication to helping others is inspiring.`;
    }

    return `You're in the top 10% of FeelGive champions! Your extraordinary generosity is creating waves of positive change.`;
  }

  private static generateNextAction(donations: Donation[], topCause: CauseCategory): string {
    const causes = new Set(donations.map(d => d.cause));
    
    if (causes.size === 1) {
      return `You've been passionate about ${getCauseLabel(topCause).toLowerCase()}. Consider exploring other causes to broaden your impact.`;
    }

    if (causes.size < 3) {
      return `You've supported ${causes.size} causes. There are ${5 - causes.size} more categories where your help could make a difference.`;
    }

    return `You're supporting multiple causes! Consider setting up a monthly giving goal to maximize your impact.`;
  }

  private static generateAchievements(donations: Donation[], totalAmount: number): string[] {
    const achievements: string[] = [];

    if (donations.length >= 1) achievements.push("First Donation");
    if (donations.length >= 5) achievements.push("5 Donations Milestone");
    if (donations.length >= 10) achievements.push("10 Donations Champion");
    if (totalAmount >= 50) achievements.push("$50+ Impact Maker");
    if (totalAmount >= 100) achievements.push("$100+ Generosity Leader");
    
    const causes = new Set(donations.map(d => d.cause));
    if (causes.size >= 3) achievements.push("Multi-Cause Supporter");
    if (causes.size === 5) achievements.push("All Causes Champion");

    return achievements;
  }

  private static generateTotalImpact(donations: Donation[], totalAmount: number): string {
    const peopleHelped = Math.floor(totalAmount * 2); // Rough estimate: $1 helps 2 people
    
    if (donations.length === 1) {
      return `Your donation helped approximately ${peopleHelped} people. One act of kindness, countless lives touched.`;
    }

    return `Your ${donations.length} donations helped approximately ${peopleHelped} people across ${new Set(donations.map(d => d.cause)).size} causes. Your generosity is creating real, measurable change in the world.`;
  }
}