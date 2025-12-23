import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Sparkles, ArrowRight, Globe, Info, AlertCircle, CheckCircle2, Lightbulb, ExternalLink, BookOpen } from 'lucide-react';
import { ConversationAgent, Message } from '@/utils/conversation-agent';
import { cn } from '@/lib/utils';
import { CauseCategory } from '@/types';

interface ChatInterfaceProps {
  agent: ConversationAgent;
  onProceedToDonation: () => void;
  onBack: () => void;
  articleTitle?: string;
  classification?: any;
}

// Helper function to convert cause category to human-readable label
const getCauseLabel = (cause: CauseCategory): string => {
  const labels: Record<CauseCategory, string> = {
    disaster_relief: 'disaster relief',
    health_crisis: 'health crisis',
    climate_events: 'climate event',
    humanitarian_crisis: 'humanitarian crisis',
    social_justice: 'social justice'
  };
  return labels[cause] || cause.replace(/_/g, ' ');
};

// Helper function to format message content with rich formatting
const formatMessageContent = (content: string) => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    // Check for bullet points
    if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
      const items = paragraph.split('\n').filter(line => line.trim());
      return (
        <ul key={pIndex} className="space-y-2 my-3 ml-4">
          {items.map((item, iIndex) => (
            <li key={iIndex} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span className="flex-1">{item.replace(/^[•\-]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    // Check for numbered lists
    if (/^\d+\./.test(paragraph.trim())) {
      const items = paragraph.split('\n').filter(line => line.trim());
      return (
        <ol key={pIndex} className="space-y-2 my-3 ml-4 list-decimal list-inside">
          {items.map((item, iIndex) => (
            <li key={iIndex} className="flex items-start gap-2">
              <span className="flex-1">{item.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      );
    }
    
    // Check for headers (lines ending with :)
    if (paragraph.trim().endsWith(':') && paragraph.length < 100) {
      return (
        <div key={pIndex} className="font-semibold text-base mt-4 mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          {paragraph}
        </div>
      );
    }
    
    // Check for important callouts (lines starting with Note:, Important:, etc.)
    if (/^(Note|Important|Warning|Tip):/i.test(paragraph.trim())) {
      const [label, ...rest] = paragraph.split(':');
      const icon = label.toLowerCase().includes('important') || label.toLowerCase().includes('warning')
        ? <AlertCircle className="h-4 w-4" />
        : label.toLowerCase().includes('tip')
        ? <Lightbulb className="h-4 w-4" />
        : <Info className="h-4 w-4" />;
      
      return (
        <div key={pIndex} className="my-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <span className="text-primary mt-0.5">{icon}</span>
            <div>
              <span className="font-semibold text-primary">{label}:</span>
              <span className="ml-1">{rest.join(':')}</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular paragraph with inline formatting
    let formattedText = paragraph;
    
    // Bold text (**text** or __text__)
    formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    formattedText = formattedText.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic text (*text* or _text_)
    formattedText = formattedText.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    formattedText = formattedText.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
    
    // Inline code (`code`)
    formattedText = formattedText.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>');
    
    return (
      <p
        key={pIndex}
        className="leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  });
};

export function ChatInterface({ agent, onProceedToDonation, onBack, articleTitle, classification }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Rate limiting: 3 seconds between requests
  const MIN_REQUEST_INTERVAL = 3000; // 3 seconds

  // Update agent when web search toggle changes
  useEffect(() => {
    agent.setWebSearchEnabled(webSearchEnabled);
  }, [webSearchEnabled, agent]);

  // Initialize with greeting
  useEffect(() => {
    const greeting = agent.getGreeting();
    setMessages([greeting]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages, isTyping]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 100));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Check rate limit
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const remaining = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      setCooldownRemaining(remaining);
      return;
    }

    // Update last request time
    setLastRequestTime(now);

    // Add user message immediately
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Get agent response
    const response = await agent.processMessage(text);
    
    setIsTyping(false);
    setMessages(prev => [...prev, response]);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="gap-2"
        >
          Back
        </Button>
        <Button
          onClick={onProceedToDonation}
          className="gap-2 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
        >
          Proceed to Donation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="w-full border-2 shadow-xl">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">
                {articleTitle && classification
                  ? `Ask About: ${articleTitle.length > 60 ? articleTitle.substring(0, 60) + '...' : articleTitle}`
                  : 'Ask Me Anything'}
              </CardTitle>
              <CardDescription>
                {classification
                  ? `Learn more about this ${getCauseLabel(classification.cause)} in ${classification.geoName}`
                  : 'I\'ll help you understand the situation'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="h-[400px] p-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 group",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Agent Avatar */}
                  {message.role === 'agent' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl shadow-sm transition-all duration-200",
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-blue-500 text-primary-foreground px-5 py-3'
                        : 'bg-card border border-border px-5 py-4'
                    )}
                  >
                    {/* Message Header for Agent */}
                    {message.role === 'agent' && index > 0 && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className={cn(
                      "text-sm",
                      message.role === 'user' ? 'whitespace-pre-wrap' : ''
                    )}>
                      {message.role === 'user' ? (
                        <div className="font-medium">{message.content}</div>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {formatMessageContent(message.content)}
                        </div>
                      )}
                    </div>
                    
                    {/* Sources Section */}
                    {message.role === 'agent' && message.sources && message.sources.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                              Sources
                            </span>
                          </div>
                          <div className="space-y-2">
                            {message.sources.map((source, sourceIndex) => (
                              <a
                                key={sourceIndex}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-primary/30 transition-all duration-200 group"
                              >
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-foreground group-hover:text-primary line-clamp-2 transition-colors font-medium">
                                    {source.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-1 block truncate">
                                    {source.url}
                                  </span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Timestamp */}
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      message.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    
                    {/* Quick replies */}
                    {message.role === 'agent' && message.quickReplies && message.quickReplies.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Quick replies:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.quickReplies.map((reply, replyIndex) => (
                              <Button
                                key={replyIndex}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickReply(reply)}
                                className="h-9 text-xs bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
                              >
                                {reply}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-semibold">You</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            {/* Web Search Toggle */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="web-search" className="text-sm font-medium cursor-pointer">
                  Enhance with Web Search
                </Label>
              </div>
              <Switch
                id="web-search"
                checked={webSearchEnabled}
                onCheckedChange={setWebSearchEnabled}
                disabled={isTyping}
              />
            </div>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s...` : "Ask me anything about this crisis..."}
                disabled={isTyping || cooldownRemaining > 0}
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isTyping || cooldownRemaining > 0}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {cooldownRemaining > 0
                    ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s between messages`
                    : 'Or use the quick reply buttons above'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {cooldownRemaining > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Cooldown: {Math.ceil(cooldownRemaining / 1000)}s
                  </Badge>
                )}
                {webSearchEnabled && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Globe className="h-3 w-3" />
                    Web search active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info badge */}
      <div className="flex justify-center">
        <Badge variant="secondary" className="gap-2">
          <Sparkles className="h-3 w-3" />
          AI-powered conversation to help you make an informed decision
        </Badge>
      </div>
    </div>
  );
}