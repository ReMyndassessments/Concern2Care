import { db } from "../db";
import { users, schools, adminLogs, concerns, interventions, apiKeys, insertApiKeySchema } from "@shared/schema";
import { eq, count, sql, and } from "drizzle-orm";
import * as bcrypt from "bcrypt";

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
  createdCredentials: Array<{
    name: string;
    email: string;
    password: string;
    school: string;
  }>;
}

interface TeacherCSVRow {
  name: string;
  email: string;
  password?: string;
  school?: string;
  schoolName?: string;
  schoolDistrict?: string;
  primaryGrade?: string;
  primarySubject?: string;
  teacherType?: string;
  subscriptionEndDate?: string;
  supportRequestsLimit?: string;
}

export async function processBulkCSVUpload(csvContent: string): Promise<BulkCSVUploadResult> {
  const errors: Array<{ row: number; email?: string; name?: string; error: string }> = [];
  const duplicateEmails: string[] = [];
  const createdCredentials: Array<{ name: string; email: string; password: string; school: string }> = [];
  let successfulImports = 0;
  let totalRows = 0;

  try {
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one data row");
    }

    // Parse header row
    const headerRow = lines[0];
    const headers = parseCSVRow(headerRow).map(h => h.toLowerCase().trim());
    
    // Validate required headers
    const requiredHeaders = ['name', 'email'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Get existing emails to check for duplicates
    const existingEmails = new Set<string>();
    const existingEmailsResult = await db.select({ email: users.email }).from(users);
    existingEmailsResult.forEach(row => existingEmails.add(row.email!.toLowerCase()));

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
              case 'school':
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
        const supportRequestsLimit = teacher.supportRequestsLimit ? parseInt(teacher.supportRequestsLimit) : 20;

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

        // Split name into first and last name
        const nameParts = teacher.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Insert teacher into database
        await db.insert(users).values({
          email: teacher.email,
          password: passwordHash, // Add the hashed password
          firstName: firstName,
          lastName: lastName,
          school: teacher.schoolName || null,
          supportRequestsLimit: supportRequestsLimit,
          isAdmin: false,
          role: 'teacher',
          isActive: true,
        });

        // Store the credential for PDF generation
        createdCredentials.push({
          name: teacher.name,
          email: teacher.email,
          password: password, // Store the plain password for the PDF
          school: teacher.schoolName || 'Not specified'
        });

        successfulImports++;

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
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
      summary,
      createdCredentials
    };

  } catch (error) {
    console.error('Error processing CSV:', error);
    throw new Error(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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

export async function generateDemoData() {
  try {
    // Create demo teachers
    const demoTeachers = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@demo.edu',
        school: 'Demo Elementary School',
        supportRequestsLimit: 25,
        isAdmin: false,
        role: 'teacher' as const,
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@demo.edu',
        school: 'Demo Middle School',
        supportRequestsLimit: 30,
        isAdmin: false,
        role: 'teacher' as const,
      },
      {
        firstName: 'Lisa',
        lastName: 'Rodriguez',
        email: 'lisa.rodriguez@demo.edu',
        school: 'Demo High School',
        supportRequestsLimit: 20,
        isAdmin: false,
        role: 'teacher' as const,
      }
    ];

    // Insert demo teachers
    for (const teacher of demoTeachers) {
      try {
        await db.insert(users).values(teacher).onConflictDoNothing();
      } catch (error) {
        console.log(`Teacher ${teacher.email} already exists, skipping`);
      }
    }

    // Create demo schools
    const demoSchools = [
      {
        name: 'Demo Elementary School',
        district: 'Demo School District',
        address: '123 Education St, Demo City, DC 12345',
        contactEmail: 'admin@elementary.demo.edu',
        maxTeachers: 50,
        defaultRequestsPerTeacher: 25,
      },
      {
        name: 'Demo Middle School', 
        district: 'Demo School District',
        address: '456 Learning Ave, Demo City, DC 12345',
        contactEmail: 'admin@middle.demo.edu',
        maxTeachers: 40,
        defaultRequestsPerTeacher: 30,
      }
    ];

    // Insert demo schools
    for (const school of demoSchools) {
      try {
        await db.insert(schools).values(school).onConflictDoNothing();
      } catch (error) {
        console.log(`School ${school.name} already exists, skipping`);
      }
    }

    return {
      success: true,
      message: 'Demo data generated successfully',
      created: {
        teachers: demoTeachers.length,
        schools: demoSchools.length,
      }
    };
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
}

export async function getTeachersWithDetails() {
  try {
    const teachersData = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        school: users.school,
        supportRequestsUsed: users.supportRequestsUsed,
        supportRequestsLimit: users.supportRequestsLimit,
        additionalRequests: users.additionalRequests,
        isAdmin: users.isAdmin,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.isAdmin, false), // Non-admin users are teachers
          eq(users.isActive, true)  // Only active users
        )
      );

    return teachersData.map(teacher => ({
      ...teacher,
      name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
      totalLimit: (teacher.supportRequestsLimit || 20) + (teacher.additionalRequests || 0),
    }));
  } catch (error) {
    console.error('Error fetching teachers with details:', error);
    throw error;
  }
}

