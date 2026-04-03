/**
 * Finnish Bank Reference Number (Viitenumero) — SFS 5338 Standard
 *
 * Generates valid Finnish reference numbers with check digits,
 * RF (international) references, and Virtuaaliviivakoodi (virtual barcode).
 *
 * Algorithm: weights [7, 3, 1] cycle from right-to-left.
 * Check digit = (10 - (sum % 10)) % 10
 *
 * Example: base "1" → weight 7 → 1×7=7 → next ten 10 → check 10-7=3 → "13"
 * Example: base "000001" → same calculation → "0000013"
 */

// ── SFS 5338 Check Digit ──────────────────────────────────────────────────

/**
 * Calculate the Finnish SFS 5338 check digit for a base number string.
 *
 * Algorithm:
 * 1. Take the base number digits from RIGHT to LEFT
 * 2. Multiply each digit by the weight cycle [7, 3, 1]
 * 3. Sum all products
 * 4. Check digit = (10 - (sum % 10)) % 10
 *
 * @param baseNumber - The base number string (digits only, no check digit)
 * @returns The check digit (0-9)
 */
export function calculateCheckDigit(baseNumber: string): number {
  const weights = [7, 3, 1];
  const digits = baseNumber.replace(/\D/g, '').split('').reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    const weight = weights[i % 3];
    sum += parseInt(digits[i], 10) * weight;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Generate a complete Finnish reference number from a base number.
 *
 * @param baseNumber - The base number (will be stripped of non-digits)
 * @returns The complete reference number with check digit appended
 */
export function generateReferenceNumber(baseNumber: number | string): string {
  const base = String(baseNumber).replace(/\D/g, '');
  if (base.length === 0) return '';
  const checkDigit = calculateCheckDigit(base);
  return base + checkDigit;
}

/**
 * Format a Finnish reference number for display.
 * Groups digits from the right in groups of 5, with spaces.
 *
 * Example: 1234569 → "123 4569"
 * Example: 10000000001 → "100 00000 00011"
 *
 * @param refNumber - The complete reference number (with check digit)
 * @returns The formatted reference number string
 */
export function formatReferenceNumber(refNumber: string): string {
  const digits = refNumber.replace(/\D/g, '');
  if (digits.length === 0) return '';

  const groups: string[] = [];
  let remaining = digits;

  while (remaining.length > 0) {
    if (remaining.length <= 5) {
      groups.unshift(remaining);
      remaining = '';
    } else {
      groups.unshift(remaining.slice(-5));
      remaining = remaining.slice(0, -5);
    }
  }

  return groups.join(' ');
}

/**
 * Validate a Finnish reference number (including check digit).
 *
 * @param refNumber - The reference number to validate (with or without spaces)
 * @returns true if the reference number has a valid check digit
 */
export function validateReferenceNumber(refNumber: string): boolean {
  const digits = refNumber.replace(/\D/g, '');
  if (digits.length < 4) return false; // Minimum valid: 3 digits + 1 check

  const base = digits.slice(0, -1);
  const expectedCheck = calculateCheckDigit(base);
  const actualCheck = parseInt(digits[digits.length - 1], 10);

  return expectedCheck === actualCheck;
}

// ── RF Reference (International) ──────────────────────────────────────────

/**
 * Convert a Finnish reference number to the international RF format.
 *
 * RF Reference = RF + 2 check digits + Finnish reference
 * Check digits calculated using ISO 7064 MOD 97-10.
 *
 * Calculation:
 * 1. Start with "RF00" + Finnish reference
 * 2. Move "RF00" to the end
 * 3. Convert letters to numbers (R=27, F=15)
 * 4. Calculate modulo 97
 * 5. Check digits = 98 - (modulo 97 result)
 *
 * @param finnishRef - The Finnish reference number (with check digit)
 * @returns The RF reference string, or empty string if invalid
 */
export function generateRFReference(finnishRef: string): string {
  const digits = finnishRef.replace(/\D/g, '');
  if (digits.length < 4) return '';

  // Build the check string: RF00 + reference digits
  // Move RF00 to end: reference digits + RF00
  // Convert: R=27, F=15 → 271500 + reference digits
  const checkString = digits + '271500';
  const remainder = mod97(checkString);
  const checkDigits = String(98 - remainder).padStart(2, '0');

  return `RF${checkDigits}${digits}`;
}

/**
 * Format RF reference with spaces for readability.
 * Groups into blocks of 4 characters.
 *
 * @param rfRef - The RF reference string
 * @returns Formatted RF reference
 */
export function formatRFReference(rfRef: string): string {
  if (!rfRef) return '';
  return rfRef.replace(/(.{4})/g, '$1 ').trim();
}

// ── Virtuaaliviivakoodi (Finnish Virtual Barcode) ─────────────────────────

/**
 * Convert a Finnish IBAN to domestic BBAN format.
 *
 * Finnish IBAN: FI + 2 check digits + 14-digit national ID
 * BBAN = national ID padded to 16 digits with trailing zeros
 *
 * Example: FI21 1234 5600 0007 85 → 1234560000078500
 *
 * @param iban - Finnish IBAN (with or without spaces)
 * @returns 16-digit BBAN string, or empty string if not a Finnish IBAN
 */
export function ibanToBBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!cleaned.startsWith('FI') || cleaned.length < 18) return '';

  // Remove "FI" + 2 check digits → 14-digit national account number
  const nationalId = cleaned.slice(4, 18);
  // Pad to 16 digits with trailing zeros
  return nationalId.padEnd(16, '0');
}

