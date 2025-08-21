import { api, APIError } from "encore.dev/api";
import { userDB } from "../users/db";
import { getAuthData } from "~encore/auth";
import * as bcrypt from "bcrypt";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";

const adminDeepSeekApiKey = secret("AdminDeepSeekAPIKey");

export interface BulkCSVUploadRequest {
  csvData: string; // Base64 encoded CSV content
  filename: string;
}

export interface BulkCSVUploadResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  errors: Array<{
    row: number;
    email?: string;
    name?: string;
    error: string;
  }>;
  duplicateEmails: string[];
  summary: string;
}

interface TeacherCSVRow {
  name: string;
  email: string;
  password?: string;
  schoolName?: string;
  schoolDistrict?: string;
  primaryGrade?: string;
  primarySubject?: string;
  teacherType?: string;
  subscriptionEndDate?: string;
  supportRequestsLimit?: string;
}

// Bulk upload teachers from CSV file.
export const bulkCSVUpload = api<BulkCSVUploadRequest, BulkCSVUploadResult>(
  { expose: true, method: "POST", path: "/admin/teachers/bulk-csv-upload", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    if (!req.csvData || !req.filename) {
      throw APIError.invalidArgument("CSV data and filename are required");
    }

    let csvContent: string;
    try {
      csvContent = Buffer.from(req.csvData, 'base64').toString('utf-8');
    } catch (error) {
      throw APIError.invalidArgument("Invalid base64 CSV data");
    }

    const errors: Array<{ row: number; email?: string; name?: string; error: string }> = [];
    const duplicateEmails: string[] = [];
    let successfulImports = 0;
    let totalRows = 0;

    try {
      const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 2) {
        throw APIError.invalidArgument("CSV file must contain at least a header row and one data row");
      }

      // Parse header row
      const headerRow = lines[0];
      const headers = parseCSVRow(headerRow).map(h => h.toLowerCase().trim());
      
      // Validate required headers
      const requiredHeaders = ['name', 'email'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        throw APIError.invalidArgument(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Get existing emails to check for duplicates
      const existingEmails = new Set<string>();
      const existingEmailsResult = await userDB.queryAll<{ email: string }>`
        SELECT email FROM users
      `;
      existingEmailsResult.forEach(row => existingEmails.add(row.email.toLowerCase()));

      // Process data rows
      const dataRows = lines.slice(1);
      totalRows = dataRows.length;

      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 2; // +2 because we start from row 2 (after header)
        const rowData = parseCSVRow(dataRows[i]);
        let teacher: Partial<TeacherCSVRow> = {};
        
        try {
          if (rowData.length === 0 || rowData.every(cell => !cell.trim())) {
            // Skip empty rows
            continue;
          }

          // Map CSV data to teacher object
          headers.forEach((header, index) => {
            if (index < rowData.length && rowData[index].trim()) {
              const value = rowData[index].trim();
              switch (header) {
                case 'name':
                  teacher.name = value;
                  break;
                case 'email':
                  teacher.email = value.toLowerCase();
                  break;
                case 'password':
                  teacher.password = value;
                  break;
                case 'school name':
                case 'schoolname':
                  teacher.schoolName = value;
                  break;
                case 'school district':
                case 'schooldistrict':
                  teacher.schoolDistrict = value;
                  break;
                case 'primary grade':
                case 'primarygrade':
                case 'grade':
                  teacher.primaryGrade = value;
                  break;
                case 'primary subject':
                case 'primarysubject':
                case 'subject':
                  teacher.primarySubject = value;
                  break;
                case 'teacher type':
                case 'teachertype':
                case 'type':
                  teacher.teacherType = value;
                  break;
                case 'subscription end date':
                case 'subscriptionenddate':
                case 'subscription end':
                  teacher.subscriptionEndDate = value;
                  break;
                case 'support requests limit':
                case 'supportrequestslimit':
                case 'limit':
                  teacher.supportRequestsLimit = value;
                  break;
              }
            }
          });

          // Validate required fields
          if (!teacher.name || !teacher.email) {
            errors.push({
              row: rowNumber,
              email: teacher.email,
              name: teacher.name,
              error: "Name and email are required"
            });
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(teacher.email)) {
            errors.push({
              row: rowNumber,
              email: teacher.email,
              name: teacher.name,
              error: "Invalid email format"
            });
            continue;
          }

          // Check for duplicate email
          if (existingEmails.has(teacher.email)) {
            duplicateEmails.push(teacher.email);
            errors.push({
              row: rowNumber,
              email: teacher.email,
              name: teacher.name,
              error: "Email already exists in system"
            });
            continue;
          }

          // Add to existing emails set to prevent duplicates within the CSV
          existingEmails.add(teacher.email);

          // Set defaults
          const password = teacher.password || generateRandomPassword();
          const teacherType = teacher.teacherType || 'classroom';
          const supportRequestsLimit = teacher.supportRequestsLimit ? parseInt(teacher.supportRequestsLimit) : 20;
          
          // Parse subscription end date
          let subscriptionEndDate: Date;
          if (teacher.subscriptionEndDate) {
            subscriptionEndDate = new Date(teacher.subscriptionEndDate);
            if (isNaN(subscriptionEndDate.getTime())) {
              errors.push({
                row: rowNumber,
                email: teacher.email,
                name: teacher.name,
                error: "Invalid subscription end date format. Use YYYY-MM-DD"
              });
              continue;
            }
          } else {
            // Default to 1 year from now
            subscriptionEndDate = new Date();
            subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
          }

          // Validate support requests limit
          if (isNaN(supportRequestsLimit) || supportRequestsLimit < 1 || supportRequestsLimit > 100) {
            errors.push({
              row: rowNumber,
              email: teacher.email,
              name: teacher.name,
              error: "Support requests limit must be a number between 1 and 100"
            });
            continue;
          }

          // Hash password
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(password, saltRounds);

          // Insert teacher into database
          await userDB.exec`
            INSERT INTO users (
              email, name, password_hash, school_name, school_district, 
              primary_grade, primary_subject, teacher_type, referrals_limit,
              subscription_start_date, subscription_end_date, deepseek_api_key,
              created_at, updated_at
            ) VALUES (
              ${teacher.email}, ${teacher.name}, ${passwordHash}, 
              ${teacher.schoolName || null}, ${teacher.schoolDistrict || null},
              ${teacher.primaryGrade || null}, ${teacher.primarySubject || null}, 
              ${teacherType}, ${supportRequestsLimit},
              NOW(), ${subscriptionEndDate}, ${adminDeepSeekApiKey()},
              NOW(), NOW()
            )
          `;

          successfulImports++;

        } catch (error) {
          log.error(`Error processing row ${rowNumber}:`, { error });
          errors.push({
            row: rowNumber,
            email: teacher.email,
            name: teacher.name,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }

      const summary = `Processed ${totalRows} rows. Successfully imported ${successfulImports} teachers. ${errors.length} errors encountered.`;

      return {
        success: errors.length === 0,
        totalRows,
        successfulImports,
        errors,
        duplicateEmails,
        summary
      };

    } catch (error) {
      log.error('Error processing CSV:', { error });
      throw APIError.internal(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
