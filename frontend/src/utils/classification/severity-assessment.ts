import { Classification } from '@/types';
import { SeverityIndicators } from './types';

export function assessSeverity(content: string, matchedKeywords: string[]): Classification['severityAssessment'] {
  const lowerContent = content.toLowerCase();
  
  let deathToll: number | undefined;
  let peopleAffected: number | undefined;
  let severityNarrative: string[] = [];
  
  // Extract death toll with context
  const deathPatterns = [
    /(\d+(?:,\d+)*)\s+(?:people\s+)?(?:have\s+)?died/i,
    /death\s+toll.*?(\d+(?:,\d+)*)/i,
    /(\d+(?:,\d+)*)\s+deaths/i,
    /killed\s+(?:at\s+least\s+)?(\d+(?:,\d+)*)/i,
    /(\d+(?:,\d+)*)\s+(?:people\s+)?killed/i
  ];
  
  for (const pattern of deathPatterns) {
    const match = content.match(pattern);
    if (match) {
      deathToll = parseInt(match[1].replace(/,/g, ''));
      const matchIndex = content.indexOf(match[0]);
      const contextStart = Math.max(0, matchIndex - 50);
      const contextEnd = Math.min(content.length, matchIndex + match[0].length + 50);
      const contextSnippet = content.substring(contextStart, contextEnd).trim();
      severityNarrative.push(contextSnippet);
      break;
    }
  }
  
  // Extract people affected - PRIORITIZE TOTALS OVER RATES
  const affectedPatterns = [
    // Pattern for TOTALS (check these FIRST)
    /(\d+(?:,\d+)*)\s+survivors sought care/i,
    /(\d+(?:,\d+)*)\s+(?:people|survivors|patients).*?(?:affected|displaced|evacuated|facing|sought|reached)/i,
    /(?:affected|displaced|evacuated|sought|reached).*?(\d+(?:,\d+)*)\s+(?:people|survivors|patients|families)/i,
    /(\d+(?:,\d+)*)\s+(?:million|m)\s+(?:people|survivors|patients)/i,
    /(\d+(?:,\d+)*)\s+(?:families|residents|civilians|survivors)/i,
    // Pattern for rates (check these LAST, and DON'T use as peopleAffected)
    /(\d+(?:,\d+)*)\s+(?:people|survivors|patients|individuals)?\s*(?:a|per)?\s*day/i,
    /(\d+(?:,\d+)*)\s+(?:people|survivors|patients|individuals)?\s*(?:a|per)?\s*week/i,
    /(\d+(?:,\d+)*)\s+(?:people|survivors|patients|individuals)?\s*(?:a|per)?\s*month/i,
  ];
  
  for (const pattern of affectedPatterns) {
    const match = content.match(pattern);
    if (match) {
      let number = parseInt(match[1].replace(/,/g, ''));
      const matchText = match[0].toLowerCase();
      
      // Check if it's a rate (per day/week/month)
      const isRate = matchText.includes('per day') || matchText.includes('a day') || 
                     matchText.includes('per week') || matchText.includes('a week') ||
                     matchText.includes('per month') || matchText.includes('a month');
      
      if (matchText.includes('million')) {
        number = number * 1000000;
      }
      
      // Only use as peopleAffected if it's NOT a rate
      if (!isRate) {
        peopleAffected = number;
      }
      
      // Extract context for narrative
      if (isRate) {
        const sentences = content.split(/[.!?]+/);
        const matchSentenceIndex = sentences.findIndex(s => s.includes(match[0]));
        
        if (matchSentenceIndex !== -1) {
          const contextSentences = sentences.slice(
            Math.max(0, matchSentenceIndex - 1), 
            Math.min(sentences.length, matchSentenceIndex + 2)
          );
          const contextSnippet = contextSentences.join('. ').trim().replace(/\s+/g, ' ');
          severityNarrative.push(contextSnippet);
        }
      } else {
        const matchIndex = content.indexOf(match[0]);
        const contextStart = Math.max(0, matchIndex - 80);
        const contextEnd = Math.min(content.length, matchIndex + match[0].length + 80);
        const contextSnippet = content.substring(contextStart, contextEnd).trim().replace(/\s+/g, ' ');
        severityNarrative.push(contextSnippet);
      }
      
      // If we found a total (not a rate), stop looking
      if (!isRate) {
        break;
      }
    }
  }
  
  // Extract qualitative severity indicators
  const qualitativeIndicators = [
    /too late for (?:preventive )?treatment/i,
    /never reached (?:care|help|assistance)/i,
    /overwhelmed (?:by|with)/i,
    /running out of/i,
    /insufficient (?:supplies|resources|capacity)/i,
    /desperate (?:need|situation)/i,
    /critical (?:shortage|condition)/i,
    /rapidly (?:spreading|worsening|deteriorating)/i,
    /escalating (?:crisis|emergency)/i,
    /unprecedented (?:scale|numbers)/i
  ];
  
  for (const pattern of qualitativeIndicators) {
    const match = content.match(pattern);
    if (match) {
      const matchIndex = content.indexOf(match[0]);
      const contextStart = Math.max(0, matchIndex - 60);
      const contextEnd = Math.min(content.length, matchIndex + match[0].length + 60);
      const contextSnippet = content.substring(contextStart, contextEnd).trim().replace(/\s+/g, ' ');
      severityNarrative.push(contextSnippet);
    }
  }
  
  // Determine system status
  let systemStatus: SeverityIndicators['systemStatus'] = 'normal';
  
  if (lowerContent.includes('collapsed') || 
      lowerContent.includes('no access') ||
      lowerContent.includes('completely destroyed') ||
      lowerContent.includes('system failure')) {
    systemStatus = 'collapsed';
  } else if (lowerContent.includes('overwhelmed') ||
             lowerContent.includes('at capacity') ||
             lowerContent.includes('running out') ||
             lowerContent.includes('insufficient')) {
    systemStatus = 'overwhelmed';
  } else if (lowerContent.includes('strained') ||
             lowerContent.includes('struggling') ||
             lowerContent.includes('limited capacity')) {
    systemStatus = 'strained';
  } else if (lowerContent.includes('coping') ||
             lowerContent.includes('managing') ||
             lowerContent.includes('responding')) {
    systemStatus = 'coping';
  }
  
  // Check for imminent risk
  const imminentRisk = lowerContent.includes('imminent') ||
                       lowerContent.includes('spreading') ||
                       lowerContent.includes('worsening') ||
                       lowerContent.includes('escalating') ||
                       lowerContent.includes('approaching') ||
                       lowerContent.includes('urgent');
  
  // Calculate severity level
  let level: 'extreme' | 'high' | 'moderate' | 'low' = 'low';
  const reasons: string[] = [];
  
  if ((deathToll && deathToll > 100) ||
      (peopleAffected && peopleAffected > 1000000) ||
      systemStatus === 'collapsed' ||
      (imminentRisk && (lowerContent.includes('famine') || lowerContent.includes('epidemic')))) {
    level = 'extreme';
    if (deathToll && deathToll > 100) reasons.push(`${deathToll} deaths`);
    if (peopleAffected && peopleAffected > 1000000) reasons.push(`${(peopleAffected / 1000000).toFixed(1)}M people affected`);
    if (systemStatus === 'collapsed') reasons.push('system collapsed');
    if (imminentRisk) reasons.push('imminent mass casualties');
  }
  else if ((deathToll && deathToll >= 10) ||
           (peopleAffected && peopleAffected >= 100000) ||
           systemStatus === 'overwhelmed' ||
           (imminentRisk && systemStatus === 'strained')) {
    level = 'high';
    if (deathToll && deathToll >= 10) reasons.push(`${deathToll} deaths`);
    if (peopleAffected && peopleAffected >= 100000) reasons.push(`${(peopleAffected / 1000).toFixed(0)}K people affected`);
    if (systemStatus === 'overwhelmed') reasons.push('system overwhelmed');
    if (imminentRisk) reasons.push('serious imminent risk');
  }
  else if ((deathToll && deathToll > 0) ||
           (peopleAffected && peopleAffected >= 10000) ||
           systemStatus === 'strained') {
    level = 'moderate';
    if (deathToll) reasons.push(`${deathToll} deaths`);
    if (peopleAffected && peopleAffected >= 10000) reasons.push(`${(peopleAffected / 1000).toFixed(0)}K people affected`);
    if (systemStatus === 'strained') reasons.push('system strained');
  }
  else {
    reasons.push('limited scale or potential future impact');
  }
  
  // Build comprehensive reasoning with narrative context
  let reasoning = reasons.length > 0 ? reasons.join('; ') : 'No clear severity indicators detected';
  
  // Deduplicate and clean narratives
  if (severityNarrative.length > 0) {
    const uniqueNarratives = deduplicateSnippets(severityNarrative);
    
    if (uniqueNarratives.length > 0) {
      reasoning += '\n\nContext: ' + uniqueNarratives.join(' ... ');
    }
  }
  
  return {
    level,
    deathToll,
    peopleAffected,
    systemStatus,
    imminentRisk,
    reasoning
  };
}

