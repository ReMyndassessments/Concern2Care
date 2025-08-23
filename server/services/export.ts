import { db } from "../db";
import { users, concerns, interventions, followUpQuestions, progressNotes, schools } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { User, Concern, Intervention, FollowUpQuestion, ProgressNote } from "@shared/schema";

export interface TeacherExportData {
  teacher: User;
  concerns: Array<Concern & {
    interventions: Intervention[];
    followUpQuestions: FollowUpQuestion[];
    progressNotes: ProgressNote[];
  }>;
  summary: {
    totalConcerns: number;
    totalInterventions: number;
    totalFollowUpQuestions: number;
    totalProgressNotes: number;
    supportRequestsUsed: number;
    supportRequestsLimit: number;
  };
}

export interface SchoolExportData {
  school: string;
  teachers: TeacherExportData[];
  summary: {
    totalTeachers: number;
    totalConcerns: number;
    totalInterventions: number;
    totalFollowUpQuestions: number;
    totalProgressNotes: number;
  };
}

export async function getTeacherExportData(teacherId: string): Promise<TeacherExportData | null> {
  try {
    // Get teacher information
    const teacher = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
    });

    if (!teacher) {
      return null;
    }

    // Get all concerns for this teacher
    const teacherConcerns = await db.query.concerns.findMany({
      where: eq(concerns.teacherId, teacherId),
      orderBy: (concerns, { desc }) => [desc(concerns.createdAt)],
    });

    const concernIds = teacherConcerns.map(concern => concern.id);

    // Get all interventions for these concerns
    const allInterventions = concernIds.length > 0 
      ? await db.query.interventions.findMany({
          where: inArray(interventions.concernId, concernIds),
          orderBy: (interventions, { desc }) => [desc(interventions.createdAt)],
        })
      : [];

    // Get all follow-up questions for these concerns
    const allFollowUpQuestions = concernIds.length > 0
      ? await db.query.followUpQuestions.findMany({
          where: inArray(followUpQuestions.concernId, concernIds),
          orderBy: (followUpQuestions, { desc }) => [desc(followUpQuestions.createdAt)],
        })
      : [];

    // Get all progress notes for the interventions
    const interventionIds = allInterventions.map(intervention => intervention.id);
    const allProgressNotes = interventionIds.length > 0
      ? await db.query.progressNotes.findMany({
          where: inArray(progressNotes.interventionId, interventionIds),
          orderBy: (progressNotes, { desc }) => [desc(progressNotes.createdAt)],
        })
      : [];

    // Group data by concern
    const concernsWithDetails = teacherConcerns.map(concern => ({
      ...concern,
      interventions: allInterventions.filter(intervention => intervention.concernId === concern.id),
      followUpQuestions: allFollowUpQuestions.filter(question => question.concernId === concern.id),
      progressNotes: allProgressNotes.filter(note => 
        allInterventions.some(intervention => 
          intervention.concernId === concern.id && intervention.id === note.interventionId
        )
      ),
    }));

    return {
      teacher,
      concerns: concernsWithDetails,
      summary: {
        totalConcerns: teacherConcerns.length,
        totalInterventions: allInterventions.length,
        totalFollowUpQuestions: allFollowUpQuestions.length,
        totalProgressNotes: allProgressNotes.length,
        supportRequestsUsed: teacher.supportRequestsUsed || 0,
        supportRequestsLimit: teacher.supportRequestsLimit || 0,
      },
    };
  } catch (error) {
    console.error('Error getting teacher export data:', error);
    throw error;
  }
}

export async function getSchoolExportData(schoolName: string): Promise<SchoolExportData | null> {
  try {
    // Get all teachers from the specified school
    const schoolTeachers = await db.query.users.findMany({
      where: eq(users.school, schoolName),
      orderBy: (users, { asc }) => [asc(users.lastName), asc(users.firstName)],
    });

    if (schoolTeachers.length === 0) {
      return null;
    }

    // Get export data for each teacher
    const teachersData: TeacherExportData[] = [];
    for (const teacher of schoolTeachers) {
      const teacherData = await getTeacherExportData(teacher.id);
      if (teacherData) {
        teachersData.push(teacherData);
      }
    }

    // Calculate summary statistics
    const summary = {
      totalTeachers: teachersData.length,
      totalConcerns: teachersData.reduce((sum, teacher) => sum + teacher.summary.totalConcerns, 0),
      totalInterventions: teachersData.reduce((sum, teacher) => sum + teacher.summary.totalInterventions, 0),
      totalFollowUpQuestions: teachersData.reduce((sum, teacher) => sum + teacher.summary.totalFollowUpQuestions, 0),
      totalProgressNotes: teachersData.reduce((sum, teacher) => sum + teacher.summary.totalProgressNotes, 0),
    };

    return {
      school: schoolName,
      teachers: teachersData,
      summary,
    };
  } catch (error) {
    console.error('Error getting school export data:', error);
    throw error;
  }
}

