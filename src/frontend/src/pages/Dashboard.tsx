import { useState } from 'react';
import { Mode } from '../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '../components/FileUpload';
import JobsList from '../components/JobsList';
import UnifiedVideoEditor from '../components/UnifiedVideoEditor';
import { Film, Upload, History, Video } from 'lucide-react';

export default function Dashboard() {
  const [selectedMode, setSelectedMode] = useState<Mode>(Mode.audio);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Film className="h-10 w-10 text-primary" />
          Auvid Professional Editing
        </h1>
        <p className="text-muted-foreground text-lg">
          Professional media editing and enhancement tools
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="editor" className="flex items-center gap-2 py-3">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Video Editor</span>
            <span className="sm:hidden">Editor</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2 py-3">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
            <span className="sm:hidden">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 py-3">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-6 w-6" />
                Professional Video Editor
              </CardTitle>
              <CardDescription>
                Real-time video editing with GPU-accelerated preview and AI enhancement controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedVideoEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6" />
                Processing History
              </CardTitle>
              <CardDescription>
                View and download your processed files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobsList key={refreshKey} mode={selectedMode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