function deduplicateSnippets(snippets: string[]): string[] {
  if (snippets.length === 0) return [];
  
  const validSnippets = snippets.filter(s => s.length > 30);
  if (validSnippets.length === 0) return [];
  
  validSnippets.sort((a, b) => b.length - a.length);
  
  const unique: string[] = [];
  
  for (const snippet of validSnippets) {
    const isSubstring = unique.some(existing => {
      const overlap = calculateOverlap(snippet, existing);
      return overlap > 0.8;
    });
    
    if (!isSubstring) {
      unique.push(snippet);
    }
    
    if (unique.length >= 2) break;
  }
  
  return unique;
}

function calculateOverlap(str1: string, str2: string): number {
  const shorter = str1.length < str2.length ? str1 : str2;
  const longer = str1.length < str2.length ? str2 : str1;
  
  const normalizedShorter = shorter.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedLonger = longer.toLowerCase().replace(/\s+/g, ' ').trim();
  
  if (normalizedLonger.includes(normalizedShorter)) {
    return 1.0;
  }
  
  const windowSize = Math.floor(normalizedShorter.length * 0.5);
  let maxOverlap = 0;
  
  for (let i = 0; i <= normalizedShorter.length - windowSize; i++) {
    const window = normalizedShorter.substring(i, i + windowSize);
    if (normalizedLonger.includes(window)) {
      maxOverlap = Math.max(maxOverlap, windowSize / normalizedShorter.length);
    }
  }
  
  return maxOverlap;
}