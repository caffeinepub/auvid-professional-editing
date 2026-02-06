import { useState } from 'react';
import { useGetUserJobs } from '../hooks/useQueries';
import { Mode } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileAudio, FileVideo, Loader2 } from 'lucide-react';

interface JobsListProps {
  mode: Mode | null;
}

export default function JobsList({ mode }: JobsListProps) {
  const { data: jobs, isLoading } = useGetUserJobs(mode);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          {mode === Mode.audio ? (
            <FileAudio className="h-12 w-12 text-muted-foreground" />
          ) : (
            <FileVideo className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2">Processing History</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {mode === Mode.audio
            ? 'Your processed audio files will appear here. Upload an audio file to get started.'
            : 'Your processed video files will appear here. Upload a video file to get started.'}
        </p>
        <p className="text-xs text-muted-foreground mt-4 max-w-md">
          Note: Job history functionality requires additional backend implementation.
        </p>
      </CardContent>
    </Card>
  );
}
