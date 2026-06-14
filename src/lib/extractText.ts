import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Matches the worker path used by the dashboard transcript uploader.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export class TextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextExtractionError";
  }
}

/**
 * Extract plain text from an uploaded sermon document.
 *
 * Supports .txt / .md (read directly), .docx / .doc (mammoth), and .pdf
 * (pdf.js). Throws {@link TextExtractionError} with a user-facing message
 * for unsupported types or PDFs that contain no selectable text (scanned).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split(".").pop();

  if (extension === "txt" || extension === "md") {
    return (await file.text()).trim();
  }

  if (extension === "docx" || extension === "doc") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  if (extension === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n\n";
    }

    const trimmed = fullText.trim();
    if (trimmed.length < 50) {
      throw new TextExtractionError(
        `"${file.name}" appears to be scanned or image-only. Please upload a PDF with selectable text, or convert it with OCR first.`,
      );
    }
    return trimmed;
  }

  throw new TextExtractionError(
    `"${file.name}" is not a supported format. Please upload a PDF, TXT, or DOCX file.`,
  );
}
