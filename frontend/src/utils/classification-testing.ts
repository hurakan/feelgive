import { classifyContent } from './classification';
import { CauseCategory } from '@/types';

export interface TestCase {
  id: number;
  title: string;
  source: string;
  url: string;
  category: 'non-crisis' | 'crisis';
  subcategory: string;
  expectedCause: CauseCategory | 'none';
  content: string;
}

export interface TestResult {
  testId: number;
  title: string;
  source: string;
  actualCategory: string;
  predictedCause: CauseCategory | 'none';
  expectedCause: CauseCategory | 'none';
  confidence: number;
  matchedKeywords: string[];
  passed: boolean;
  failureReason?: string;
  fixApplied?: string;
}

// 100 Test Cases
export const TEST_CASES: TestCase[] = [
  // ===== NON-CRISIS CONTENT (50 cases) =====
  
  // Entertainment/Music (10)
  {
    id: 1,
    title: "Here's Your First Look At The Upcoming MEGADETH Documentary - Metal Injection",
    source: "Metal Injection",
    url: "https://metalinjection.net/megadeth-documentary",
    category: 'non-crisis',
    subcategory: 'entertainment-music',
    expectedCause: 'none',
    content: "MEGADETH fans are in for a treat with the upcoming documentary about the legendary metal band. The film features never-before-seen footage, interviews with band members, and behind-the-scenes content from their latest tour. Metal Injection got an exclusive first look at the documentary which will premiere next month."
  },
  {
    id: 2,
    title: "Taylor Swift Announces New Album 'Midnight Fire' - Rolling Stone",
    source: "Rolling Stone",
    url: "https://rollingstone.com/taylor-swift-album",
    category: 'non-crisis',
    subcategory: 'entertainment-music',
    expectedCause: 'none',
    content: "Taylor Swift surprised fans by announcing her new album 'Midnight Fire' will drop next month. The pop superstar revealed the tracklist on social media, sending fans into a frenzy. The album features 13 new songs and marks her return after a two-year hiatus."
  },
  {
    id: 3,
    title: "Coachella 2024 Lineup Announced: Headliners Include Radiohead",
    source: "Billboard",
    url: "https://billboard.com/coachella-2024",
    category: 'non-crisis',
    subcategory: 'entertainment-music',
    expectedCause: 'none',
    content: "The Coachella Valley Music and Arts Festival has announced its 2024 lineup. Radiohead will headline along with other major artists. Tickets go on sale next week for the April festival in Indio, California."
  },
  {
    id: 4,
    title: "Netflix Releases Trailer for New Thriller Series 'Dark Waters'",
    source: "Variety",
    url: "https://variety.com/netflix-dark-waters",
    category: 'non-crisis',
    subcategory: 'entertainment-film',
    expectedCause: 'none',
    content: "Netflix dropped the official trailer for its upcoming thriller series 'Dark Waters' starring Jennifer Lawrence. The 8-episode series premieres next month and follows a detective investigating mysterious disappearances in a coastal town."
  },
  {
    id: 5,
    title: "Broadway Show 'Hamilton' Extends Run Through 2025",
    source: "Playbill",
    url: "https://playbill.com/hamilton-extends",
    category: 'non-crisis',
    subcategory: 'entertainment-theater',
    expectedCause: 'none',
    content: "The hit Broadway musical 'Hamilton' has extended its run through December 2025 due to overwhelming demand. Tickets are now available for the extended dates at the Richard Rodgers Theatre."
  },
  {
    id: 6,
    title: "Beyoncé's Renaissance Tour Breaks Box Office Records",
    source: "Entertainment Weekly",
    url: "https://ew.com/beyonce-tour-records",
    category: 'non-crisis',
    subcategory: 'entertainment-music',
    expectedCause: 'none',
    content: "Beyoncé's Renaissance World Tour has shattered box office records, becoming the highest-grossing tour by a female artist. The tour features elaborate stage production and has received rave reviews from critics."
  },
  {
    id: 7,
    title: "New Video Game 'Starfield' Launches to Critical Acclaim",
    source: "IGN",
    url: "https://ign.com/starfield-launch",
    category: 'non-crisis',
    subcategory: 'entertainment-gaming',
    expectedCause: 'none',
    content: "Bethesda's highly anticipated space RPG 'Starfield' launched yesterday to critical acclaim. The game features over 1,000 planets to explore and has already sold 10 million copies in its first week."
  },
  {
    id: 8,
    title: "Oscars 2024: Complete List of Nominees Announced",
    source: "The Hollywood Reporter",
    url: "https://thr.com/oscars-2024-nominees",
    category: 'non-crisis',
    subcategory: 'entertainment-awards',
    expectedCause: 'none',
    content: "The Academy of Motion Picture Arts and Sciences announced the nominees for the 96th Academy Awards. 'Oppenheimer' leads with 13 nominations, followed by 'Poor Things' with 11. The ceremony will air live on March 10th."
  },
  {
    id: 9,
    title: "Metallica Announces Stadium Tour with Special Guests",
    source: "Loudwire",
    url: "https://loudwire.com/metallica-tour",
    category: 'non-crisis',
    subcategory: 'entertainment-music',
    expectedCause: 'none',
    content: "Metallica has announced a massive stadium tour for summer 2024. The metal legends will be joined by special guests including Pantera and Mammoth WVH. Tickets go on sale Friday."
  },
  {
    id: 10,
    title: "Comic-Con 2024: Marvel Unveils Phase 6 Plans",
    source: "Comic Book Resources",
    url: "https://cbr.com/comic-con-marvel-phase-6",
    category: 'non-crisis',
    subcategory: 'entertainment-comics',
    expectedCause: 'none',
    content: "At San Diego Comic-Con, Marvel Studios president Kevin Feige unveiled the studio's plans for Phase 6 of the MCU. The announcement included release dates for several highly anticipated films and Disney+ series."
  },

  // Sports (10)
  {
    id: 11,
    title: "Lakers Win NBA Championship in Thrilling Game 7",
    source: "ESPN",
    url: "https://espn.com/lakers-championship",
    category: 'non-crisis',
    subcategory: 'sports-basketball',
    expectedCause: 'none',
    content: "The Los Angeles Lakers defeated the Boston Celtics 105-102 in a nail-biting Game 7 to win the NBA Championship. LeBron James scored 35 points and was named Finals MVP for the fifth time in his career."
  },
  {
    id: 12,
    title: "Lionel Messi Scores Hat-Trick in Inter Miami Victory",
    source: "Sports Illustrated",
    url: "https://si.com/messi-hat-trick",
    category: 'non-crisis',
    subcategory: 'sports-soccer',
    expectedCause: 'none',
    content: "Lionel Messi scored three goals to lead Inter Miami to a 4-1 victory over Atlanta United. The Argentine superstar continues to dominate MLS in his first season with the club."
  },
  {
    id: 13,
    title: "Serena Williams Announces Retirement from Tennis",
    source: "The Athletic",
    url: "https://theathletic.com/serena-retirement",
    category: 'non-crisis',
    subcategory: 'sports-tennis',
    expectedCause: 'none',
    content: "Tennis legend Serena Williams announced her retirement from professional tennis after a storied 27-year career. The 23-time Grand Slam champion will play her final tournament at the US Open."
  },
  {
    id: 14,
    title: "Super Bowl LVIII: Chiefs Defeat 49ers in Overtime Thriller",
    source: "NFL.com",
    url: "https://nfl.com/super-bowl-lviii",
    category: 'non-crisis',
    subcategory: 'sports-football',
    expectedCause: 'none',
    content: "The Kansas City Chiefs won Super Bowl LVIII in overtime, defeating the San Francisco 49ers 31-28. Patrick Mahomes threw for 350 yards and three touchdowns, earning his third Super Bowl MVP award."
  },
  {
    id: 15,
    title: "Usain Bolt's 100m World Record Still Stands After 15 Years",
    source: "World Athletics",
    url: "https://worldathletics.org/bolt-record",
    category: 'non-crisis',
    subcategory: 'sports-track',
    expectedCause: 'none',
    content: "Usain Bolt's 100-meter world record of 9.58 seconds, set in 2009, remains unbroken 15 years later. Athletics experts analyze why this record has proven so difficult to beat."
  },
  {
    id: 16,
    title: "Yankees Sign Star Pitcher to Record-Breaking Contract",
    source: "MLB.com",
    url: "https://mlb.com/yankees-signing",
    category: 'non-crisis',
    subcategory: 'sports-baseball',
    expectedCause: 'none',
    content: "The New York Yankees have signed ace pitcher Shohei Ohtani to a record-breaking 10-year, $700 million contract. The deal is the largest in MLB history and makes Ohtani the highest-paid player in baseball."
  },
  {
    id: 17,
    title: "Tour de France 2024: Stage 15 Results and Standings",
    source: "Cycling News",
    url: "https://cyclingnews.com/tour-de-france-stage-15",
    category: 'non-crisis',
    subcategory: 'sports-cycling',
    expectedCause: 'none',
    content: "Stage 15 of the Tour de France saw a dramatic mountain finish with Jonas Vingegaard extending his lead in the yellow jersey. The Danish rider now leads by 2 minutes and 30 seconds heading into the final week."
  },
  {
    id: 18,
    title: "Olympics 2024: USA Tops Medal Count with 40 Golds",
    source: "Olympic.org",
    url: "https://olympic.org/paris-2024-medals",
    category: 'non-crisis',
    subcategory: 'sports-olympics',
    expectedCause: 'none',
    content: "The United States finished atop the medal count at the Paris 2024 Olympics with 40 gold medals and 120 total medals. China finished second with 38 golds, while Great Britain took third with 22 golds."
  },
  {
    id: 19,
    title: "Formula 1: Max Verstappen Wins Monaco Grand Prix",
    source: "F1.com",
    url: "https://f1.com/monaco-gp-2024",
    category: 'non-crisis',
    subcategory: 'sports-racing',
    expectedCause: 'none',
    content: "Max Verstappen dominated the Monaco Grand Prix, leading from start to finish to claim his fifth victory of the season. The Red Bull driver now leads the championship by 50 points."
  },
  {
    id: 20,
    title: "Wimbledon 2024: Djokovic Defeats Alcaraz in Epic Final",
    source: "Wimbledon.com",
    url: "https://wimbledon.com/2024-final",
    category: 'non-crisis',
    subcategory: 'sports-tennis',
    expectedCause: 'none',
    content: "Novak Djokovic won his 8th Wimbledon title by defeating Carlos Alcaraz in a five-set thriller. The match lasted 4 hours and 42 minutes, with Djokovic prevailing 7-6, 6-7, 7-6, 3-6, 7-5."
  },

  // Technology (10)
  {
    id: 21,
    title: "Apple Unveils iPhone 16 with Revolutionary AI Features",
    source: "TechCrunch",
    url: "https://techcrunch.com/iphone-16-launch",
    category: 'non-crisis',
    subcategory: 'technology-products',
    expectedCause: 'none',
    content: "Apple announced the iPhone 16 at its annual September event, featuring groundbreaking AI capabilities powered by the new A18 chip. The device includes advanced camera features and improved battery life. Pre-orders start Friday."
  },
  {
    id: 22,
    title: "Tesla Announces New Model 2 Electric Vehicle at $25,000",
    source: "The Verge",
    url: "https://theverge.com/tesla-model-2",
    category: 'non-crisis',
    subcategory: 'technology-automotive',
    expectedCause: 'none',
    content: "Tesla CEO Elon Musk unveiled the Model 2, an affordable electric vehicle priced at $25,000. The compact EV features a 300-mile range and will begin production next year at Tesla's new factory in Mexico."
  },
  {
    id: 23,
    title: "Microsoft Launches Windows 12 with AI Assistant Built-In",
    source: "Windows Central",
    url: "https://windowscentral.com/windows-12-launch",
    category: 'non-crisis',
    subcategory: 'technology-software',
    expectedCause: 'none',
    content: "Microsoft officially launched Windows 12, featuring a deeply integrated AI assistant called Copilot. The new operating system includes redesigned interface elements and improved performance. The free upgrade is available now for Windows 11 users."
  },
  {
    id: 24,
    title: "Samsung Galaxy S24 Ultra Review: Best Android Phone of 2024",
    source: "Android Authority",
    url: "https://androidauthority.com/galaxy-s24-ultra-review",
    category: 'non-crisis',
    subcategory: 'technology-reviews',
    expectedCause: 'none',
    content: "We spent two weeks with the Samsung Galaxy S24 Ultra and it's the best Android phone we've tested this year. The camera system is exceptional, the display is stunning, and battery life easily lasts all day. Here's our full review."
  },
  {
    id: 25,
    title: "Google Announces Pixel 9 with Advanced AI Photo Editing",
    source: "9to5Google",
    url: "https://9to5google.com/pixel-9-announcement",
    category: 'non-crisis',
    subcategory: 'technology-products',
    expectedCause: 'none',
    content: "Google unveiled the Pixel 9 smartphone with revolutionary AI-powered photo editing features. The new Magic Editor can remove objects, change backgrounds, and enhance photos with unprecedented accuracy. The device launches October 15th."
  },
  {
    id: 26,
    title: "Meta Quest 4 VR Headset Launches with Mixed Reality Features",
    source: "Upload VR",
    url: "https://uploadvr.com/meta-quest-4-launch",
    category: 'non-crisis',
    subcategory: 'technology-vr',
    expectedCause: 'none',
    content: "Meta released the Quest 4 VR headset featuring advanced mixed reality capabilities. The device includes higher resolution displays, improved hand tracking, and a lighter design. It's priced at $499 and available now."
  },
  {
    id: 27,
    title: "AMD Ryzen 9000 Series Processors Break Performance Records",
    source: "Tom's Hardware",
    url: "https://tomshardware.com/amd-ryzen-9000",
    category: 'non-crisis',
    subcategory: 'technology-hardware',
    expectedCause: 'none',
    content: "AMD's new Ryzen 9000 series processors have set new performance benchmarks in our testing. The flagship 9950X offers incredible multi-threaded performance while maintaining excellent power efficiency. Full review and benchmarks inside."
  },
  {
    id: 28,
    title: "SpaceX Starship Successfully Completes First Orbital Flight",
    source: "Space.com",
    url: "https://space.com/starship-orbital-flight",
    category: 'non-crisis',
    subcategory: 'technology-space',
    expectedCause: 'none',
    content: "SpaceX's Starship rocket successfully completed its first full orbital flight test, marking a major milestone for the company's Mars ambitions. The spacecraft launched from Texas, orbited Earth, and splashed down in the Pacific Ocean as planned."
  },
  {
    id: 29,
    title: "Sony PlayStation 6 Specs Leaked: 8K Gaming Confirmed",
    source: "IGN",
    url: "https://ign.com/ps6-specs-leak",
    category: 'non-crisis',
    subcategory: 'technology-gaming',
    expectedCause: 'none',
    content: "Leaked documents reveal specifications for Sony's next-generation PlayStation 6 console. The system will support 8K gaming at 120fps, feature a custom AMD chip, and include 2TB of storage. Launch is expected in late 2026."
  },
  {
    id: 30,
    title: "OpenAI Releases GPT-5: Major Leap in AI Capabilities",
    source: "MIT Technology Review",
    url: "https://technologyreview.com/gpt-5-release",
    category: 'non-crisis',
    subcategory: 'technology-ai',
    expectedCause: 'none',
    content: "OpenAI announced GPT-5, the latest version of its language model. The new model shows significant improvements in reasoning, coding, and multimodal understanding. It's available now through ChatGPT Plus subscriptions."
  },

  // Product Reviews (5)
  {
    id: 31,
    title: "AirPods Pro 3 Review: Best Noise Cancellation Yet",
    source: "CNET",
    url: "https://cnet.com/airpods-pro-3-review",
    category: 'non-crisis',
    subcategory: 'reviews-audio',
    expectedCause: 'none',
    content: "Apple's AirPods Pro 3 deliver the best active noise cancellation we've tested in wireless earbuds. Sound quality is excellent, battery life is improved, and the new USB-C charging case is a welcome upgrade. Highly recommended at $249."
  },
  {
    id: 32,
    title: "MacBook Pro M4 Review: Blazing Fast Performance",
    source: "Laptop Mag",
    url: "https://laptopmag.com/macbook-pro-m4-review",
    category: 'non-crisis',
    subcategory: 'reviews-computers',
    expectedCause: 'none',
    content: "The new MacBook Pro with M4 chip is a powerhouse for creative professionals. Video editing is buttery smooth, battery life exceeds 20 hours, and the mini-LED display is gorgeous. It's expensive at $2,499 but worth it for pros."
  },
  {
    id: 33,
    title: "Dyson V15 Vacuum Review: Worth the Premium Price?",
    source: "Wirecutter",
    url: "https://wirecutter.com/dyson-v15-review",
    category: 'non-crisis',
    subcategory: 'reviews-appliances',
    expectedCause: 'none',
    content: "We tested the Dyson V15 cordless vacuum for three months. It offers excellent suction power, a laser that reveals hidden dust, and impressive battery life. At $750, it's pricey, but the performance justifies the cost for most homes."
  },
  {
    id: 34,
    title: "Instant Pot Pro Plus Review: Best Multi-Cooker for 2024",
    source: "Good Housekeeping",
    url: "https://goodhousekeeping.com/instant-pot-pro-plus",
    category: 'non-crisis',
    subcategory: 'reviews-kitchen',
    expectedCause: 'none',
    content: "The Instant Pot Pro Plus is our top pick for multi-cookers this year. It pressure cooks, slow cooks, sautés, and more. The 10-quart capacity is perfect for families, and the intuitive controls make it easy to use. $179 at Amazon."
  },
  {
    id: 35,
    title: "Peloton Bike+ Review: Premium Home Fitness Experience",
    source: "Runner's World",
    url: "https://runnersworld.com/peloton-bike-plus-review",
    category: 'non-crisis',
    subcategory: 'reviews-fitness',
    expectedCause: 'none',
    content: "The Peloton Bike+ offers an exceptional at-home cycling experience. The rotating screen, auto-resistance, and extensive class library make it worth the $2,495 price tag for serious fitness enthusiasts. Monthly subscription is $44."
  },

  // Opinion/Analysis (10)
  {
    id: 36,
    title: "Opinion: Why Remote Work is Here to Stay",
    source: "The New York Times",
    url: "https://nytimes.com/opinion-remote-work",
    category: 'non-crisis',
    subcategory: 'opinion-business',
    expectedCause: 'none',
    content: "The pandemic forced a massive experiment in remote work, and the results are clear: employees are more productive and happier working from home. Companies that force a return to office will lose top talent to more flexible competitors."
  },
  {
    id: 37,
    title: "Analysis: The Future of Electric Vehicles in America",
    source: "The Washington Post",
    url: "https://washingtonpost.com/ev-analysis",
    category: 'non-crisis',
    subcategory: 'opinion-automotive',
    expectedCause: 'none',
    content: "Electric vehicle adoption is accelerating faster than predicted. With improving battery technology, expanding charging infrastructure, and falling prices, EVs will dominate the market by 2035. Here's what that means for consumers and the economy."
  },
  {
    id: 38,
    title: "Commentary: Social Media's Impact on Mental Health",
    source: "Psychology Today",
    url: "https://psychologytoday.com/social-media-mental-health",
    category: 'non-crisis',
    subcategory: 'opinion-health',
    expectedCause: 'none',
    content: "Research increasingly shows that excessive social media use correlates with anxiety and depression, especially in teenagers. We need better digital literacy education and platform design that prioritizes user wellbeing over engagement metrics."
  },
  {
    id: 39,
    title: "Op-Ed: The Case for Universal Basic Income",
    source: "The Guardian",
    url: "https://theguardian.com/ubi-opinion",
    category: 'non-crisis',
    subcategory: 'opinion-economics',
    expectedCause: 'none',
    content: "As automation threatens millions of jobs, universal basic income is no longer a radical idea but a practical necessity. Pilot programs show promising results. It's time for serious policy discussion about implementing UBI nationwide."
  },
  {
    id: 40,
    title: "Perspective: Why College Isn't for Everyone",
    source: "Forbes",
    url: "https://forbes.com/college-perspective",
    category: 'non-crisis',
    subcategory: 'opinion-education',
    expectedCause: 'none',
    content: "The traditional four-year college path isn't the only route to success. Trade schools, apprenticeships, and online certifications offer viable alternatives with less debt and strong job prospects. We need to destigmatize non-college paths."
  },
  {
    id: 41,
    title: "Think Piece: The Death of Third Places in American Life",
    source: "The Atlantic",
    url: "https://theatlantic.com/third-places",
    category: 'non-crisis',
    subcategory: 'opinion-society',
    expectedCause: 'none',
    content: "Coffee shops, libraries, and community centers—'third places' where people gather outside home and work—are disappearing. This loss contributes to loneliness and social fragmentation. We must prioritize creating spaces for community connection."
  },
  {
    id: 42,
    title: "Editorial: Rethinking Urban Planning for Climate Change",
    source: "Scientific American",
    url: "https://scientificamerican.com/urban-planning-editorial",
    category: 'non-crisis',
    subcategory: 'opinion-environment',
    expectedCause: 'none',
    content: "Cities must adapt to climate change through better urban planning. This means more green spaces, improved public transit, and resilient infrastructure. The cities that act now will thrive; those that don't will struggle."
  },
  {
    id: 43,
    title: "Column: The Streaming Wars Are Over, and We All Lost",
    source: "Vulture",
    url: "https://vulture.com/streaming-wars-column",
    category: 'non-crisis',
    subcategory: 'opinion-entertainment',
    expectedCause: 'none',
    content: "With content scattered across a dozen streaming services, each costing $10-20 monthly, we're paying more than cable ever cost. The convenience of streaming has been replaced by subscription fatigue and content fragmentation."
  },
  {
    id: 44,
    title: "Hot Take: AI Will Create More Jobs Than It Destroys",
    source: "Wired",
    url: "https://wired.com/ai-jobs-hot-take",
    category: 'non-crisis',
    subcategory: 'opinion-technology',
    expectedCause: 'none',
    content: "Despite fears of mass unemployment, history shows technology creates more jobs than it eliminates. AI will be no different. New roles in AI training, ethics, and oversight are already emerging. The key is preparing workers for this transition."
  },
  {
    id: 45,
    title: "Viewpoint: Why I'm Optimistic About Gen Z",
    source: "Time Magazine",
    url: "https://time.com/gen-z-viewpoint",
    category: 'non-crisis',
    subcategory: 'opinion-society',
    expectedCause: 'none',
    content: "Gen Z faces unprecedented challenges, but they're also the most educated, diverse, and socially conscious generation yet. Their activism on climate change, social justice, and mental health gives me hope for the future."
  },

  // Historical/Past Events (5)
  {
    id: 46,
    title: "Remembering the Moon Landing: 55 Years Later",
    source: "NASA",
    url: "https://nasa.gov/apollo-11-anniversary",
    category: 'non-crisis',
    subcategory: 'historical-space',
    expectedCause: 'none',
    content: "Fifty-five years ago today, Neil Armstrong and Buzz Aldrin became the first humans to walk on the Moon. We look back at the Apollo 11 mission and its lasting impact on space exploration and human achievement."
  },
  {
    id: 47,
    title: "The Fall of the Berlin Wall: 35th Anniversary Retrospective",
    source: "History.com",
    url: "https://history.com/berlin-wall-anniversary",
    category: 'non-crisis',
    subcategory: 'historical-politics',
    expectedCause: 'none',
    content: "On November 9, 1989, the Berlin Wall fell, marking the beginning of the end for the Cold War. We examine the events leading up to that historic night and how it reshaped Europe and the world."
  },
  {
    id: 48,
    title: "Looking Back: The Invention of the Internet 50 Years Ago",
    source: "Smithsonian Magazine",
    url: "https://smithsonianmag.com/internet-50-years",
    category: 'non-crisis',
    subcategory: 'historical-technology',
    expectedCause: 'none',
    content: "In 1974, the first TCP/IP protocol was implemented, laying the foundation for the modern internet. We trace the evolution from ARPANET to today's global network that connects billions of people."
  },
  {
    id: 49,
    title: "Woodstock at 55: The Music Festival That Defined a Generation",
    source: "Rolling Stone",
    url: "https://rollingstone.com/woodstock-55-anniversary",
    category: 'non-crisis',
    subcategory: 'historical-music',
    expectedCause: 'none',
    content: "The Woodstock Music Festival took place 55 years ago this month. We revisit the legendary performances, the cultural impact, and why it remains the most iconic music festival in history."
  },
  {
    id: 50,
    title: "Archive: The First iPhone Launch Changed Everything",
    source: "TechCrunch",
    url: "https://techcrunch.com/first-iphone-archive",
    category: 'non-crisis',
    subcategory: 'historical-technology',
    expectedCause: 'none',
    content: "Seventeen years ago, Steve Jobs unveiled the first iPhone. We look back at the original launch, early reviews, and how this device revolutionized mobile computing and changed the world."
  },

  // ===== CRISIS CONTENT (50 cases) =====
  
  // Disaster Relief (10)
  {
    id: 51,
    title: "Magnitude 7.8 Earthquake Devastates Turkey and Syria",
    source: "BBC News",
    url: "https://bbc.com/turkey-syria-earthquake",
    category: 'crisis',
    subcategory: 'disaster-earthquake',
    expectedCause: 'disaster_relief',
    content: "A massive 7.8 magnitude earthquake struck southern Turkey and northern Syria early Monday morning, killing thousands and trapping many under collapsed buildings. Rescue teams are working around the clock to find survivors. The death toll has exceeded 5,000 and continues to rise as emergency responders reach more affected areas."
  },
  {
    id: 52,
    title: "Hurricane Helene Makes Landfall in Florida as Category 4 Storm",
    source: "CNN",
    url: "https://cnn.com/hurricane-helene-florida",
    category: 'crisis',
    subcategory: 'disaster-hurricane',
    expectedCause: 'disaster_relief',
    content: "Hurricane Helene slammed into Florida's Gulf Coast as a powerful Category 4 storm with winds of 140 mph. Widespread flooding and power outages affect millions. Emergency shelters are at capacity as residents evacuate coastal areas. Storm surge of up to 15 feet has inundated communities."
  },
  {
    id: 53,
    title: "Catastrophic Flooding in Bangladesh Displaces 2 Million People",
    source: "Al Jazeera",
    url: "https://aljazeera.com/bangladesh-floods",
    category: 'crisis',
    subcategory: 'disaster-flood',
    expectedCause: 'disaster_relief',
    content: "Severe monsoon flooding in Bangladesh has displaced over 2 million people and submerged entire villages. The government has declared a state of emergency as rescue operations continue. Hundreds of thousands lack access to clean water and food. Aid organizations are struggling to reach isolated communities."
  },
  {
    id: 54,
    title: "Tornado Outbreak Kills 50 Across Southern United States",
    source: "Weather Channel",
    url: "https://weather.com/tornado-outbreak-south",
    category: 'crisis',
    subcategory: 'disaster-tornado',
    expectedCause: 'disaster_relief',
    content: "A devastating tornado outbreak tore through six southern states, killing at least 50 people and destroying hundreds of homes. Multiple EF-4 tornadoes were confirmed. Search and rescue operations are ongoing in the hardest-hit areas. Thousands remain without power or shelter."
  },
  {
    id: 55,
    title: "Tsunami Warning After 8.2 Earthquake Strikes Pacific",
    source: "Reuters",
    url: "https://reuters.com/pacific-tsunami-warning",
    category: 'crisis',
    subcategory: 'disaster-tsunami',
    expectedCause: 'disaster_relief',
    content: "An 8.2 magnitude earthquake struck the Pacific Ocean, triggering tsunami warnings for coastal areas across multiple countries. Residents are evacuating to higher ground as waves up to 10 feet are expected. Emergency services are on high alert and preparing for potential widespread damage."
  },
  {
    id: 56,
    title: "Landslide Buries Village in Nepal, Dozens Missing",
    source: "The Guardian",
    url: "https://theguardian.com/nepal-landslide",
    category: 'crisis',
    subcategory: 'disaster-landslide',
    expectedCause: 'disaster_relief',
    content: "A massive landslide triggered by heavy rains buried a village in Nepal's mountainous region. At least 30 people are confirmed dead and dozens more are missing. Rescue teams face difficult terrain and continued rainfall hampering search efforts. The village of 200 people was completely buried under mud and debris."
  },
  {
    id: 57,
    title: "Cyclone Freddy Devastates Mozambique and Malawi",
    source: "AP News",
    url: "https://apnews.com/cyclone-freddy-africa",
    category: 'crisis',
    subcategory: 'disaster-cyclone',
    expectedCause: 'disaster_relief',
    content: "Cyclone Freddy, one of the longest-lasting tropical cyclones on record, has killed hundreds in Mozambique and Malawi. Torrential rains caused catastrophic flooding and landslides. Over 500,000 people have been displaced. Aid agencies warn of potential cholera outbreak in evacuation centers."
  },
  {
    id: 58,
    title: "Avalanche Strikes Ski Resort in Austria, Multiple Casualties",
    source: "Euronews",
    url: "https://euronews.com/austria-avalanche",
    category: 'crisis',
    subcategory: 'disaster-avalanche',
    expectedCause: 'disaster_relief',
    content: "A deadly avalanche struck a popular ski resort in the Austrian Alps, burying dozens of skiers. Rescue helicopters and search dogs are combing the area. At least 15 people are confirmed dead with several still missing. Heavy snowfall in recent days increased avalanche risk across the region."
  },
  {
    id: 59,
    title: "Severe Storms and Flooding Hit Germany, Belgium",
    source: "Deutsche Welle",
    url: "https://dw.com/germany-belgium-floods",
    category: 'crisis',
    subcategory: 'disaster-flood',
    expectedCause: 'disaster_relief',
    content: "Unprecedented rainfall caused catastrophic flooding in western Germany and Belgium. Entire towns are underwater, with hundreds dead and thousands missing. Emergency services are overwhelmed. The flooding destroyed critical infrastructure including roads, bridges, and power lines. Climate scientists link the extreme weather to climate change."
  },
  {
    id: 60,
    title: "Volcanic Eruption Forces Mass Evacuation in Philippines",
    source: "Philippine Star",
    url: "https://philstar.com/volcano-eruption",
    category: 'crisis',
    subcategory: 'disaster-volcano',
    expectedCause: 'disaster_relief',
    content: "Mount Mayon erupted violently, spewing lava and ash clouds. Over 100,000 residents within the danger zone have been evacuated. Ashfall is affecting nearby cities and disrupting air travel. Authorities warn of potential pyroclastic flows and mudslides. Emergency shelters are housing displaced families."
  },

  // Health Crisis (10)
  {
    id: 61,
    title: "Ebola Outbreak Declared in Democratic Republic of Congo",
    source: "WHO",
    url: "https://who.int/ebola-outbreak-drc",
    category: 'crisis',
    subcategory: 'health-ebola',
    expectedCause: 'health_crisis',
    content: "The World Health Organization has declared an Ebola outbreak in eastern DRC after 15 confirmed cases and 8 deaths. Health workers are racing to contain the spread through contact tracing and vaccination. The outbreak is in a conflict zone, complicating response efforts. International medical teams are deploying to the region."
  },
  {
    id: 62,
    title: "Cholera Epidemic Spreads Across Haiti, Thousands Infected",
    source: "UN News",
    url: "https://news.un.org/haiti-cholera-epidemic",
    category: 'crisis',
    subcategory: 'health-cholera',
    expectedCause: 'health_crisis',
    content: "A cholera epidemic is spreading rapidly across Haiti with over 10,000 confirmed cases and 200 deaths. Contaminated water supplies and poor sanitation are driving the outbreak. Hospitals are overwhelmed and running out of medical supplies. Aid organizations are establishing treatment centers and distributing clean water."
  },
  {
    id: 63,
    title: "Measles Outbreak in Samoa Kills 70 Children",
    source: "BBC News",
    url: "https://bbc.com/samoa-measles-outbreak",
    category: 'crisis',
    subcategory: 'health-measles',
    expectedCause: 'health_crisis',
    content: "A devastating measles outbreak in Samoa has killed 70 people, mostly children under 5. Low vaccination rates contributed to the rapid spread. The government declared a state of emergency and launched a mass vaccination campaign. Schools are closed and public gatherings banned. Medical teams from Australia and New Zealand are assisting."
  },
  {
    id: 64,
    title: "Dengue Fever Epidemic Overwhelms Hospitals in Bangladesh",
    source: "Al Jazeera",
    url: "https://aljazeera.com/bangladesh-dengue",
    category: 'crisis',
    subcategory: 'health-dengue',
    expectedCause: 'health_crisis',
    content: "Bangladesh is experiencing its worst dengue fever outbreak in decades with over 100,000 cases and 500 deaths this year. Hospitals in Dhaka are at capacity, with patients being treated in hallways. Monsoon rains have created breeding grounds for mosquitoes. Health authorities are conducting fumigation campaigns."
  },
  {
    id: 65,
    title: "Malaria Surge in Nigeria Strains Healthcare System",
    source: "Reuters",
    url: "https://reuters.com/nigeria-malaria-surge",
    category: 'crisis',
    subcategory: 'health-malaria',
    expectedCause: 'health_crisis',
    content: "Nigeria is facing a severe malaria outbreak with cases up 40% from last year. The healthcare system is struggling to cope with the surge. Pregnant women and children under 5 are most at risk. Shortage of antimalarial drugs and mosquito nets is hampering prevention efforts. WHO is providing emergency support."
  },
  {
    id: 66,
    title: "Tuberculosis Outbreak in Prison System Raises Alarm",
    source: "The Guardian",
    url: "https://theguardian.com/prison-tb-outbreak",
    category: 'crisis',
    subcategory: 'health-tuberculosis',
    expectedCause: 'health_crisis',
    content: "A tuberculosis outbreak in overcrowded prisons has infected hundreds of inmates and staff. Drug-resistant strains are complicating treatment. Public health officials warn the outbreak could spread to surrounding communities. Inadequate ventilation and healthcare in prisons created ideal conditions for TB transmission."
  },
  {
    id: 67,
    title: "Polio Resurfaces in Afghanistan After Years of Progress",
    source: "UNICEF",
    url: "https://unicef.org/afghanistan-polio-resurgence",
    category: 'crisis',
    subcategory: 'health-polio',
    expectedCause: 'health_crisis',
    content: "Polio cases are rising in Afghanistan, threatening years of progress toward eradication. Conflict and insecurity have disrupted vaccination campaigns. Health workers face threats and violence. Over 50 children have been paralyzed by the virus this year. International health agencies are working to resume immunization efforts."
  },
  {
    id: 68,
    title: "Meningitis Outbreak Kills Dozens in Nigeria's 'Meningitis Belt'",
    source: "AP News",
    url: "https://apnews.com/nigeria-meningitis-outbreak",
    category: 'crisis',
    subcategory: 'health-meningitis',
    expectedCause: 'health_crisis',
    content: "A meningitis outbreak in northern Nigeria has killed at least 60 people and infected hundreds more. The region, part of Africa's 'meningitis belt,' experiences regular outbreaks during dry season. Vaccination campaigns are underway but face logistical challenges. Hospitals report shortages of antibiotics and IV fluids."
  },
  {
    id: 69,
    title: "Hepatitis A Outbreak Linked to Contaminated Food Supply",
    source: "CDC",
    url: "https://cdc.gov/hepatitis-a-outbreak",
    category: 'crisis',
    subcategory: 'health-hepatitis',
    expectedCause: 'health_crisis',
    content: "A multi-state hepatitis A outbreak has sickened over 300 people and caused 5 deaths. The outbreak is linked to contaminated frozen strawberries distributed to schools and restaurants. The CDC is working with state health departments to trace the source. Affected products have been recalled."
  },
  {
    id: 70,
    title: "Diphtheria Outbreak in Yemen Amid Healthcare Collapse",
    source: "Doctors Without Borders",
    url: "https://msf.org/yemen-diphtheria-outbreak",
    category: 'crisis',
    subcategory: 'health-diphtheria',
    expectedCause: 'health_crisis',
    content: "A diphtheria outbreak is spreading in Yemen where years of conflict have devastated the healthcare system. Over 200 cases have been confirmed with 20 deaths. Vaccination rates have plummeted during the war. Medical facilities lack basic supplies to treat patients. Humanitarian organizations are struggling to access affected areas."
  },

  // Climate Events (10)
  {
    id: 71,
    title: "Record-Breaking Wildfires Devastate California Communities",
    source: "Los Angeles Times",
    url: "https://latimes.com/california-wildfires",
    category: 'crisis',
    subcategory: 'climate-wildfire',
    expectedCause: 'climate_events',
    content: "Unprecedented wil fires are burning across California, destroying thousands of homes and forcing mass evacuations. Extreme heat and drought conditions have created a tinderbox. Firefighters are battling multiple large fires simultaneously. Air quality has reached hazardous levels across the state. Climate change is making fire seasons longer and more severe."
  },
  {
    id: 72,
    title: "Extreme Heatwave Kills Hundreds Across Europe",
    source: "The Guardian",
    url: "https://theguardian.com/europe-heatwave",
    category: 'crisis',
    subcategory: 'climate-heatwave',
    expectedCause: 'climate_events',
    content: "A brutal heatwave is gripping Europe with temperatures exceeding 45°C (113°F) in some areas. Hundreds have died from heat-related causes. Hospitals are overwhelmed with heat stroke patients. Wildfires are burning in multiple countries. Scientists link the extreme heat to climate change and warn such events will become more common."
  },
  {
    id: 73,
    title: "Severe Drought Threatens Millions in East Africa",
    source: "UN News",
    url: "https://news.un.org/east-africa-drought",
    category: 'crisis',
    subcategory: 'climate-drought',
    expectedCause: 'climate_events',
    content: "The worst drought in 40 years is affecting Somalia, Ethiopia, and Kenya. Over 20 million people face severe food insecurity. Livestock are dying and crops have failed. Children are suffering from acute malnutrition. Aid agencies warn of potential famine if rains don't come soon. Climate change is increasing drought frequency and severity."
  },
  {
    id: 74,
    title: "Glaciers Melting at Alarming Rate, Threatening Water Supply",
    source: "Nature",
    url: "https://nature.com/glacier-melting-crisis",
    category: 'crisis',
    subcategory: 'climate-glacier',
    expectedCause: 'climate_events',
    content: "Himalayan glaciers are melting at unprecedented rates, threatening water supplies for 2 billion people. New research shows glaciers have lost 40% of their mass since 1975. This will lead to water shortages, flooding, and ecosystem collapse. Communities dependent on glacier meltwater face an uncertain future."
  },
  {
    id: 75,
    title: "Rising Sea Levels Force Pacific Island Nation to Evacuate",
    source: "BBC News",
    url: "https://bbc.com/pacific-island-evacuation",
    category: 'crisis',
    subcategory: 'climate-sea-level',
    expectedCause: 'climate_events',
    content: "The Pacific island nation of Tuvalu is planning to evacuate its entire population as rising sea levels threaten to submerge the country. King tides are flooding homes and contaminating fresh water supplies. The government is negotiating with Australia and New Zealand for resettlement. This is the first nation forced to relocate due to climate change."
  },
  {
    id: 76,
    title: "Coral Bleaching Event Devastates Great Barrier Reef",
    source: "Australian Geographic",
    url: "https://australiangeographic.com/coral-bleaching",
    category: 'crisis',
    subcategory: 'climate-coral',
    expectedCause: 'climate_events',
    content: "The Great Barrier Reef is experiencing its worst coral bleaching event on record. Rising ocean temperatures have caused 90% of corals to bleach. Scientists fear mass die-off of coral and marine life. The reef supports thousands of species and generates billions in tourism revenue. Climate change is the primary driver of coral bleaching."
  },
  {
    id: 77,
    title: "Amazon Rainforest Fires Reach Crisis Levels",
    source: "The Guardian",
    url: "https://theguardian.com/amazon-fires-crisis",
    category: 'crisis',
    subcategory: 'climate-deforestation',
    expectedCause: 'climate_events',
    content: "Fires are raging across the Amazon rainforest at the highest rate in a decade. Deforestation and drought have created conditions for massive fires. Smoke is affecting air quality across South America. Indigenous communities are being displaced. The Amazon is a critical carbon sink, and its destruction accelerates climate change."
  },
  {
    id: 78,
    title: "Permafrost Thawing Releases Methane, Accelerating Warming",
    source: "Scientific American",
    url: "https://scientificamerican.com/permafrost-thawing",
    category: 'crisis',
    subcategory: 'climate-permafrost',
    expectedCause: 'climate_events',
    content: "Arctic permafrost is thawing at alarming rates, releasing massive amounts of methane—a potent greenhouse gas. This creates a dangerous feedback loop accelerating global warming. Infrastructure in Arctic communities is collapsing as ground becomes unstable. Scientists warn this could trigger runaway climate change."
  },
  {
    id: 79,
    title: "Extreme Monsoon Flooding Submerges Parts of India",
    source: "Times of India",
    url: "https://timesofindia.com/monsoon-flooding",
    category: 'crisis',
    subcategory: 'climate-monsoon',
    expectedCause: 'climate_events',
    content: "Unprecedented monsoon rains have caused catastrophic flooding across India. Entire cities are underwater, millions are displaced, and hundreds have died. Climate change is making monsoons more intense and unpredictable. Rescue operations are ongoing but hampered by continued heavy rainfall. Agricultural losses are estimated in billions of dollars."
  },
  {
    id: 80,
    title: "Polar Ice Caps Melting Faster Than Predicted",
    source: "NASA",
    url: "https://nasa.gov/polar-ice-melting",
    category: 'crisis',
    subcategory: 'climate-ice-melt',
    expectedCause: 'climate_events',
    content: "New satellite data shows polar ice caps are melting six times faster than in the 1990s. This will cause catastrophic sea level rise affecting coastal cities worldwide. Arctic sea ice is at record lows. Polar bear populations are declining as habitat disappears. The melting ice is disrupting ocean currents and weather patterns globally."
  },

  // Humanitarian Crisis (10)
  {
    id: 81,
    title: "Syrian Refugee Crisis Enters 13th Year, Millions Still Displaced",
    source: "UNHCR",
    url: "https://unhcr.org/syria-refugee-crisis",
    category: 'crisis',
    subcategory: 'humanitarian-refugees',
    expectedCause: 'humanitarian_crisis',
    content: "The Syrian civil war has displaced over 13 million people, creating the world's largest refugee crisis. Millions live in overcrowded camps in Turkey, Lebanon, and Jordan. Children have grown up knowing only war and displacement. Funding for humanitarian aid is critically low. Winter is approaching and refugees lack adequate shelter and heating."
  },
  {
    id: 82,
    title: "Famine Declared in South Sudan as Conflict Blocks Aid",
    source: "World Food Programme",
    url: "https://wfp.org/south-sudan-famine",
    category: 'crisis',
    subcategory: 'humanitarian-famine',
    expectedCause: 'humanitarian_crisis',
    content: "Famine has been declared in parts of South Sudan where ongoing conflict prevents aid delivery. Over 100,000 people face starvation. Children are dying from severe malnutrition. Armed groups are blocking humanitarian convoys. The UN warns millions more are at risk if fighting continues. This is a man-made disaster that could be prevented."
  },
  {
    id: 83,
    title: "Rohingya Refugees Face Dire Conditions in Bangladesh Camps",
    source: "Al Jazeera",
    url: "https://aljazeera.com/rohingya-refugee-camps",
    category: 'crisis',
    subcategory: 'humanitarian-refugees',
    expectedCause: 'humanitarian_crisis',
    content: "Over 1 million Rohingya refugees live in squalid camps in Bangladesh after fleeing violence in Myanmar. Monsoon rains cause flooding and landslides in camps. Access to healthcare and education is limited. Children are at risk of trafficking and exploitation. The refugees cannot return home safely and face an uncertain future."
  },
  {
    id: 84,
    title: "Yemen Humanitarian Crisis Worsens as War Continues",
    source: "UN News",
    url: "https://news.un.org/yemen-humanitarian-crisis",
    category: 'crisis',
    subcategory: 'humanitarian-conflict',
    expectedCause: 'humanitarian_crisis',
    content: "Yemen faces the world's worst humanitarian crisis with 24 million people—80% of the population—needing assistance. Years of war have destroyed healthcare, water, and sanitation systems. Cholera and malnutrition are widespread. Children are dying from preventable diseases. Aid agencies struggle to operate amid ongoing fighting."
  },
  {
    id: 85,
    title: "Gaza Humanitarian Situation Deteriorates Amid Blockade",
    source: "Reuters",
    url: "https://reuters.com/gaza-humanitarian-crisis",
    category: 'crisis',
    subcategory: 'humanitarian-blockade',
    expectedCause: 'humanitarian_crisis',
    content: "The humanitarian situation in Gaza continues to deteriorate under blockade. Over 2 million people are trapped with limited access to food, water, electricity, and medical care. Hospitals are overwhelmed and running out of supplies. Unemployment exceeds 50%. Children suffer from trauma and malnutrition. International aid is insufficient to meet needs."
  },
  {
    id: 86,
    title: "Afghanistan Faces Humanitarian Catastrophe After Taliban Takeover",
    source: "BBC News",
    url: "https://bbc.com/afghanistan-humanitarian-catastrophe",
    category: 'crisis',
    subcategory: 'humanitarian-conflict',
    expectedCause: 'humanitarian_crisis',
    content: "Afghanistan is on the brink of humanitarian catastrophe. The economy has collapsed, leaving millions without income. Food insecurity affects 95% of households. Healthcare system is failing. Women and girls face severe restrictions. Winter is coming and families cannot afford heating. The international community has cut most aid, worsening the crisis."
  },
  {
    id: 87,
    title: "Venezuelan Refugee Crisis Strains Neighboring Countries",
    source: "AP News",
    url: "https://apnews.com/venezuela-refugee-crisis",
    category: 'crisis',
    subcategory: 'humanitarian-refugees',
    expectedCause: 'humanitarian_crisis',
    content: "Over 7 million Venezuelans have fled economic collapse and political repression. Colombia, Peru, and Ecuador are struggling to provide services to refugees. Many live in informal settlements without access to healthcare or education. Xenophobia and discrimination are rising. Children are out of school. This is Latin America's largest displacement crisis."
  },
  {
    id: 88,
    title: "Tigray Conflict Creates Humanitarian Emergency in Ethiopia",
    source: "The Guardian",
    url: "https://theguardian.com/tigray-humanitarian-emergency",
    category: 'crisis',
    subcategory: 'humanitarian-conflict',
    expectedCause: 'humanitarian_crisis',
    content: "The conflict in Ethiopia's Tigray region has created a humanitarian emergency. Millions face starvation as fighting blocks aid delivery. Reports of mass atrocities and sexual violence are emerging. Healthcare facilities have been destroyed. Communications are cut off. The UN warns of potential genocide. International access is severely restricted."
  },
  {
    id: 89,
    title: "Myanmar Military Coup Triggers Humanitarian Crisis",
    source: "CNN",
    url: "https://cnn.com/myanmar-humanitarian-crisis",
    category: 'crisis',
    subcategory: 'humanitarian-conflict',
    expectedCause: 'humanitarian_crisis',
    content: "Myanmar's military coup has plunged the country into humanitarian crisis. Thousands have been killed in crackdowns on protesters. Over 1 million people are displaced by fighting. Healthcare and education systems have collapsed. Food insecurity is rising. Ethnic minorities face targeted violence. The military is blocking humanitarian aid."
  },
  {
    id: 90,
    title: "Haiti Gang Violence Creates Humanitarian Emergency",
    source: "Miami Herald",
    url: "https://miamiherald.com/haiti-gang-violence",
    category: 'crisis',
    subcategory: 'humanitarian-violence',
    expectedCause: 'humanitarian_crisis',
    content: "Gang violence has created a humanitarian emergency in Haiti. Armed groups control most of Port-au-Prince, blocking access to food, water, and medical care. Kidnappings are rampant. Hospitals cannot function safely. Schools are closed. Over 200,000 people have fled their homes. The government has lost control and international intervention is being debated."
  },

  // Social Justice (10)
  {
    id: 91,
    title: "Mass Protests Erupt Over Police Killing of Unarmed Black Man",
    source: "The New York Times",
    url: "https://nytimes.com/police-killing-protests",
    category: 'crisis',
    subcategory: 'social-justice-police',
    expectedCause: 'social_justice',
    content: "Protests have erupted in cities nationwide after police shot and killed an unarmed Black man during a traffic stop. Video shows the man complying with orders before being shot. The officer has been placed on leave. Community leaders demand justice and police reform. Demonstrations have been largely peaceful but some have turned violent."
  },
  {
    id: 92,
    title: "ICE Raids Separate Hundreds of Families at Border",
    source: "The Washington Post",
    url: "https://washingtonpost.com/ice-family-separations",
    category: 'crisis',
    subcategory: 'social-justice-immigration',
    expectedCause: 'social_justice',
    content: "Immigration enforcement raids have separated hundreds of children from their parents at the southern border. Families seeking asylum are being detained in overcrowded facilities. Children are held in cages without adequate food, water, or medical care. Human rights groups condemn the treatment as inhumane. Legal challenges are mounting."
  },
  {
    id: 93,
    title: "Voting Rights Under Attack in Multiple States",
    source: "NPR",
    url: "https://npr.org/voting-rights-restrictions",
    category: 'crisis',
    subcategory: 'social-justice-voting',
    expectedCause: 'social_justice',
    content: "Multiple states have passed laws restricting voting access, particularly affecting minority communities. New requirements for voter ID, reduced early voting, and purged voter rolls are making it harder to vote. Civil rights organizations are filing lawsuits. Activists warn these laws will disenfranchise millions of eligible voters."
  },
  {
    id: 94,
    title: "LGBTQ+ Rights Rollback Sparks Nationwide Protests",
    source: "The Guardian",
    url: "https://theguardian.com/lgbtq-rights-protests",
    category: 'crisis',
    subcategory: 'social-justice-lgbtq',
    expectedCause: 'social_justice',
    content: "New legislation targeting LGBTQ+ rights has sparked protests across the country. Laws banning gender-affirming care for minors, restricting bathroom access, and limiting discussion of LGBTQ+ topics in schools are being challenged. LGBTQ+ youth report increased harassment and discrimination. Mental health professionals warn of rising suicide risk."
  },
  {
    id: 95,
    title: "Indigenous Land Rights Violated by Pipeline Construction",
    source: "Indian Country Today",
    url: "https://indiancountrytoday.com/pipeline-land-rights",
    category: 'crisis',
    subcategory: 'social-justice-indigenous',
    expectedCause: 'social_justice',
    content: "Construction of an oil pipeline through Indigenous lands is proceeding despite tribal opposition and treaty violations. Water protectors are being arrested for peaceful protest. The pipeline threatens sacred sites and water supplies. Tribal leaders have filed lawsuits but construction continues. Environmental and Indigenous rights groups are mobilizing support."
  },
  {
    id: 96,
    title: "Systemic Racism in Housing Keeps Communities Segregated",
    source: "ProPublica",
    url: "https://propublica.org/housing-discrimination",
    category: 'crisis',
    subcategory: 'social-justice-housing',
    expectedCause: 'social_justice',
    content: "Investigation reveals ongoing housing discrimination keeping communities racially segregated. Black and Latino families are systematically denied mortgages and steered away from white neighborhoods. Redlining practices continue despite being illegal. The wealth gap persists as homeownership remains out of reach for many minority families."
  },
  {
    id: 97,
    title: "Mass Incarceration Crisis Disproportionately Affects Black Americans",
    source: "The Marshall Project",
    url: "https://themarshallproject.org/mass-incarceration",
    category: 'crisis',
    subcategory: 'social-justice-criminal',
    expectedCause: 'social_justice',
    content: "The United States has the highest incarceration rate in the world, with Black Americans imprisoned at five times the rate of white Americans. Harsh sentencing laws, cash bail, and the war on drugs have created a crisis. Families are torn apart and communities devastated. Reform advocates push for alternatives to incarceration."
  },
  {
    id: 98,
    title: "Wage Gap Persists: Women Earn 82 Cents for Every Dollar Men Make",
    source: "Pew Research",
    url: "https://pewresearch.org/gender-wage-gap",
    category: 'crisis',
    subcategory: 'social-justice-gender',
    expectedCause: 'social_justice',
    content: "Despite decades of progress, women still earn significantly less than men for the same work. The gap is even wider for women of color. Discrimination in hiring, promotion, and pay persists. Lack of paid family leave and affordable childcare forces many women out of the workforce. Economic inequality between genders remains a crisis."
  },
  {
    id: 99,
    title: "Disability Rights Activists Protest Lack of Accessibility",
    source: "Disability Scoop",
    url: "https://disabilityscoop.com/accessibility-protests",
    category: 'crisis',
    subcategory: 'social-justice-disability',
    expectedCause: 'social_justice',
    content: "Disability rights activists are protesting widespread lack of accessibility in public spaces, transportation, and employment. Despite the Americans with Disabilities Act, many buildings remain inaccessible. Unemployment among disabled people exceeds 70%. Activists demand enforcement of existing laws and stronger protections against discrimination."
  },
  {
    id: 100,
    title: "Deportation of DACA Recipients Sparks Immigration Rights Movement",
    source: "Los Angeles Times",
    url: "https://latimes.com/daca-deportations",
    category: 'crisis',
    subcategory: 'social-justice-immigration',
    expectedCause: 'social_justice',
    content: "The deportation of DACA recipients—young people brought to the US as children—has sparked a massive immigration rights movement. Families are being torn apart. Dreamers who have lived in America their entire lives are being sent to countries they don't remember. Activists demand permanent protection and a path to citizenship."
  }
];