export async function bulkUpdateTeachers(teacherIds: string[], updates: any) {
  try {
    const results = [];
    
    for (const teacherId of teacherIds) {
      const updateData: any = {};
      
      if (updates.supportRequestsLimit !== undefined) {
        updateData.supportRequestsLimit = updates.supportRequestsLimit;
      }
      
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
      }
      
      if (updates.school !== undefined) {
        updateData.school = updates.school;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(users)
          .set(updateData)
          .where(eq(users.id, teacherId));
      }
      
      results.push({ id: teacherId, updated: true });
    }

    return {
      success: true,
      updated: results.length,
      results
    };
  } catch (error) {
    console.error('Error bulk updating teachers:', error);
    throw error;
  }
}

export async function bulkDeleteTeachers(teacherIds: string[]) {
  try {
    // First delete related data
    for (const teacherId of teacherIds) {
      // Delete concerns and related data for each teacher
      const teacherConcerns = await db
        .select({ id: concerns.id })
        .from(concerns)
        .where(eq(concerns.teacherId, teacherId));
      
      for (const concern of teacherConcerns) {
        // Delete interventions
        await db.delete(interventions).where(eq(interventions.concernId, concern.id));
      }
      
      // Delete concerns
      await db.delete(concerns).where(eq(concerns.teacherId, teacherId));
    }
    
    // Then delete the teachers
    let deletedCount = 0;
    for (const teacherId of teacherIds) {
      await db.delete(users).where(eq(users.id, teacherId));
      deletedCount++;
    }

    return {
      success: true,
      deleted: deletedCount,
      message: `Successfully deleted ${deletedCount} teachers and their associated data`
    };
  } catch (error) {
    console.error('Error bulk deleting teachers:', error);
    throw error;
  }
}

// API Key Management Functions
export async function getApiKeys() {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        provider: apiKeys.provider,
        isActive: apiKeys.isActive,
        description: apiKeys.description,
        usageCount: apiKeys.usageCount,
        maxUsage: apiKeys.maxUsage,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        createdByUser: users.firstName
      })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.createdBy, users.id))
      .orderBy(apiKeys.createdAt);

    return keys.map(key => ({
      ...key,
      maskedKey: '••••••••••••••••••••••••••••••••',
      usagePercentage: key.maxUsage ? Math.round((key.usageCount || 0) / key.maxUsage * 100) : 0
    }));
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
}

// Internal function to get actual API key for service usage (not for admin display)
export async function getActiveApiKey(provider: string = 'deepseek') {
  try {
    const key = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        provider: apiKeys.provider,
        apiKey: apiKeys.apiKey, // Get the actual API key
        isActive: apiKeys.isActive,
      })
      .from(apiKeys)
      .where(eq(apiKeys.provider, provider))
      .where(eq(apiKeys.isActive, true))
      .orderBy(apiKeys.createdAt)
      .limit(1);

    return key[0] || null;
  } catch (error) {
    console.error('Error fetching active API key:', error);
    return null;
  }
}

export async function createApiKey(apiKeyData: any, createdBy: string) {
  try {
    const newApiKey = await db
      .insert(apiKeys)
      .values({
        name: apiKeyData.name,
        provider: apiKeyData.provider || 'deepseek',
        apiKey: apiKeyData.apiKey, // In production, this should be encrypted
        description: apiKeyData.description,
        maxUsage: apiKeyData.maxUsage || 10000,
        isActive: apiKeyData.isActive !== false,
        createdBy
      })
      .returning();

    return {
      success: true,
      message: 'API key created successfully',
      apiKey: newApiKey[0]
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

export async function updateApiKey(keyId: string, updates: any) {
  try {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.maxUsage !== undefined) updateData.maxUsage = parseInt(updates.maxUsage);
    if (updates.apiKey !== undefined) updateData.apiKey = updates.apiKey; // Should be encrypted
    
    updateData.updatedAt = new Date();

    const result = await db
      .update(apiKeys)
      .set(updateData)
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (!result.length) {
      throw new Error('API key not found');
    }

    return {
      success: true,
      message: 'API key updated successfully',
      apiKey: result[0]
    };
  } catch (error) {
    console.error('Error updating API key:', error);
    throw error;
  }
}

export async function deleteApiKey(keyId: string) {
  try {
    const result = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (!result.length) {
      throw new Error('API key not found');
    }

    return {
      success: true,
      message: 'API key deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
}