import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Sparkles, Scissors, Play, Palette, Layers } from 'lucide-react';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8 flex justify-center">
            <img
              src="/assets/generated/professional-nle-interface.dim_1200x800.png"
              alt="Auvid Professional Editing Interface"
              className="rounded-2xl shadow-2xl border border-border/50 max-w-full"
            />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Professional NLE Suite with AI Enhancement</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Auvid Professional Editing
            <br />
            <span className="text-primary">Real-Time AI Video Processing</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Complete non-linear editing suite with GPU-accelerated real-time rendering, automatic AI upscaling to 4K, advanced ambient lighting enhancement, live scrubbing, and professional color grading. Deep-learning super-resolution for genuine visual improvement.
          </p>
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={loginStatus === 'logging-in'}
            className="text-lg px-10 py-7 h-auto shadow-lg hover:shadow-xl transition-all"
          >
            {loginStatus === 'logging-in' ? 'Connecting...' : 'Launch Auvid - Sign In'}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            GPU accelerated • Automatic 4K upscaling • Advanced low-light enhancement • Professional export
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-border/50 bg-card hover:shadow-lg transition-all hover:border-primary/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
              <Scissors className="h-7 w-7 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Non-Linear Editing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional timeline-based editing with multi-track support, precision trimming, and drag-and-drop clip management.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/50 bg-card hover:shadow-lg transition-all hover:border-primary/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30">
              <Play className="h-7 w-7 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Preview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GPU-accelerated live preview with instant visual feedback. See edits, transitions, and effects in real-time as you work.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/50 bg-card hover:shadow-lg transition-all hover:border-primary/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30">
              <Palette className="h-7 w-7 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Enhancement</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatic AI upscaling to 4K, advanced ambient lighting enhancement, professional color grading, body editing, and de-noising with deep-learning models.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/50 bg-card hover:shadow-lg transition-all hover:border-primary/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
              <Layers className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Track Timeline</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Separate tracks for video, audio, titles, and effects. Professional workflow with keyframe animation and transitions.
            </p>
          </div>
        </div>

        {/* Technology Highlights */}
        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Professional NLE Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Industry-standard editing tools combined with cutting-edge AI enhancement for professional video production
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
              </div>
              <h4 className="font-semibold mb-2">Automatic 4K Upscaling</h4>
              <p className="text-sm text-muted-foreground">
                Deep-learning super-resolution automatically upscales every video to highest quality with real pixel generation
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
              </div>
              <h4 className="font-semibold mb-2">Advanced Ambient Lighting</h4>
              <p className="text-sm text-muted-foreground">
                Powerful GPU-powered enhancement dynamically improves scene brightness, shadow balance, and contrast
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
              </div>
              <h4 className="font-semibold mb-2">GPU Acceleration</h4>
              <p className="text-sm text-muted-foreground">
                Hardware-accelerated rendering for smooth real-time performance with instant visual feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