/**
 * Generate a Finnish Virtuaaliviivakoodi (Virtual Barcode).
 *
 * This is the human-readable representation printed on Finnish invoices
 * for easy manual entry of payment details.
 *
 * Format (53 digits, printed in groups of 5 separated by spaces):
 * ┌───┬───┬──────────────────┬────────┬───┬──────────────────────┬────────┐
 * │ 4 │ 7 │ BBAN (16 digits) │ Cents  │000│ Reference (20 digits)│ DDMMYY │
 * │   │   │                  │ (6 dg) │   │ left-padded           │ (6 dg) │
 * └───┴───┴──────────────────┴────────┴───┴──────────────────────┴────────┘
 *
 * @param params - Barcode parameters
 * @returns Formatted virtual barcode string, or empty string if invalid
 */
export function generateVirtualBarcode(params: {
  iban: string;
  amountCents: number;
  referenceNumber: string;
  dueDate?: Date;
}): string {
  const { iban, amountCents, referenceNumber, dueDate } = params;

  const bban = ibanToBBAN(iban);
  if (!bban || bban.length !== 16) return '';

  const refDigits = referenceNumber.replace(/\D/g, '');

  // Build raw barcode (53 digits)
  let barcode = '4';                          // Group identifier
  barcode += '7';                             // Transfer type
  barcode += bban;                            // Account number (16 digits)
  barcode += String(Math.round(amountCents)).padStart(6, '0'); // Amount in cents (6 digits)
  barcode += '000';                           // Reserved padding
  barcode += refDigits.padStart(20, '0');     // Reference (20 digits)

  if (dueDate) {
    const dd = String(dueDate.getDate()).padStart(2, '0');
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const yy = String(dueDate.getFullYear() % 100).padStart(2, '0');
    barcode += `${dd}${mm}${yy}`;
  } else {
    barcode += '000000';                      // No due date
  }

  // Format in groups of 5 separated by spaces
  const groups: string[] = [];
  let remaining = barcode;
  while (remaining.length > 0) {
    groups.push(remaining.slice(0, 5));
    remaining = remaining.slice(5);
  }

  return groups.join(' ');
}

// ── Internal Helpers ──────────────────────────────────────────────────────

/**
 * Calculate MOD 97 for a numeric string (handles large numbers via BigInt).
 * Used for RF reference check digit calculation.
 */
function mod97(numericString: string): number {
  let remainder = 0n;
  for (const char of numericString) {
    const digit = parseInt(char, 10);
    if (isNaN(digit)) continue;
    remainder = (remainder * 10n + BigInt(digit)) % 97n;
  }
  return Number(remainder);
}