export async function runClassificationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const testCase of TEST_CASES) {
    try {
      const classification = await classifyContent(
        testCase.url,
        testCase.title,
        testCase.content
      );
      
      const predictedCause = classification ? classification.cause : 'none';
      const confidence = classification ? classification.confidence : 0;
      const matchedKeywords = classification ? classification.matchedKeywords : [];
      
      const passed = predictedCause === testCase.expectedCause;
      
      let failureReason: string | undefined;
      if (!passed) {
        if (testCase.category === 'non-crisis' && predictedCause !== 'none') {
          failureReason = `False positive: Classified as ${predictedCause} instead of non-crisis`;
        } else if (testCase.category === 'crisis' && predictedCause === 'none') {
          failureReason = `False negative: Failed to detect crisis`;
        } else {
          failureReason = `Wrong category: Expected ${testCase.expectedCause}, got ${predictedCause}`;
        }
      }
      
      results.push({
        testId: testCase.id,
        title: testCase.title,
        source: testCase.source,
        actualCategory: testCase.subcategory,
        predictedCause,
        expectedCause: testCase.expectedCause,
        confidence,
        matchedKeywords,
        passed,
        failureReason
      });
    } catch (error) {
      results.push({
        testId: testCase.id,
        title: testCase.title,
        source: testCase.source,
        actualCategory: testCase.subcategory,
        predictedCause: 'none',
        expectedCause: testCase.expectedCause,
        confidence: 0,
        matchedKeywords: [],
        passed: false,
        failureReason: `Error during classification: ${error}`
      });
    }
  }
  
  return results;
}

