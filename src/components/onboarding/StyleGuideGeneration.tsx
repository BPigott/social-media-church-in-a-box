import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CircleNotch, CheckCircle, WarningCircle } from "phosphor-react";

interface StyleGuideGenerationProps {
  onComplete: (styleGuide: string) => void;
  onRetry: () => void;
}

export const StyleGuideGeneration = ({ onComplete, onRetry }: StyleGuideGenerationProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [message, setMessage] = useState("Analyzing sermon content...");

  useEffect(() => {
    // Simulate progress with humorous messages
    const messages = [
      "Reading between the sermon lines... 📖",
      "Teaching our AI about your unique church vibe... ✨",
      "Identifying if you're a 'thee/thou' or 'wassup' kind of church... 🎭",
      "Counting how many times you say 'amen'... 🙏",
      "Calibrating the theological vocabulary meter... 📊",
      "Almost there! Just adding a pinch of Holy Ghost fire... 🔥",
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 1.5, 95);
        
        // Update message based on progress
        const newMessageIndex = Math.floor((newProgress / 100) * messages.length);
        if (newMessageIndex !== messageIndex && newMessageIndex < messages.length) {
          messageIndex = newMessageIndex;
          setMessage(messages[messageIndex]);
        }
        
        return newProgress;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  if (status === 'success') {
    return (
      <div className="text-center space-y-6 py-12">
        <CheckCircle size={64} className="mx-auto text-green-500" />
        <div className="space-y-2">
          <h3 className="text-2xl font-playfair font-semibold">Style Guide Generated!</h3>
          <p className="text-muted-foreground">
            Your church's unique communication style guide has been created
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center space-y-6 py-12">
        <WarningCircle size={64} className="mx-auto text-destructive" />
        <div className="space-y-2">
          <h3 className="text-2xl font-playfair font-semibold">Generation Failed</h3>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
        <Button onClick={onRetry} size="lg">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8 py-12">
      <div className="space-y-4">
        <CircleNotch size={64} className="mx-auto animate-spin text-primary" />
        <div className="space-y-2">
          <h3 className="text-2xl font-playfair font-semibold">Creating Your Style Guide</h3>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">{progress}% complete</p>
      </div>

      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        This usually takes 30-60 seconds. We're analyzing your content to capture your church's unique voice and tone.
      </p>
    </div>
  );
};
