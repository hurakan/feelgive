import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Sparkles, Heart, Zap, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isValidURL } from '@/utils/content-fetcher';

interface ShareTargetInputProps {
  onAnalyzeUrl: (url: string, title?: string) => void;
  onAnalyzeText: (text: string, title?: string) => void;
  isAnalyzing?: boolean;
  error?: string | null;
}

export function ShareTargetInput({ onAnalyzeUrl, onAnalyzeText, isAnalyzing = false, error }: ShareTargetInputProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [articleText, setArticleText] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [validationError, setValidationError] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount for better UX
  useEffect(() => {
    if (activeTab === 'url') {
      urlInputRef.current?.focus();
    } else {
      textInputRef.current?.focus();
    }
  }, [activeTab]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setValidationError('');
  };

  const handleTextChange = (value: string) => {
    setArticleText(value);
    setValidationError('');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setValidationError('Please enter a news article URL');
      return;
    }

    if (!isValidURL(trimmedUrl)) {
      setValidationError('This doesn\'t look like a valid web address. Try something like "bbc.com/news/article"');
      return;
    }

    onAnalyzeUrl(trimmedUrl);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedText = articleText.trim();
    
    if (!trimmedText) {
      setValidationError('Please paste the article text');
      return;
    }

    if (trimmedText.length < 100) {
      setValidationError('Please provide at least 100 characters of article text');
      return;
    }

    onAnalyzeText(trimmedText, articleTitle.trim() || undefined);
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setValidationError('');
    setTimeout(() => {
      onAnalyzeUrl(exampleUrl);
    }, 300);
  };

  // Handle paste event for better mobile experience
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && isValidURL(pastedText)) {
      setUrl(pastedText);
      setValidationError('');
      setTimeout(() => {
        onAnalyzeUrl(pastedText);
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full border-2 shadow-xl bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg">
            <Heart className="h-8 w-8 text-white" fill="white" />
          </div>
          <CardTitle className="text-2xl">Share a Story That Moved You</CardTitle>
          <CardDescription className="text-base mt-2">
            Paste a news article link or the article text itself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Article Link
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs leading-relaxed">
                  <strong>Note:</strong> Many news sites block automated access. If you see errors, 
                  try the "Paste Text" option instead.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleUrlSubmit} className="space-y-4" noValidate>
                <div className="space-y-3">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      ref={urlInputRef}
                      type="text"
                      placeholder="Paste article link here..."
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      onPaste={handlePaste}
                      required
                      disabled={isAnalyzing}
                      className={`h-14 text-base pl-10 transition-all duration-200 border-2 ${
                        (error || validationError) 
                          ? 'border-destructive focus-visible:ring-destructive' 
                          : 'focus-visible:ring-2 focus-visible:ring-primary'
                      }`}
                      aria-label="News article URL"
                      aria-invalid={!!(error || validationError)}
                      aria-describedby={error || validationError ? 'url-error' : undefined}
                      autoComplete="url"
                      inputMode="url"
                    />
                  </div>
                  
                  {(error || validationError) && (
                    <Alert variant="destructive" className="border-l-4" role="alert">
                      <AlertDescription id="url-error" className="text-sm leading-relaxed">
                        {error || validationError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-14 text-base font-medium bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all duration-200 shadow-lg" 
                  disabled={!url.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Reading article...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Find Ways to Help
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/20">
                <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-xs leading-relaxed">
                  <strong>Recommended:</strong> Copy the article text from the news site and paste it here. 
                  This works even when automated access is blocked.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleTextSubmit} className="space-y-4" noValidate>
                <div className="space-y-3">
                  <div>
                    <Input
                      type="text"
                      placeholder="Article title (optional)"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      disabled={isAnalyzing}
                      className="h-12 text-base"
                      aria-label="Article title"
                    />
                  </div>

                  <div>
                    <Textarea
                      ref={textInputRef}
                      placeholder="Paste the article text here... (minimum 100 characters)"
                      value={articleText}
                      onChange={(e) => handleTextChange(e.target.value)}
                      disabled={isAnalyzing}
                      className="min-h-[200px] text-base resize-y"
                      aria-label="Article text"
                      aria-invalid={!!validationError}
                      aria-describedby={validationError ? 'text-error' : undefined}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {articleText.length} / 100 characters minimum
                    </p>
                  </div>
                  
                  {validationError && (
                    <Alert variant="destructive" className="border-l-4" role="alert">
                      <AlertDescription id="text-error" className="text-sm leading-relaxed">
                        {validationError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-14 text-base font-medium bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all duration-200 shadow-lg" 
                  disabled={articleText.trim().length < 100 || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing text...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Find Ways to Help
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {activeTab === 'url' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Or try one of these trusted sources
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { url: 'bbc.com/news', label: 'BBC News' },
              { url: 'reuters.com', label: 'Reuters' },
              { url: 'theguardian.com', label: 'Guardian' },
            ].map((source) => (
              <Button
                key={source.url}
                variant="outline"
                size="sm"
                className="h-auto py-3 transition-all duration-200 hover:scale-105 active:scale-95 hover:border-primary hover:bg-primary/5"
                onClick={() => handleExampleClick(source.url)}
                disabled={isAnalyzing}
                aria-label={`Try ${source.label}`}
              >
                <span className="text-xs font-medium">{source.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}