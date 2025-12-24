/**
 * Test script for improved geographic detection
 * Tests context-aware location identification
 */

// Mock the geographic detection logic
function analyzeLocationContext(content, keyword) {
  const lowerContent = content.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
  const matches = [...lowerContent.matchAll(regex)];
  
  if (matches.length === 0) {
    return { isSubject: false, contextScore: 0 };
  }
  
  let subjectScore = 0;
  let contextScore = 0;
  
  for (const match of matches) {
    const index = match.index;
    const beforeContext = lowerContent.substring(Math.max(0, index - 100), index);
    const afterContext = lowerContent.substring(index, Math.min(lowerContent.length, index + 100));
    const fullContext = beforeContext + afterContext;
    
    // SUBJECT INDICATORS
    if (
      /\bin\s+\w+$/i.test(beforeContext) ||
      /^[^,]{0,20}\s+(is|are|has|have|faces|facing|experiencing|suffers?|hit|struck|affected)/i.test(afterContext) ||
      /^[^,]{0,30}$/i.test(afterContext.split(/[.!?]/)[0])
    ) {
      subjectScore += 3;
      contextScore += 3;
    }
    
    if (
      /\b(crisis|disaster|emergency|situation|conflict|war|outbreak|epidemic)\s+in\s+\w+$/i.test(beforeContext) ||
      /^[^,]{0,20}\s+(residents|people|population|civilians|victims|survivors)/i.test(afterContext)
    ) {
      subjectScore += 2;
      contextScore += 2;
    }
    
    // COMPARISON INDICATORS (NEGATIVE)
    if (
      /\b(like|similar to|compared to|than|versus|vs\.?|unlike|except)\s+\w+$/i.test(beforeContext) ||
      /\b(second|third|fourth|largest|biggest|smaller|larger|after|behind)\s+\w+$/i.test(beforeContext) ||
      /^[^,]{0,20}\s+(is|was|has)\s+(second|third|largest|biggest|smaller)/i.test(afterContext)
    ) {
      subjectScore -= 2;
      contextScore -= 1;
    }
    
    if (
      /\b(also|too|as well|similarly|likewise)\b/i.test(fullContext) ||
      /\b(other|another|different)\s+\w+$/i.test(beforeContext)
    ) {
      subjectScore -= 1;
    }
    
    // TITLE BOOST
    if (index < 100) {
      subjectScore += 2;
      contextScore += 2;
    }
    
    // FREQUENCY BOOST
    if (matches.length >= 3) {
      contextScore += 1;
    }
  }
  
  return {
    isSubject: subjectScore > 0,
    contextScore: Math.max(0, contextScore)
  };
}

// Test cases
const testCases = [
  {
    name: "Congo Basin Comparison (should detect Amazon, not Congo)",
    content: "Amazon Rainforest Faces Unprecedented Deforestation Crisis. The Amazon rainforest is experiencing record levels of deforestation, threatening biodiversity. The Congo basin is the second largest rainforest but the Amazon remains the most critical.",
    expectedLocation: "Amazon",
    testLocations: {
      "Amazon": ["amazon", "rainforest"],
      "Congo": ["congo"]
    }
  },
  {
    name: "Direct Crisis Location (should detect Gaza)",
    content: "Gaza Faces Humanitarian Crisis as Aid Blocked. Gaza residents are experiencing severe shortages of food and medical supplies. The situation in Gaza has deteriorated rapidly.",
    expectedLocation: "Gaza",
    testLocations: {
      "Gaza": ["gaza"],
      "Palestine": ["palestine"]
    }
  },
  {
    name: "Multiple Mentions with Subject (should detect India)",
    content: "Monsoon Floods Devastate India. Heavy monsoon rains in India have displaced thousands. India's emergency services are overwhelmed. Similar to Bangladesh last year, India faces a major crisis.",
    expectedLocation: "India",
    testLocations: {
      "India": ["india"],
      "Bangladesh": ["bangladesh"]
    }
  },
  {
    name: "Comparison Context (should detect California, not Greece)",
    content: "California Wildfires Rage Out of Control. California is experiencing its worst wildfire season on record. The fires are larger than those seen in Greece last summer.",
    expectedLocation: "California",
    testLocations: {
      "California": ["california"],
      "Greece": ["greece"]
    }
  },
  {
    name: "Title Location (should detect Yemen)",
    content: "Yemen Cholera Outbreak Kills Hundreds. A cholera outbreak in Yemen has claimed hundreds of lives. Yemen's healthcare system has collapsed.",
    expectedLocation: "Yemen",
    testLocations: {
      "Yemen": ["yemen"],
      "Global": ["global"]
    }
  }
];

console.log("🧪 Testing Geographic Detection Improvements\n");
console.log("=" .repeat(80));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n📋 Test: ${testCase.name}`);
  console.log(`Expected: ${testCase.expectedLocation}`);
  console.log(`Content: "${testCase.content.substring(0, 100)}..."`);
  
  const results = [];
  
  for (const [location, keywords] of Object.entries(testCase.testLocations)) {
    let totalContextScore = 0;
    let isSubject = false;
    let matchCount = 0;
    
    for (const keyword of keywords) {
      if (testCase.content.toLowerCase().includes(keyword.toLowerCase())) {
        matchCount++;
        const analysis = analyzeLocationContext(testCase.content, keyword);
        totalContextScore += analysis.contextScore;
        if (analysis.isSubject) {
          isSubject = true;
        }
      }
    }
    
    if (matchCount > 0) {
      results.push({
        location,
        matchCount,
        contextScore: totalContextScore,
        isSubject
      });
    }
  }
  
  // Sort by priority
  results.sort((a, b) => {
    if (a.isSubject && !b.isSubject) return -1;
    if (!a.isSubject && b.isSubject) return 1;
    if (a.contextScore !== b.contextScore) return b.contextScore - a.contextScore;
    return b.matchCount - a.matchCount;
  });
  
  console.log("\n  Analysis:");
  for (const result of results) {
    console.log(`    ${result.location}: matches=${result.matchCount}, context=${result.contextScore}, isSubject=${result.isSubject}`);
  }
  
  const detectedLocation = results.length > 0 && (results[0].contextScore > 0 || results[0].isSubject) 
    ? results[0].location 
    : "Global";
  
  const testPassed = detectedLocation === testCase.expectedLocation;
  
  if (testPassed) {
    console.log(`\n  ✅ PASSED: Detected ${detectedLocation}`);
    passed++;
  } else {
    console.log(`\n  ❌ FAILED: Detected ${detectedLocation}, expected ${testCase.expectedLocation}`);
    failed++;
  }
  
  console.log("-".repeat(80));
}

console.log(`\n${"=".repeat(80)}`);
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log("🎉 All tests passed! Geographic detection is working correctly.");
} else {
  console.log("⚠️  Some tests failed. Review the logic for edge cases.");
}