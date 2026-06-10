import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, CheckCircle } from "phosphor-react";

interface SermonUploadProps {
  onFilesSelected: (files: File[]) => void;
  onContinue: () => void;
  initialFiles?: File[];
  minFiles?: number;
  maxFiles?: number;
}

export const SermonUpload = ({
  onFilesSelected,
  onContinue,
  initialFiles = [],
  minFiles = 7,
  maxFiles = 20,
}: SermonUploadProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>(initialFiles);
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
        title: "Not enough sermons",
        description: `Please upload at least ${minFiles} sermon documents.`,
      });
      return;
    }
    onContinue();
  };

  const remaining = Math.max(minFiles - files.length, 0);
  const progressValue = Math.min((files.length / minFiles) * 100, 100);
  const hasMetMinimum = files.length >= minFiles;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="font-playfair text-2xl font-semibold">Upload your sermons</h3>
        <p className="mx-auto max-w-md text-muted-foreground">
          Your sermons are the clearest window into your church's voice. Upload at least {minFiles} —
          the more you add, the better Ivangel knows how you speak.
        </p>
      </div>

      {/* Prominent progress counter — always visible */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-tactile">
        <div className="flex flex-wrap items-end justify-between gap-y-2">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-playfair text-4xl font-bold leading-none text-primary">
              {files.length}
            </span>
            <span className="text-lg font-medium text-muted-foreground">/ {minFiles}</span>
            <span className="ml-1 text-sm text-muted-foreground">sermons</span>
          </div>
          {hasMetMinimum ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <CheckCircle size={18} weight="fill" />
              Ready to continue
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {remaining} more to go
            </span>
          )}
        </div>
        <Progress value={progressValue} className="mt-3 h-2.5 bg-primary/15" />
      </div>

      <div
        className={`
          cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload size={44} className="mx-auto mb-4 text-muted-foreground" />
        <p className="mb-2 text-lg font-medium">Drop sermon files here</p>
        <p className="mb-4 text-sm text-muted-foreground">or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Accepted formats: PDF, TXT, DOCX (max 10MB each). Choose sermons from different series and
          speakers for the richest voice profile.
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
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border bg-card p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText size={20} className="flex-shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
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
      )}

      <Button
        onClick={handleContinue}
        size="lg"
        className="w-full"
        disabled={!hasMetMinimum}
      >
        {hasMetMinimum
          ? "Build my voice profile →"
          : `Upload ${remaining} more sermon${remaining === 1 ? '' : 's'} to continue`}
      </Button>
    </div>
  );
};
