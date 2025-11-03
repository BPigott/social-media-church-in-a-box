// Content safety validation utilities

// Patterns to detect inappropriate content
const PROHIBITED_PATTERNS = {
  erotic: [
    /\b(erotic|porn|sex|sexual|nude|naked|orgasm|xxx|adult content)\b/gi,
  ],
  gambling: [
    /\b(gambling|casino|bet|betting|poker|slots|jackpot|lottery|wager|stakes)\b/gi,
  ],
  profanity: [
    /\b(f\*\*k|sh\*t|a\*\*hole|b\*\*ch|d\*\*n|h\*\*l)\b/gi,
    /\b(fuck|shit|asshole|bitch|damn|hell)\b/gi, // Common misspellings
  ],
  blasphemy: [
    /\b(god dammit|god damn|jesus christ|oh my god|omg)\b/gi, // Context-dependent, adjust as needed
    // Add patterns that detect mocking or irreverent use of sacred terms
  ],
  hate: [
    /\b(n\*\*ger|k\*\*ke|f\*\*got|sp\*\*c|ch\*\*k)\b/gi,
    // Add other hate speech patterns
  ],
};

export interface ValidationResult {
  isSafe: boolean;
  violations: string[];
  sanitizedText?: string;
}

export function validateInput(content: string): ValidationResult {
  const violations: string[] = [];
  
  if (!content || typeof content !== 'string') {
    return { isSafe: true, violations: [] };
  }
  
  const lowerContent = content.toLowerCase();
  
  // Check for prohibited patterns
  for (const [category, patterns] of Object.entries(PROHIBITED_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        violations.push(category);
        break; // Only add category once
      }
    }
  }
  
  return {
    isSafe: violations.length === 0,
    violations: [...new Set(violations)], // Remove duplicates
    sanitizedText: content, // In future, could implement sanitization
  };
}

export function validateGeneratedContent(content: string | string[] | null | undefined): ValidationResult {
  if (!content) {
    return { isSafe: true, violations: [] };
  }
  
  const contentArray = Array.isArray(content) ? content : [content];
  const allViolations: string[] = [];
  
  for (const item of contentArray) {
    if (typeof item === 'string') {
      const result = validateInput(item);
      if (!result.isSafe) {
        allViolations.push(...result.violations);
      }
    }
  }
  
  return {
    isSafe: allViolations.length === 0,
    violations: [...new Set(allViolations)],
  };
}

