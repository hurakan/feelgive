/**
 * Debug Panel Component
 * Displays pipeline execution status in development mode
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { debugLogger, LogEntry } from '@/utils/debug-logger';
import { ChevronDown, ChevronUp, Bug, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DebugPanelProps {
  correlationId: string | null;
}

export function DebugPanel({ correlationId }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!correlationId || !autoRefresh) return;

    const interval = setInterval(() => {
      const currentLogs = debugLogger.getLogsForCorrelation(correlationId);
      setLogs(currentLogs);
    }, 500);

    return () => clearInterval(interval);
  }, [correlationId, autoRefresh]);

  useEffect(() => {
    if (correlationId) {
      const currentLogs = debugLogger.getLogsForCorrelation(correlationId);
      setLogs(currentLogs);
    }
  }, [correlationId]);

  if (!correlationId) {
    return null;
  }

  const handleCopySummary = () => {
    const summary = debugLogger.getSummary(correlationId);
    navigator.clipboard.writeText(summary);
    toast.success('Pipeline summary copied to clipboard');
  };

  const handleClearLogs = () => {
    debugLogger.clearLogs();
    setLogs([]);
    toast.success('Debug logs cleared');
  };

  // Extract key metrics from logs
  const lastLog = logs[logs.length - 1];
  const classificationLog = logs.find(l => l.stage === 'cause_classification_ok');
  const providerResponseLog = logs.find(l => l.stage === 'org_provider_response_received');
  const filteringLog = logs.find(l => l.stage === 'org_filtering_result');
  const rankingLog = logs.find(l => l.stage === 'org_ranking_result');
  const renderLog = logs.find(l => l.stage === 'ui_rendered_count');
  const errorLogs = logs.filter(l => l.level === 'error' || l.stage === 'pipeline_error');

  const extractedLocation = classificationLog?.data?.detectedLocation || 'N/A';
  const extractedCause = classificationLog?.data?.cause || 'N/A';
  const providerCount = providerResponseLog?.resultCount ?? 'N/A';
  const filteredCount = filteringLog?.resultCount ?? 'N/A';
  const finalCount = renderLog?.resultCount ?? 'N/A';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="shadow-2xl border-2 border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm">Debug Panel</CardTitle>
                  {errorLogs.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {errorLogs.length} error{errorLogs.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Correlation ID */}
              <div className="text-xs">
                <span className="font-mono text-muted-foreground">
                  ID: {correlationId.slice(-12)}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="space-y-2">
                <div className="text-xs font-semibold">Pipeline Status:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <div className="font-medium">{extractedLocation}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cause:</span>
                    <div className="font-medium">{extractedCause}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <div className="font-medium">{providerCount} orgs</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filtered:</span>
                    <div className="font-medium">{filteredCount} orgs</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Final:</span>
                    <div className="font-medium text-primary">{finalCount} orgs</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <div className="font-medium">{lastLog?.elapsedMs || 0}ms</div>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {errorLogs.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-destructive">Errors:</div>
                  {errorLogs.map((log, idx) => (
                    <div key={idx} className="text-xs bg-destructive/10 p-2 rounded">
                      <div className="font-medium">{log.message}</div>
                      {log.error && (
                        <div className="text-muted-foreground mt-1">{log.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pipeline Stages */}
              <div className="space-y-1">
                <div className="text-xs font-semibold">Stages:</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs flex items-start gap-2 p-1 rounded hover:bg-muted/50"
                    >
                      <Badge
                        variant={
                          log.level === 'error'
                            ? 'destructive'
                            : log.level === 'warn'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-[10px] px-1 py-0"
                      >
                        {log.elapsedMs}ms
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{log.stage}</div>
                        {log.resultCount !== undefined && (
                          <div className="text-muted-foreground">
                            → {log.resultCount} items
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySummary}
                  className="flex-1 h-8 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Summary
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearLogs}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}