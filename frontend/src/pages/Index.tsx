import { useState, useEffect } from 'react';
import { ShareTargetInput } from '@/components/share-target-input';
import { LoadingState } from '@/components/loading-state';
import { ClassificationResult } from '@/components/classification-result';
import { ClassificationReasoning } from '@/components/classification-reasoning';
import { NoCharitiesAvailable } from '@/components/no-charities-available';
import { UncertainClassification } from '@/components/uncertain-classification';
import { ChatInterface } from '@/components/chat-interface';
import { CharityCard } from '@/components/charity-card';
import { DonationForm } from '@/components/donation-form';
import { DonationConfirmation } from '@/components/donation-confirmation';
import { ImpactSummary } from '@/components/impact-summary';
import { FollowUpStoryNotification } from '@/components/follow-up-story-notification';
import { SettingsModal } from '@/components/settings-modal';
import { NewsFeed } from '@/components/news-feed';
import { DebugPanel } from '@/components/debug-panel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Classification, Charity, RankedCharity, DonationFormData, Donation } from '@/types';
import { classifyContent } from '@/utils/classification';
import { matchCharities } from '@/utils/charity-matching';
import { fetchArticleContent, processArticleText } from '@/utils/content-fetcher';
import { ConversationAgent, ConversationContext } from '@/utils/conversation-agent';
import { useOrganizations } from '@/hooks/use-organizations';
import { extractSearchTerms, getAlternativeSearchTerms } from '@/utils/search-term-extractor';
import { verifyCharitiesWithBackend } from '@/utils/charity-verification';
import {
  saveDonation,
  getDonations,
  getTotalDonated,
  getCurrentMonthTotal,
  generateDonationId,
  updateUserEmail
} from '@/utils/donations';
import { debugLogger } from '@/utils/debug-logger';
import analyticsTracker from '@/utils/analytics-tracker';
import { Heart, History, ArrowLeft, ArrowRight, Sparkles, MessageSquare, Settings } from 'lucide-react';
import { toast } from 'sonner';

type FlowStep = 'input' | 'loading' | 'classification' | 'conversation' | 'no-charities' | 'uncertain' | 'donation' | 'confirmation';
type LoadingStage = 'fetching' | 'analyzing' | 'matching';