export function generateTestReport(results: TestResult[]): string {
  const totalTests = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const accuracy = ((passed / totalTests) * 100).toFixed(2);
  
  const falsePositives = results.filter(r => 
    !r.passed && r.expectedCause === 'none' && r.predictedCause !== 'none'
  ).length;
  
  const falseNegatives = results.filter(r => 
    !r.passed && r.expectedCause !== 'none' && r.predictedCause === 'none'
  ).length;
  
  const wrongCategory = results.filter(r => 
    !r.passed && r.expectedCause !== 'none' && r.predictedCause !== 'none'
  ).length;
  
  let report = `# Classification Test Report\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${totalTests}\n`;
  report += `- **Passed:** ${passed}\n`;
  report += `- **Failed:** ${failed}\n`;
  report += `- **Accuracy:** ${accuracy}%\n\n`;
  report += `### Error Breakdown\n\n`;
  report += `- **False Positives:** ${falsePositives} (non-crisis classified as crisis)\n`;
  report += `- **False Negatives:** ${falseNegatives} (crisis not detected)\n`;
  report += `- **Wrong Category:** ${wrongCategory} (crisis detected but wrong type)\n\n`;
  
  report += `## Detailed Results\n\n`;
  report += `| ID | Title | Source | Actual Category | Expected | Predicted | Confidence | Pass/Fail | Failure Reason |\n`;
  report += `|----|-------|--------|----------------|----------|-----------|------------|-----------|----------------|\n`;
  
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const confidence = `${(result.confidence * 100).toFixed(0)}%`;
    const failureReason = result.failureReason || '-';
    
    report += `| ${result.testId} | ${result.title.substring(0, 50)}... | ${result.source} | ${result.actualCategory} | ${result.expectedCause} | ${result.predictedCause} | ${confidence} | ${status} | ${failureReason} |\n`;
  }
  
  return report;
}

export function exportTestResultsToCSV(results: TestResult[]): string {
  let csv = 'Test ID,Title,Source,Actual Category,Expected Cause,Predicted Cause,Confidence,Matched Keywords,Pass/Fail,Failure Reason\n';
  
  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const confidence = (result.confidence * 100).toFixed(2);
    const keywords = result.matchedKeywords.slice(0, 10).join('; ');
    const failureReason = result.failureReason || '';
    
    csv += `${result.testId},"${result.title}","${result.source}","${result.actualCategory}",${result.expectedCause},${result.predictedCause},${confidence},"${keywords}",${status},"${failureReason}"\n`;
  }
  
  return csv;
}