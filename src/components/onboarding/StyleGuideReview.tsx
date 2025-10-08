import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface StyleGuideReviewProps {
  styleGuide: string;
  onAccept: (finalGuide: string) => void;
  onRegenerate: () => void;
}

export const StyleGuideReview = ({ styleGuide, onAccept, onRegenerate }: StyleGuideReviewProps) => {
  const [editedGuide, setEditedGuide] = useState(styleGuide);
  const [activeTab, setActiveTab] = useState("preview");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-playfair font-semibold">Review Your Style Guide</h3>
        <p className="text-muted-foreground">
          Review and edit your generated style guide before continuing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{editedGuide}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={editedGuide}
            onChange={(e) => setEditedGuide(e.target.value)}
            rows={20}
            className="font-mono text-sm"
            placeholder="Edit your style guide markdown..."
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRegenerate}
          className="flex-1"
        >
          Regenerate
        </Button>
        <Button
          onClick={() => onAccept(editedGuide)}
          size="lg"
          className="flex-1"
        >
          Accept & Complete Setup
        </Button>
      </div>
    </div>
  );
};
