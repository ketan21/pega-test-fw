/**
 * Utilities for generating unique test data
 */

/**
 * Generate a unique case number
 */
export function generateCaseNumber(prefix = 'CASE'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique email address
 */
export function generateEmail(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `test-${timestamp}@example.com`;
}

/**
 * Generate a random first name
 */
export function generateFirstName(): string {
  const firstNames = [
    'John', 'Jane', 'Alice', 'Bob', 'Charlie',
    'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
    'Ivan', 'Julia', 'Kevin', 'Laura', 'Michael',
    'Nancy', 'Oliver', 'Patricia', 'Quentin', 'Rachel'
  ];
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

/**
 * Generate a random last name
 */
export function generateLastName(): string {
  const lastNames = [
    'Smith', 'Doe', 'Wilson', 'Chen', 'Garcia',
    'Johnson', 'Brown', 'Taylor', 'Davis', 'Miller',
    'Moore', 'Anderson', 'Thomas', 'Jackson', 'White',
    'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark'
  ];
  return lastNames[Math.floor(Math.random() * lastNames.length)];
}

/**
 * Generate a full name
 */
export function generateFullName(): string {
  return `${generateFirstName()} ${generateLastName()}`;
}

/**
 * Generate a random street address
 */
export function generateAddress(): {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  return {
    street: `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Park', 'Lake'][Math.floor(Math.random() * 8)]} ${['St', 'Ave', 'Blvd', 'Dr', 'Ln'][Math.floor(Math.random() * 5)]}`,
    city: ['Springfield', 'Riverside', 'Franklin', 'Clinton', 'Madison', 'Georgetown'][Math.floor(Math.random() * 6)],
    state: ['NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA'][Math.floor(Math.random() * 8)],
    zip: `${Math.floor(Math.random() * 90000) + 10000}`,
    country: 'US'
  };
}

/**
 * Generate a random phone number
 */
export function generatePhoneNumber(): string {
  return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

/**
 * Generate a random date within the last N days
 */
export function generateRandomDate(daysBack: number = 30): string {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const random = new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
  return random.toISOString().split('T')[0];
}

/**
 * Generate a random amount between min and max
 */
export function generateRandomAmount(min: number = 100, max: number = 10000): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/**
 * Generate a random boolean
 */
export function generateRandomBoolean(): boolean {
  return Math.random() > 0.5;
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Format date for Pega (handles various Pega date formats)
 */
export function formatPegaDate(date: Date, format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD-MMM-YYYY' = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD-MMM-YYYY':
      return `${day}-${monthName}-${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Generate a complete sample case payload
 */
export function generateSampleCasePayload(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    'Case.Type': 'Standard',
    'Case.Priority': 'Normal',
    'WorkItem.AssignedTo': 'PEGA-User1',
    'Customer.FirstName': generateFirstName(),
    'Customer.LastName': generateLastName(),
    'Customer.Email': generateEmail(),
    'Customer.Phone': generatePhoneNumber(),
    'Customer.Address.Street': generateAddress().street,
    'Customer.Address.City': generateAddress().city,
    'Customer.Address.State': generateAddress().state,
    'Customer.Address.Zip': generateAddress().zip,
    ...overrides
  };
}