export default function Index() {
  const [activeTab, setActiveTab] = useState<'donate' | 'history'>('donate');
  const [flowStep, setFlowStep] = useState<FlowStep>('input');
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('fetching');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [articleSummary, setArticleSummary] = useState<string>('');
  const [articleText, setArticleText] = useState<string>('');
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [newsKey, setNewsKey] = useState(0);
  const [currentCorrelationId, setCurrentCorrelationId] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const [classification, setClassification] = useState<Classification | null>(null);
  const [matchedCharities, setMatchedCharities] = useState<RankedCharity[]>([]);
  const [conversationAgent, setConversationAgent] = useState<ConversationAgent | null>(null);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [completedDonation, setCompletedDonation] = useState<Donation | null>(null);

  const [donations, setDonations] = useState<Donation[]>(getDonations());
  const [totalDonated, setTotalDonated] = useState(getTotalDonated());
  const [currentMonthTotal, setCurrentMonthTotal] = useState(getCurrentMonthTotal());

  // Fetch organizations dynamically from backend - don't fetch on mount
  const { organizations, loading: orgsLoading, error: orgsError, refetch: refetchOrganizations } = useOrganizations(undefined, false);
  const [isFetchingOrgs, setIsFetchingOrgs] = useState(false);

  // Initialize analytics tracker on mount
  useEffect(() => {
    analyticsTracker.initialize();
    console.log('[Analytics] Tracker initialized in Index component');
  }, []);

  // Check for shared content on mount
  useEffect(() => {
    const checkSharedContent = () => {
      const sharedDataStr = sessionStorage.getItem('feelgive_shared_content');
      if (sharedDataStr) {
        try {
          const sharedData = JSON.parse(sharedDataStr);
          
          sessionStorage.removeItem('feelgive_shared_content');
          
          toast.success('Processing shared article...');
          
          if (sharedData.url) {
            handleAnalyzeUrl(sharedData.url);
          } else if (sharedData.text) {
            handleAnalyzeText(sharedData.text, sharedData.title);
          }
        } catch (error) {
          console.error('Error processing shared content:', error);
          toast.error('Failed to process shared content');
        }
      }
    };

    checkSharedContent();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (flowStep === 'input') {
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
        }
      }
      
      // Toggle debug panel with Ctrl+Shift+N (or Cmd+Shift+N on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowDebugPanel(prev => !prev);
        if (!showDebugPanel) {
          toast.success('Debug panel enabled');
        } else {
          toast.info('Debug panel hidden');
        }
      }
      
      if (e.key === 'Escape' && !isProcessing) {
        if (showSettings) {
          setShowSettings(false);
        } else if (flowStep === 'donation') {
          handleCancelDonation();
        } else if (flowStep === 'conversation') {
          setFlowStep('classification');
        } else if (flowStep === 'classification' || flowStep === 'no-charities' || flowStep === 'uncertain') {
          handleNewDonation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [flowStep, isProcessing, showSettings, showDebugPanel]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [flowStep]);

  const handleAnalyzeUrl = async (url: string) => {
    console.log('🔄 Starting new URL analysis:', url);
    
    setClassification(null);
    setMatchedCharities([]);
    setSelectedCharity(null);
    setConversationAgent(null);
    setFetchError(null);
    setArticleSummary('');
    setArticleText('');
    setArticleTitle('');
    
    setFlowStep('loading');
    setLoadingStage('fetching');
    
    console.log('📥 Fetching article content...');
    const fetchedContent = await fetchArticleContent(url);
    
    if (!fetchedContent.success) {
      console.error('❌ Fetch failed:', fetchedContent.error);
      setFetchError(fetchedContent.error || 'Unable to read this article');
      setFlowStep('input');
      return;
    }

    console.log('✅ Content fetched:', {
      title: fetchedContent.title,
      textLength: fetchedContent.text.length,
      summaryLength: fetchedContent.summary.length
    });

    await processContent(url, fetchedContent.title, fetchedContent.text, fetchedContent.summary);
  };

  const handleAnalyzeText = async (text: string, title?: string) => {
    console.log('🔄 Starting new text analysis');
    
    setClassification(null);
    setMatchedCharities([]);
    setSelectedCharity(null);
    setConversationAgent(null);
    setFetchError(null);
    setArticleSummary('');
    setArticleText('');
    setArticleTitle('');
    
    setFlowStep('loading');
    setLoadingStage('analyzing');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const processedContent = await processArticleText(text, title);
    
    if (!processedContent.success) {
      setFetchError(processedContent.error || 'Unable to process article text');
      setFlowStep('input');
      return;
    }

    await processContent('pasted-content', processedContent.title, processedContent.text, processedContent.summary);
  };

  const processContent = async (url: string, title: string, text: string, summary: string) => {
    // Generate correlation ID for this pipeline execution
    const correlationId = debugLogger.generateCorrelationId();
    setCurrentCorrelationId(correlationId);
    debugLogger.startTimer(correlationId);
    
    debugLogger.log(
      correlationId,
      'article_ingest_started',
      'info',
      'Starting article processing pipeline',
      { url, titleLength: title.length, textLength: text.length }
    );
    
    setLoadingStage('analyzing');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setArticleSummary(summary);
    setArticleText(text);
    setArticleTitle(title);
    
    debugLogger.log(
      correlationId,
      'article_parsed_ok',
      'info',
      'Article content parsed successfully',
      {
        title,
        source: url !== 'pasted-content' ? 'url' : 'pasted',
        publishDate: 'N/A',
        language: 'en',
        detectedLocation: 'pending classification',
        detectedCrisisType: 'pending classification'
      }
    );
    
    console.log('🧠 Classifying content...', {
      url,
      title,
      textLength: text.length
    });
    
    const result = await classifyContent(url, title, text);
    
    if (!result) {
      debugLogger.log(
        correlationId,
        'pipeline_error',
        'error',
        'Classification failed - no crisis detected',
        { title, textLength: text.length },
        0,
        'Content does not match crisis patterns'
      );
      
      console.error('❌ Classification returned null');
      console.log('📄 Article details:', {
        title,
        textPreview: text.substring(0, 200),
        textLength: text.length
      });
      
      setFlowStep('input');
      
      toast.error(
        'This article doesn\'t appear to describe an active crisis requiring immediate humanitarian response. Try an article about disasters, health emergencies, or humanitarian situations.',
        { duration: 6000 }
      );
      
      return;
    }

    debugLogger.log(
      correlationId,
      'cause_classification_ok',
      'info',
      'Content classified successfully',
      {
        cause: result.cause,
        tier1_crisis_type: result.tier1_crisis_type,
        tier2_root_cause: result.tier2_root_cause,
        detectedLocation: result.geoName,
        detectedCrisisType: result.tier1_crisis_type,
        confidence: result.confidence,
        matchedKeywords: result.matchedKeywords.length
      }
    );

    console.log('✅ Classification result:', {
      cause: result.cause,
      confidence: result.confidence,
      geo: result.geo,
      geoName: result.geoName,
      matchedKeywords: result.matchedKeywords.length,
      hasMatchingCharities: result.hasMatchingCharities
    });

    setClassification(result);
    
    if (result.confidence < 0.50) {
      debugLogger.log(
        correlationId,
        'pipeline_error',
        'warn',
        'Low confidence classification',
        { confidence: result.confidence, threshold: 0.50 },
        0,
        'Confidence below threshold'
      );
      
      console.log('⚠️ Low confidence, showing uncertain state');
      setMatchedCharities([]);
      setFlowStep('uncertain');
      toast.info('We detected some content but need more clarity to show organizations');
      return;
    }
    
    // Extract search terms from classification and fetch relevant organizations
    setLoadingStage('matching');
    console.log('[EVERY.ORG] 🔍 Extracting search terms from classification...');
    console.log('[EVERY.ORG] Classification data:', {
      tier1_crisis_type: result.tier1_crisis_type,
      tier2_root_cause: result.tier2_root_cause,
      identified_needs: result.identified_needs,
      geoName: result.geoName,
      cause: result.cause
    });
    
    // Get primary search query
    const searchQuery = extractSearchTerms(result);
    console.log(`[EVERY.ORG] 🔍 Primary search query: "${searchQuery}"`);
    
    debugLogger.log(
      correlationId,
      'org_provider_query_started',
      'info',
      'Querying organization provider',
      {
        location: result.geoName,
        country: result.geo,
        causes: [result.cause],
        keywords: searchQuery,
        limit: 10
      }
    );
    
    // Fetch organizations based on classification
    setIsFetchingOrgs(true);
    console.log('[EVERY.ORG] 📡 Fetching organizations from API...');
    
    let fetchedOrgs: Charity[] = [];
    try {
      // Fetch from primary search
      fetchedOrgs = await refetchOrganizations(searchQuery);
      console.log(`[EVERY.ORG] ✅ Primary search returned ${fetchedOrgs.length} organizations`);
      
      debugLogger.log(
        correlationId,
        'org_provider_response_received',
        'info',
        'Received organizations from provider',
        {
          query: searchQuery,
          sampleOrgIds: fetchedOrgs.slice(0, 3).map(o => o.slug)
        },
        fetchedOrgs.length
      );
      
      // If we got fewer than 10 organizations, try alternative searches
      if (fetchedOrgs.length < 10) {
        console.log('[EVERY.ORG] 🔄 Fetching from alternative searches to get more options...');
        const alternatives = getAlternativeSearchTerms(result);
        
        for (const altQuery of alternatives.slice(0, 5)) { // Try up to 5 alternatives
          if (fetchedOrgs.length >= 20) break; // Stop if we have enough
          
          console.log(`[EVERY.ORG] 🔍 Trying alternative: "${altQuery}"`);
          try {
            const altOrgs = await refetchOrganizations(altQuery);
            console.log(`[EVERY.ORG] ✅ Alternative search returned ${altOrgs.length} organizations`);
            
            // Add new organizations (avoid duplicates by slug)
            const existingSlugs = new Set(fetchedOrgs.map(o => o.slug));
            const newOrgs = altOrgs.filter(o => !existingSlugs.has(o.slug));
            fetchedOrgs = [...fetchedOrgs, ...newOrgs];
            console.log(`[EVERY.ORG] 📊 Total unique organizations: ${fetchedOrgs.length}`);
          } catch (error) {
            console.error(`[EVERY.ORG] ❌ Error with alternative search "${altQuery}":`, error);
          }
        }
      }
      
      console.log(`[EVERY.ORG] ✅ Final total: ${fetchedOrgs.length} organizations`);
      
      debugLogger.log(
        correlationId,
        'org_provider_response_received',
        'info',
        'Final organization count after alternatives',
        {
          totalOrgs: fetchedOrgs.length,
          sampleOrgs: fetchedOrgs.slice(0, 3).map(o => ({ name: o.name, slug: o.slug }))
        },
        fetchedOrgs.length
      );
      
      // Log first few organizations for inspection
      if (fetchedOrgs.length > 0) {
        console.log('[EVERY.ORG] Sample organizations from API:');
        fetchedOrgs.slice(0, 3).forEach((org, idx) => {
          console.log(`[EVERY.ORG]   ${idx + 1}. ${org.name} (${org.slug})`);
          console.log(`[EVERY.ORG]      - Causes: ${org.causes.join(', ')}`);
          console.log(`[EVERY.ORG]      - Trust Score: ${org.trustScore}`);
          console.log(`[EVERY.ORG]      - Countries: ${org.countries.join(', ')}`);
          console.log(`[EVERY.ORG]      - Addressed Needs: ${org.addressedNeeds.join(', ')}`);
        });
      }
    } catch (error) {
      debugLogger.log(
        correlationId,
        'pipeline_error',
        'error',
        'Failed to fetch organizations from provider',
        { error: error instanceof Error ? error.message : String(error) },
        0,
        'API error or network failure'
      );
      
      console.error('[EVERY.ORG] ❌ Error fetching organizations:', error);
      toast.error('Failed to fetch organizations, using fallback data');
    } finally {
      setIsFetchingOrgs(false);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    debugLogger.log(
      correlationId,
      'org_filtering_started',
      'info',
      'Starting organization filtering',
      {
        inputCount: fetchedOrgs.length,
        filterRules: ['relevance', 'trust_score', 'geographic_match']
      }
    );
    
    console.log('[EVERY.ORG] 🔍 Matching charities with classification...');
    console.log(`[EVERY.ORG] 📊 Available organizations from API: ${fetchedOrgs.length}`);
    
    // Use API organizations if available, otherwise matchCharities will use default VERIFIED_CHARITIES
    const availableOrgs = fetchedOrgs.length > 0 ? fetchedOrgs : undefined;
    console.log(`[EVERY.ORG] ✅ Using ${availableOrgs ? `${availableOrgs.length} API organizations` : 'default VERIFIED_CHARITIES fallback'}`);
    
    const charities = matchCharities(result, availableOrgs);
    
    debugLogger.log(
      correlationId,
      'org_filtering_result',
      'info',
      'Organizations filtered',
      {
        inputCount: fetchedOrgs.length,
        outputCount: charities.length,
        removedCount: fetchedOrgs.length - charities.length
      },
      charities.length
    );
    
    console.log(`[EVERY.ORG] ✅ Matched ${charities.length} charities:`);
    charities.forEach((charity, idx) => {
      console.log(`[EVERY.ORG]   ${idx + 1}. ${charity.name} (${charity.slug})`);
      console.log(`[EVERY.ORG]      - Trust Score: ${charity.trustScore}`);
      console.log(`[EVERY.ORG]      - Causes: ${charity.causes.join(', ')}`);
      console.log(`[EVERY.ORG]      - Countries: ${charity.countries.join(', ')}`);
      console.log(`[EVERY.ORG]      - Addressed Needs: ${charity.addressedNeeds.join(', ')}`);
      console.log(`[EVERY.ORG]      - Every.org Verified: ${charity.everyOrgVerified ? 'Yes' : 'No'}`);
    });
    
    if (charities.length === 0) {
      debugLogger.log(
        correlationId,
        'pipeline_error',
        'warn',
        'No organizations matched after filtering',
        {
          inputCount: fetchedOrgs.length,
          classification: result.cause,
          location: result.geoName
        },
        0,
        'All organizations filtered out'
      );
      
      console.log('⚠️ No charities matched');
      setMatchedCharities([]);
      setFlowStep('no-charities');
      toast.info('We detected a crisis but don\'t have matching organizations yet');
      return;
    }

    debugLogger.log(
      correlationId,
      'org_ranking_started',
      'info',
      'Starting organization ranking',
      {
        count: charities.length,
        rankingWeights: { trust_score: 0.4, relevance: 0.3, geographic: 0.3 }
      }
    );

    // Verify the matched charities with the backend
    console.log('🔍 Verifying matched charities with backend...');
    const verifiedCharities = await verifyCharitiesWithBackend(charities);
    console.log('✅ Charities verified:', verifiedCharities.map(c => `${c.name} (${c.slug})`));
    
    debugLogger.log(
      correlationId,
      'org_ranking_result',
      'info',
      'Organizations ranked and verified',
      {
        finalCount: verifiedCharities.length,
        top3OrgIds: verifiedCharities.slice(0, 3).map(c => c.slug)
      },
      verifiedCharities.length
    );
    
    debugLogger.log(
      correlationId,
      'ui_render_started',
      'info',
      'Starting UI render with organizations',
      { orgCount: verifiedCharities.length }
    );
    
    setMatchedCharities(verifiedCharities);
    
    debugLogger.log(
      correlationId,
      'ui_rendered_count',
      'info',
      'UI rendered successfully',
      {
        renderedCount: verifiedCharities.length,
        flowStep: 'classification'
      },
      verifiedCharities.length
    );
    
    // Log summary
    console.log(debugLogger.getSummary(correlationId));
    
    const context: ConversationContext = {
      classification: result,
      matchedCharities: verifiedCharities,
      articleSummary: summary,
      articleText: text,
      articleTitle: title,
      articleUrl: url !== 'pasted-content' ? url : undefined
    };
    setConversationAgent(new ConversationAgent(context));
    
    setFlowStep('classification');
    
    toast.success(`Found ${verifiedCharities.length} ${verifiedCharities.length === 1 ? 'organization' : 'organizations'} you can support!`);
  };

  const handleNewsArticleClick = (url: string, title: string) => {
    handleAnalyzeUrl(url);
  };

  const handleStartConversation = () => {
    setFlowStep('conversation');
  };

  const handleSelectCharity = (charity: Charity) => {
    setSelectedCharity(charity);
    setTimeout(() => {
      document.getElementById('continue-button')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }, 100);
  };

  const handleContinueToDonation = () => {
    if (!selectedCharity) return;
    setFlowStep('donation');
  };

  const handleDonationSubmit = async (data: DonationFormData) => {
    if (!selectedCharity || !classification) return;
    
    setIsProcessing(true);
    
    if (data.email) {
      updateUserEmail(data.email);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const donation: Donation = {
      id: generateDonationId(),
      charityId: selectedCharity.id,
      charityName: selectedCharity.name,
      amount: data.amount,
      cause: classification.cause,
      geo: classification.geo,
      timestamp: Date.now(),
      articleUrl: classification.articleUrl,
      articleTitle: classification.articleTitle,
    };
    
    // Log the slug for tracking
    console.log('💰 Donation created with slug:', selectedCharity.slug);
    
    saveDonation(donation);
    setCompletedDonation(donation);
    
    setDonations(getDonations());
    setTotalDonated(getTotalDonated());
    setCurrentMonthTotal(getCurrentMonthTotal());
    
    setFlowStep('confirmation');
    setIsProcessing(false);
    
    toast.success('Thank you for making a difference!');
  };

  const handleCancelDonation = () => {
    setFlowStep('classification');
  };

  const handleNewDonation = () => {
    console.log('🔄 Resetting to input state');
    setFlowStep('input');
    setClassification(null);
    setMatchedCharities([]);
    setSelectedCharity(null);
    setConversationAgent(null);
    setCompletedDonation(null);
    setFetchError(null);
    setArticleSummary('');
    setArticleText('');
    setArticleTitle('');
  };

  const handleViewHistory = () => {
    setActiveTab('history');
  };

  const handleGetStarted = () => {
    setActiveTab('donate');
    handleNewDonation();
  };

  const handleFeedback = () => {
    window.open('mailto:feedback@feelgive.com?subject=Classification Feedback', '_blank');
    toast.success('Thank you for helping us improve!');
  };

  const handleLocationsChanged = () => {
    setNewsKey(prev => prev + 1);
  };

  const refreshHistory = () => {
    setDonations(getDonations());
    setTotalDonated(getTotalDonated());
    setCurrentMonthTotal(getCurrentMonthTotal());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container max-w-3xl mx-auto px-4 py-8 md:py-12">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
        >
          Skip to main content
        </a>

        <header className="text-center mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="inline-flex items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg">
                <Heart className="h-7 w-7 text-white" fill="white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                FeelGive
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-full"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-lg text-foreground/70 max-w-md mx-auto font-medium">
            Turn moments of emotion into moments of impact
          </p>
        </header>

        <main id="main-content">
          {activeTab === 'donate' && flowStep === 'input' && (
            <div className="mb-6">
              <FollowUpStoryNotification />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/50" role="tablist">
              <TabsTrigger 
                value="donate" 
                className="text-base flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-500 data-[state=active]:text-white"
                role="tab"
                aria-selected={activeTab === 'donate'}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Give
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="text-base flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-500 data-[state=active]:text-white"
                role="tab"
                aria-selected={activeTab === 'history'}
              >
                <History className="h-4 w-4" aria-hidden="true" />
                My Impact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donate" className="space-y-8" role="tabpanel">
              {flowStep === 'input' && (
                <>
                  <ShareTargetInput 
                    onAnalyzeUrl={handleAnalyzeUrl}
                    onAnalyzeText={handleAnalyzeText}
                    isAnalyzing={false}
                    error={fetchError}
                  />
                  
                  <NewsFeed
                    key={newsKey}
                    onArticleClick={handleNewsArticleClick}
                    onSettingsClick={() => setShowSettings(true)}
                  />
                </>
              )}

              {flowStep === 'loading' && (
                <LoadingState stage={loadingStage} />
              )}
              
              {isFetchingOrgs && flowStep === 'classification' && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Finding relevant organizations...</span>
                  </div>
                </div>
              )}

              {flowStep === 'uncertain' && classification && (
                <UncertainClassification
                  classification={classification}
                  onBack={handleNewDonation}
                  onFeedback={handleFeedback}
                />
              )}

              {flowStep === 'no-charities' && classification && (
                <div className="space-y-8">
                  <ClassificationResult 
                    classification={classification}
                    articleSummary={articleSummary}
                  />
                  
                  <ClassificationReasoning 
                    classification={classification}
                    matchedCharities={[]}
                  />
                  
                  <NoCharitiesAvailable 
                    classification={classification}
                    onBack={handleNewDonation}
                  />
                </div>
              )}

              {flowStep === 'classification' && classification && (
                <div className="space-y-8">
                  <div className="flex justify-start">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNewDonation}
                      className="gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
                      aria-label="Try a different article"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Try Different Article
                    </Button>
                  </div>
                  
                  <ClassificationResult 
                    classification={classification}
                    articleSummary={articleSummary}
                  />
                  
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleStartConversation}
                      className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Ask Questions About This Crisis
                    </Button>
                  </div>
                  
                  <ClassificationReasoning 
                    classification={classification}
                    matchedCharities={matchedCharities}
                  />
                  
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold">Choose an Organization to Support</h2>
                      <p className="text-muted-foreground">
                        {selectedCharity 
                          ? 'Click a different card to change your selection'
                          : 'Select an organization to continue'}
                      </p>
                    </div>
                    
                    <div className="space-y-4" role="list" aria-label="Matched charities">
                      {matchedCharities.map((charity, index) => (
                        <div key={charity.id} role="listitem">
                          <CharityCard
                            charity={charity}
                            onDonate={handleSelectCharity}
                            featured={index === 0}
                            isSelected={selectedCharity?.id === charity.id}
                          />
                        </div>
                      ))}
                    </div>

                    {selectedCharity && (
                      <div 
                        id="continue-button" 
                        className="pt-6 pb-2"
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleContinueToDonation}
                          className="w-full h-12 text-base font-medium border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                        >
                          Continue to Donation
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          You can still change your selection above
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {flowStep === 'conversation' && conversationAgent && (
                <ChatInterface
                  agent={conversationAgent}
                  onProceedToDonation={() => setFlowStep('classification')}
                  onBack={() => setFlowStep('classification')}
                  articleTitle={articleTitle}
                  classification={classification}
                />
              )}

              {flowStep === 'donation' && selectedCharity && (
                <div className="space-y-6">
                  <div className="flex justify-start">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCancelDonation}
                      className="gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
                      aria-label="Back to organizations"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Change Organization
                    </Button>
                  </div>
                  
                  <DonationForm
                    charity={selectedCharity}
                    onSubmit={handleDonationSubmit}
                    onCancel={handleCancelDonation}
                    isProcessing={isProcessing}
                  
                  />
                </div>
              )}

              {flowStep === 'confirmation' && completedDonation && (
                <DonationConfirmation
                  donation={completedDonation}
                  classification={classification}
                  onViewHistory={handleViewHistory}
                  onNewDonation={handleNewDonation}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6" role="tabpanel">
              <ImpactSummary
                donations={donations}
                totalDonated={totalDonated}
                currentMonthTotal={currentMonthTotal}
                onGetStarted={handleGetStarted}
              />
              
              {donations.length > 0 && (
                <div className="text-center pt-4">
                  <Button 
                    size="lg"
                    onClick={() => {
                      refreshHistory();
                      setActiveTab('donate');
                      handleNewDonation();
                    }}
                    className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all duration-200 shadow-lg"
                  >
                    <Heart className="mr-2 h-4 w-4" aria-hidden="true" fill="white" />
                    Make Another Donation
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <footer className="mt-16 text-center text-sm text-muted-foreground space-y-1">
          <p className="font-medium">FeelGive MVP Demo</p>
          <p className="text-xs">
            Production version integrates with Every.org for secure donations
          </p>
        </footer>
      </div>

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        onLocationsChanged={handleLocationsChanged}
      />

      {/* Debug Panel - enabled with Ctrl+Shift+N */}
      {showDebugPanel && <DebugPanel correlationId={currentCorrelationId} />}
    </div>
  );
}