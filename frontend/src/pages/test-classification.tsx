import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { runClassificationTests, generateTestReport, exportTestResultsToCSV, TestResult } from '@/utils/classification-testing';

export default function TestClassification() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [report, setReport] = useState<string>('');

  const handleRunTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    
    const testResults = await runClassificationTests();
    
    // Simulate progress updates
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setResults(testResults);
    setReport(generateTestReport(testResults));
    setIsRunning(false);
  };

  const handleDownloadCSV = () => {
    const csv = exportTestResultsToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classification-test-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classification-test-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const accuracy = results.length > 0 ? ((passed / results.length) * 100).toFixed(2) : 0;

  const falsePositives = results.filter(r => 
    !r.passed && r.expectedCause === 'none' && r.predictedCause !== 'none'
  );
  
  const falseNegatives = results.filter(r => 
    !r.passed && r.expectedCause !== 'none' && r.predictedCause === 'none'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      <div className="container max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Classification System Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive validation of AI classification accuracy
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Suite</CardTitle>
            <CardDescription>
              100 test cases: 50 non-crisis articles + 50 crisis articles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRunTests} 
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <>Running Tests...</>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  Testing... {progress}%
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-emerald-600">{passed}</div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-destructive">{failed}</div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{accuracy}%</div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {results.length > 0 && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleDownloadCSV} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
                <Button onClick={handleDownloadReport} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Tabs defaultValue="failures" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="failures">
                Failures ({failed})
              </TabsTrigger>
              <TabsTrigger value="false-positives">
                False Positives ({falsePositives.length})
              </TabsTrigger>
              <TabsTrigger value="false-negatives">
                False Negatives ({falseNegatives.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="failures">
              <Card>
                <CardHeader>
                  <CardTitle>All Failed Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {results.filter(r => !r.passed).map(result => (
                        <Card key={result.testId} className="border-destructive/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="font-semibold">{result.title}</h4>
                                  <Badge variant="outline">#{result.testId}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{result.source}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="secondary">
                                    Expected: {result.expectedCause}
                                  </Badge>
                                  <Badge variant="destructive">
                                    Got: {result.predictedCause}
                                  </Badge>
                                  <Badge>
                                    {(result.confidence * 100).toFixed(0)}% confidence
                                  </Badge>
                                </div>
                                {result.failureReason && (
                                  <p className="text-sm text-destructive">{result.failureReason}</p>
                                )}
                                {result.matchedKeywords.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Keywords: {result.matchedKeywords.slice(0, 10).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="false-positives">
              <Card>
                <CardHeader>
                  <CardTitle>False Positives</CardTitle>
                  <CardDescription>
                    Non-crisis content incorrectly classified as crisis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {falsePositives.map(result => (
                        <Card key={result.testId} className="border-amber-500/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-1" />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="font-semibold">{result.title}</h4>
                                  <Badge variant="outline">#{result.testId}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{result.source}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="secondary">
                                    Category: {result.actualCategory}
                                  </Badge>
                                  <Badge variant="destructive">
                                    Classified as: {result.predictedCause}
                                  </Badge>
                                  <Badge>
                                    {(result.confidence * 100).toFixed(0)}% confidence
                                  </Badge>
                                </div>
                                {result.matchedKeywords.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Matched keywords: {result.matchedKeywords.slice(0, 10).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="false-negatives">
              <Card>
                <CardHeader>
                  <CardTitle>False Negatives</CardTitle>
                  <CardDescription>
                    Crisis content that was not detected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {falseNegatives.map(result => (
                        <Card key={result.testId} className="border-red-500/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="font-semibold">{result.title}</h4>
                                  <Badge variant="outline">#{result.testId}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{result.source}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="secondary">
                                    Should be: {result.expectedCause}
                                  </Badge>
                                  <Badge variant="destructive">
                                    Not detected
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  This crisis was not detected by the classification system
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}