export function convertToCSV(data: TeacherExportData | SchoolExportData): string {
  const csvRows: string[] = [];

  if ('teacher' in data) {
    // Single teacher export
    const teacher = data.teacher;
    
    // Header
    csvRows.push('Export Type,Teacher Data');
    csvRows.push('');
    
    // Teacher Information
    csvRows.push('Teacher Information');
    csvRows.push('Field,Value');
    csvRows.push(`Name,"${teacher.firstName} ${teacher.lastName}"`);
    csvRows.push(`Email,${teacher.email}`);
    csvRows.push(`School,"${teacher.school || 'Not specified'}"`);
    csvRows.push(`Support Requests Used,${teacher.supportRequestsUsed || 0}`);
    csvRows.push(`Support Requests Limit,${teacher.supportRequestsLimit || 0}`);
    csvRows.push(`Active,${teacher.isActive ? 'Yes' : 'No'}`);
    csvRows.push(`Created,${teacher.createdAt?.toLocaleDateString() || 'Unknown'}`);
    csvRows.push('');

    // Summary
    csvRows.push('Summary Statistics');
    csvRows.push('Metric,Count');
    csvRows.push(`Total Concerns,${data.summary.totalConcerns}`);
    csvRows.push(`Total Interventions,${data.summary.totalInterventions}`);
    csvRows.push(`Total Follow-up Questions,${data.summary.totalFollowUpQuestions}`);
    csvRows.push(`Total Progress Notes,${data.summary.totalProgressNotes}`);
    csvRows.push('');

    // Concerns Details
    if (data.concerns.length > 0) {
      csvRows.push('Concerns Details');
      csvRows.push('Student Name,Grade,Concern Types,Severity,Date Created,Interventions Count,Follow-up Questions Count,Progress Notes Count');
      
      data.concerns.forEach(concern => {
        const concernTypes = Array.isArray(concern.concernTypes) 
          ? (concern.concernTypes as string[]).join('; ') 
          : 'Not specified';
        
        csvRows.push([
          `"${concern.studentFirstName} ${concern.studentLastInitial}."`,
          concern.grade,
          `"${concernTypes}"`,
          concern.severityLevel,
          concern.createdAt?.toLocaleDateString() || 'Unknown',
          concern.interventions.length.toString(),
          concern.followUpQuestions.length.toString(),
          concern.progressNotes.length.toString()
        ].join(','));
      });
    }
  } else {
    // School export
    csvRows.push('Export Type,School Data');
    csvRows.push(`School Name,"${data.school}"`);
    csvRows.push('');
    
    // School Summary
    csvRows.push('School Summary');
    csvRows.push('Metric,Count');
    csvRows.push(`Total Teachers,${data.summary.totalTeachers}`);
    csvRows.push(`Total Concerns,${data.summary.totalConcerns}`);
    csvRows.push(`Total Interventions,${data.summary.totalInterventions}`);
    csvRows.push(`Total Follow-up Questions,${data.summary.totalFollowUpQuestions}`);
    csvRows.push(`Total Progress Notes,${data.summary.totalProgressNotes}`);
    csvRows.push('');

    // Teachers Summary
    csvRows.push('Teachers Summary');
    csvRows.push('Teacher Name,Email,Concerns Count,Interventions Count,Support Requests Used,Support Requests Limit,Active');
    
    data.teachers.forEach(teacherData => {
      const teacher = teacherData.teacher;
      csvRows.push([
        `"${teacher.firstName} ${teacher.lastName}"`,
        teacher.email,
        teacherData.summary.totalConcerns.toString(),
        teacherData.summary.totalInterventions.toString(),
        (teacher.supportRequestsUsed || 0).toString(),
        (teacher.supportRequestsLimit || 0).toString(),
        teacher.isActive ? 'Yes' : 'No'
      ].join(','));
    });
  }

  return csvRows.join('\n');
}

export async function getAllSchoolNames(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ school: users.school })
      .from(users)
      .where(and(
        eq(users.role, 'teacher'),
        eq(users.isActive, true)
      ))
      .orderBy(users.school);

    return result
      .map(row => row.school)
      .filter(school => school && school.trim() !== '') as string[];
  } catch (error) {
    console.error('Error getting school names:', error);
    throw error;
  }
}