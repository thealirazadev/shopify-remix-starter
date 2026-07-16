// Pure validation for the sample page's example label field. Kept separate
// from the route so it is unit-testable without mocking Prisma or Shopify.
export const LABEL_MAX_LENGTH = 100;

export interface LabelValidationResult {
  valid: boolean;
  message?: string;
}

export function validateLabel(rawLabel: string): LabelValidationResult {
  const label = rawLabel.trim();

  if (label.length === 0) {
    return { valid: false, message: "Label is required." };
  }

  if (label.length > LABEL_MAX_LENGTH) {
    return { valid: false, message: `Label must be ${LABEL_MAX_LENGTH} characters or fewer.` };
  }

  return { valid: true };
}
