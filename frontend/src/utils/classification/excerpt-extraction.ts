export function extractExcerpts(
  text: string,
  keywords: string[],
  maxExcerpts: number = 3
): string[] {
  const excerpts: string[] = [];
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let keywordCount = 0;
    
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        keywordCount++;
      }
    }
    
    return { sentence, keywordCount };
  });

  scoredSentences
    .filter(s => s.keywordCount > 0)
    .sort((a, b) => b.keywordCount - a.keywordCount)
    .slice(0, maxExcerpts)
    .forEach(s => excerpts.push(s.sentence));
  
  return excerpts;
}