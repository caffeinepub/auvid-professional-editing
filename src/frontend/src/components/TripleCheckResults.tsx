import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, AlertTriangle, CheckCircle2, Play, Pause } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { TripleCheckReport, exportReportAsJSON, exportReportAsText } from '@/lib/tripleCheckDiagnostics';

interface TripleCheckResultsProps {
  report: TripleCheckReport;
}

export default function TripleCheckResults({ report }: TripleCheckResultsProps) {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCheckpointChange = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setSelectedCheckpoint(index);
  };

  const handleDownloadJSON = () => {
    const blob = exportReportAsJSON(report);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triple-check-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded as JSON');
  };

  const handleDownloadText = () => {
    const blob = exportReportAsText(report);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triple-check-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded as text');
  };

  const currentCheckpoint = report.checkpoints[selectedCheckpoint];
  const hasIssues = report.sourceStage !== 'none';

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert variant={hasIssues ? 'destructive' : 'default'}>
        {hasIssues ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        <AlertTitle>
          {hasIssues ? 'Issues Detected' : 'No Issues Detected'}
        </AlertTitle>
        <AlertDescription>{report.summary}</AlertDescription>
      </Alert>

      {/* Source Stage Highlight */}
      {hasIssues && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Source Stage Identified
            </CardTitle>
            <CardDescription>
              Abnormalities first appear at: <strong>{report.sourceStage}</strong>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Checkpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Checkpoint Analysis</CardTitle>
          <CardDescription>
            Detailed metrics for each processing stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Checkpoint</TableHead>
                <TableHead>Sample Rate</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Peak</TableHead>
                <TableHead>RMS</TableHead>
                <TableHead>Clipping %</TableHead>
                <TableHead>NaN/Inf</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.checkpoints.map((checkpoint, index) => {
                const isSourceStage = hasIssues && checkpoint.stage === report.sourceStage;
                return (
                  <TableRow
                    key={index}
                    className={`cursor-pointer ${selectedCheckpoint === index ? 'bg-muted' : ''} ${
                      isSourceStage ? 'border-l-4 border-l-destructive' : ''
                    }`}
                    onClick={() => handleCheckpointChange(index)}
                  >
                    <TableCell className="font-medium">{checkpoint.name}</TableCell>
                    <TableCell>{checkpoint.metrics.sampleRate} Hz</TableCell>
                    <TableCell>{checkpoint.metrics.channels}</TableCell>
                    <TableCell>{checkpoint.metrics.duration.toFixed(2)}s</TableCell>
                    <TableCell>{checkpoint.metrics.peakLevel.toFixed(4)}</TableCell>
                    <TableCell>{checkpoint.metrics.rmsLevel.toFixed(4)}</TableCell>
                    <TableCell>{checkpoint.metrics.clippingPercentage.toFixed(2)}%</TableCell>
                    <TableCell>
                      {checkpoint.metrics.nanCount + checkpoint.metrics.infinityCount}
                    </TableCell>
                    <TableCell>
                      {checkpoint.abnormalities.hasAbnormalities ? (
                        <Badge variant="destructive">Issues</Badge>
                      ) : (
                        <Badge variant="outline">Clean</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Checkpoint Details */}
      <Card>
        <CardHeader>
          <CardTitle>Checkpoint Details: {currentCheckpoint.name}</CardTitle>
          <CardDescription>
            {currentCheckpoint.abnormalities.hasAbnormalities
              ? 'This checkpoint has detected abnormalities'
              : 'This checkpoint is clean'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Peak Level</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.peakLevel.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">RMS Level</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.rmsLevel.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">DC Offset</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.dcOffset.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Clipping</div>
              <div className="text-lg font-semibold">
                {currentCheckpoint.metrics.clippingCount} ({currentCheckpoint.metrics.clippingPercentage.toFixed(2)}%)
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">NaN Samples</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.nanCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Infinity Samples</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.infinityCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Sample Rate</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.sampleRate} Hz</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Channels</div>
              <div className="text-lg font-semibold">{currentCheckpoint.metrics.channels}</div>
            </div>
          </div>

          {/* Issues List */}
          {currentCheckpoint.abnormalities.hasAbnormalities && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Detected Issues:</div>
              <ul className="list-disc list-inside space-y-1">
                {currentCheckpoint.abnormalities.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-destructive">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Audio Player */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Audition Checkpoint:</div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePlayPause} variant="outline" size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <audio
                ref={audioRef}
                src={currentCheckpoint.audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
          <CardDescription>
            Download the diagnostic report for further analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleDownloadJSON} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
            <Button onClick={handleDownloadText} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Text
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
