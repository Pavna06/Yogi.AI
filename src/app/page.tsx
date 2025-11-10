import { Icons } from '@/components/icons';
import { YogiAiLoader } from '@/components/yogi-ai-loader';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Icons.yoga className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">Yogi.AI</span>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">Your personal AI yoga instructor.</p>
        </div>
      </header>
      <main className="flex-1">
        <YogiAiLoader />
      </main>
    </div>
  );
}
