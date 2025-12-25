/**
 * Debug Logger with Correlation ID Support
 * Provides structured logging for the article → organization pipeline
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type PipelineStage = 
  | 'article_ingest_started'
  | 'article_parsed_ok'
  | 'cause_classification_ok'
  | 'org_provider_query_started'
  | 'org_provider_response_received'
  | 'org_filtering_started'
  | 'org_filtering_result'
  | 'org_ranking_started'
  | 'org_ranking_result'
  | 'ui_render_started'
  | 'ui_rendered_count'
  | 'pipeline_error';

export interface LogEntry {
  correlationId: string;
  stage: PipelineStage;
  timestamp: number;
  elapsedMs: number;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  resultCount?: number;
  error?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private startTimes: Map<string, number> = new Map();
  private enabled: boolean = true;

  /**
   * Generate a unique correlation ID for tracking a pipeline execution
   */
  generateCorrelationId(): string {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start timing for a correlation ID
   */
  startTimer(correlationId: string): void {
    this.startTimes.set(correlationId, Date.now());
  }

  /**
   * Get elapsed time for a correlation ID
   */
  private getElapsedTime(correlationId: string): number {
    const startTime = this.startTimes.get(correlationId);
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  /**
   * Log a pipeline stage
   */
  log(
    correlationId: string,
    stage: PipelineStage,
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    resultCount?: number,
    error?: string
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      correlationId,
      stage,
      timestamp: Date.now(),
      elapsedMs: this.getElapsedTime(correlationId),
      level,
      message,
      data,
      resultCount,
      error,
    };

    this.logs.push(entry);

    // Console output with emoji indicators
    const emoji = this.getStageEmoji(stage);
    const levelEmoji = this.getLevelEmoji(level);
    const countStr = resultCount !== undefined ? ` [count: ${resultCount}]` : '';
    const errorStr = error ? ` ❌ ${error}` : '';
    
    console.log(
      `${emoji} ${levelEmoji} [${correlationId.slice(-8)}] ${stage} (+${entry.elapsedMs}ms)${countStr}: ${message}${errorStr}`,
      data || ''
    );
  }

  /**
   * Get logs for a specific correlation ID
   */
  getLogsForCorrelation(correlationId: string): LogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.startTimes.clear();
  }

  /**
   * Get a summary report for a correlation ID
   */
  getSummary(correlationId: string): string {
    const logs = this.getLogsForCorrelation(correlationId);
    if (logs.length === 0) return 'No logs found for this correlation ID';

    const lines: string[] = [
      `\n📊 Pipeline Summary for ${correlationId}`,
      `${'='.repeat(60)}`,
    ];

    logs.forEach(log => {
      const emoji = this.getStageEmoji(log.stage);
      const countStr = log.resultCount !== undefined ? ` → ${log.resultCount} items` : '';
      const errorStr = log.error ? ` ❌ ${log.error}` : '';
      lines.push(
        `${emoji} ${log.stage} (+${log.elapsedMs}ms)${countStr}${errorStr}`
      );
      if (log.data) {
        lines.push(`   ${JSON.stringify(log.data, null, 2).split('\n').join('\n   ')}`);
      }
    });

    lines.push(`${'='.repeat(60)}\n`);
    return lines.join('\n');
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getStageEmoji(stage: PipelineStage): string {
    const emojiMap: Record<PipelineStage, string> = {
      article_ingest_started: '📥',
      article_parsed_ok: '📄',
      cause_classification_ok: '🏷️',
      org_provider_query_started: '🔍',
      org_provider_response_received: '📡',
      org_filtering_started: '🔬',
      org_filtering_result: '✅',
      org_ranking_started: '📊',
      org_ranking_result: '🏆',
      ui_render_started: '🎨',
      ui_rendered_count: '✨',
      pipeline_error: '❌',
    };
    return emojiMap[stage] || '📌';
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojiMap: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojiMap[level];
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Export for dev tools access
if (typeof window !== 'undefined') {
  (window as any).__debugLogger = debugLogger;
}