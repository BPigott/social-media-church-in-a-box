import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, CheckCircle } from "phosphor-react";

interface SermonUploadProps {
  onFilesSelected: (files: File[]) => void;
  onContinue: () => void;
  minFiles?: number;
  maxFiles?: number;
}

export const SermonUpload = ({
  onFilesSelected,
  onContinue,
  minFiles = 7,
  maxFiles = 20,
}: SermonUploadProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `${file.name} is not a supported format. Please upload PDF, TXT, or DOCX files.`,
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `${file.name} exceeds 10MB limit.`,
      });
      return false;
    }

    return true;
  };

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles: File[] = [];
    Array.from(newFiles).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });

    if (files.length + validFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files.`,
      });
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  }, [files, maxFiles, onFilesSelected, toast]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleContinue = () => {
    if (files.length < minFiles) {
      toast({
        variant: "destructive",
        title: "Not enough files",
        description: `Please upload at least ${minFiles} sermon documents.`,
      });
      return;
    }
    onContinue();
  };

  const remaining = minFiles - files.length;
  const progressValue = Math.min((files.length / minFiles) * 100, 100);
  const hasMetMinimum = files.length >= minFiles;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-playfair font-semibold">Upload Sermon Documents</h3>
        <p className="text-muted-foreground">
          Upload at least {minFiles} recent sermon transcripts to help us understand your church's voice
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Top Tips for Best Results</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• More sermons = better style guide accuracy</li>
                <li>• Choose sermons from different preaching series to showcase teaching variety</li>
                <li>• Upload at least 7 sermons from different series and speakers for the best style guide</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center
          transition-colors cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drop sermon files here</p>
        <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Accepted formats: PDF, TXT, DOCX (max 10MB each)
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasMetMinimum && (
                <CheckCircle size={18} className="text-green-500" weight="fill" />
              )}
              <p className="text-sm font-medium">
                {files.length} of {minFiles} sermons uploaded
              </p>
            </div>
            {hasMetMinimum && (
              <span className="text-xs text-green-600 font-medium">Minimum reached</span>
            )}
          </div>
          <Progress value={progressValue} className="h-2" />
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleContinue}
        size="lg"
        className="w-full"
        disabled={files.length < minFiles}
      >
        {hasMetMinimum
          ? "Continue to Generate Style Guide"
          : `Upload ${remaining} more sermon${remaining === 1 ? '' : 's'} to continue`}
      </Button>
    </div>
  );
};
