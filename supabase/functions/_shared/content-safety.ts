// Content safety validation utilities

// Patterns to detect inappropriate content
// NOTE: This is a church/sermon app. Many common religious words must be excluded:
// - "hell", "damn" — core theological concepts
// - "stakes", "bet", "wager" — common idioms in speech/sermons ("the stakes are high", "I bet...")
// - "sex", "sexual" — addressed in purity/marriage sermons
// - "jesus christ", "oh my god", "omg" — normal reverent usage
const PROHIBITED_PATTERNS = {
  erotic: [
    /\b(erotic|porn|nude|naked|orgasm|xxx|adult content)\b/gi,
    // Note: "sex" and "sexual" excluded — preachers regularly address sexual ethics/purity
  ],
  gambling: [
    /\b(gambling|casino|betting|poker|slots|jackpot|lottery)\b/gi,
    // Note: "bet", "wager", "stakes" excluded — common speech idioms in sermons
  ],
  profanity: [
    /\b(f\*\*k|sh\*t|a\*\*hole|b\*\*ch)\b/gi,
    /\b(fuck|shit|asshole|bitch)\b/gi,
    // Note: "hell" and "damn" excluded — core theological terms used in Christian preaching
  ],
  blasphemy: [
    /\b(god dammit|god damn)\b/gi,
    // Note: "jesus christ", "oh my god", "omg" intentionally excluded — normal church usage
  ],
  hate: [
    /\b(n\*\*ger|k\*\*ke|f\*\*got|sp\*\*c|ch\*\*k)\b/gi,
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



