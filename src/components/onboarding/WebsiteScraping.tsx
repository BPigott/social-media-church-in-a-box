import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CircleNotch } from "phosphor-react";

const SCRAPING_MESSAGES = [
  { progress: 10, message: "Reading your About Us page... 📖", subtitle: "Learning who you are" },
  { progress: 25, message: "Getting to know your church's vibe... ✨", subtitle: "Understanding your style" },
  { progress: 40, message: "Analyzing your mission statement... 🎯", subtitle: "Capturing your vision" },
  { progress: 55, message: "Checking out your ministries... 🙏", subtitle: "Discovering what you do" },
  { progress: 70, message: "Learning your church's unique story... 📚", subtitle: "Finding your voice" },
  { progress: 85, message: "Almost there! Just wrapping up... 🎁", subtitle: "Final touches" },
  { progress: 95, message: "Done! Moving to the next step... 🎉", subtitle: "Ready to continue" },
];

export const WebsiteScraping = () => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(SCRAPING_MESSAGES[0]);

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < SCRAPING_MESSAGES.length) {
        setCurrentMessage(SCRAPING_MESSAGES[currentStep]);
        setProgress(SCRAPING_MESSAGES[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <CircleNotch size={64} className="animate-spin text-primary" />
      </div>
      
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-2xl font-playfair font-bold">
          {currentMessage.message}
        </h3>
        <p className="text-muted-foreground">
          {currentMessage.subtitle}
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-3" />
        <p className="text-center text-sm text-muted-foreground">
          {progress}% complete
        </p>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p>We're analyzing your website to understand your church's personality and style. This helps us create content that sounds like you! 🎨</p>
      </div>
    </div>
  );
};