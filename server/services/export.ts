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
    // Single teacher export - detailed version
    const teacher = data.teacher;
    
    // Header
    csvRows.push('Export Type,Teacher Data - Complete Details');
    csvRows.push(`Teacher Name,"${teacher.firstName} ${teacher.lastName}"`);
    csvRows.push(`Email,${teacher.email}`);
    csvRows.push(`School,"${teacher.school || 'Not specified'}"`);
    csvRows.push(`Export Date,${new Date().toLocaleDateString()}`);
    csvRows.push('');

    // All Concerns with Full Details
    if (data.concerns.length > 0) {
      csvRows.push('STUDENT CONCERNS - COMPLETE DETAILS');
      csvRows.push('Concern ID,Student Name,Grade,Teacher Position,Incident Date,Location,Concern Types,Severity,Description,Actions Taken,Date Created');
      
      data.concerns.forEach(concern => {
        const concernTypes = Array.isArray(concern.concernTypes) 
          ? (concern.concernTypes as string[]).join('; ') 
          : 'Not specified';
        const actionsTaken = Array.isArray(concern.actionsTaken)
          ? (concern.actionsTaken as string[]).join('; ')
          : 'None specified';
        
        csvRows.push([
          concern.id,
          `"${concern.studentFirstName} ${concern.studentLastInitial}."`,
          concern.grade,
          concern.teacherPosition,
          concern.incidentDate?.toLocaleDateString() || 'Unknown',
          concern.location,
          `"${concernTypes}"`,
          concern.severityLevel,
          `"${concern.description.replace(/"/g, '""')}"`, // Escape quotes in description
          `"${actionsTaken}"`,
          concern.createdAt?.toLocaleDateString() || 'Unknown'
        ].join(','));
      });
      csvRows.push('');

      // All Interventions Details
      csvRows.push('AI-GENERATED INTERVENTIONS - COMPLETE DETAILS');
      csvRows.push('Intervention ID,Concern ID,Student Name,Intervention Title,Description,Steps,Timeline,Saved,Date Created');
      
      data.concerns.forEach(concern => {
        concern.interventions.forEach(intervention => {
          const steps = Array.isArray(intervention.steps)
            ? (intervention.steps as string[]).join(' | ')
            : JSON.stringify(intervention.steps);
          
          csvRows.push([
            intervention.id,
            concern.id,
            `"${concern.studentFirstName} ${concern.studentLastInitial}."`,
            `"${intervention.title.replace(/"/g, '""')}"`,
            `"${intervention.description.replace(/"/g, '""')}"`,
            `"${steps.replace(/"/g, '""')}"`,
            intervention.timeline || 'Not specified',
            intervention.saved ? 'Yes' : 'No',
            intervention.createdAt?.toLocaleDateString() || 'Unknown'
          ].join(','));
        });
      });
      csvRows.push('');

      // Follow-up Questions Details
      const allFollowUps = data.concerns.flatMap(concern => 
        concern.followUpQuestions.map(q => ({ ...q, concernId: concern.id, studentName: `${concern.studentFirstName} ${concern.studentLastInitial}.` }))
      );
      
      if (allFollowUps.length > 0) {
        csvRows.push('FOLLOW-UP QUESTIONS - COMPLETE DETAILS');
        csvRows.push('Question ID,Concern ID,Student Name,Question,AI Response,Date Asked');
        
        allFollowUps.forEach(followUp => {
          csvRows.push([
            followUp.id,
            followUp.concernId,
            `"${followUp.studentName}"`,
            `"${followUp.question.replace(/"/g, '""')}"`,
            `"${followUp.response.replace(/"/g, '""')}"`,
            followUp.createdAt?.toLocaleDateString() || 'Unknown'
          ].join(','));
        });
        csvRows.push('');
      }

      // Progress Notes Details
      const allProgressNotes = data.concerns.flatMap(concern => 
        concern.progressNotes.map(note => ({ 
          ...note, 
          concernId: concern.id, 
          studentName: `${concern.studentFirstName} ${concern.studentLastInitial}.`
        }))
      );
      
      if (allProgressNotes.length > 0) {
        csvRows.push('PROGRESS NOTES - COMPLETE DETAILS');
        csvRows.push('Note ID,Concern ID,Student Name,Progress Note,Outcome,Next Steps,Date Added');
        
        allProgressNotes.forEach(note => {
          csvRows.push([
            note.id,
            note.concernId,
            `"${note.studentName}"`,
            `"${note.note.replace(/"/g, '""')}"`,
            note.outcome || 'Not specified',
            `"${(note.nextSteps || 'None specified').replace(/"/g, '""')}"`,
            note.createdAt?.toLocaleDateString() || 'Unknown'
          ].join(','));
        });
      }
    } else {
      csvRows.push('No concerns found for this teacher.');
    }
  } else {
    // School export - comprehensive details
    csvRows.push('Export Type,School Data - Complete Details');
    csvRows.push(`School Name,"${data.school}"`);
    csvRows.push(`Export Date,${new Date().toLocaleDateString()}`);
    csvRows.push(`Total Teachers,${data.summary.totalTeachers}`);
    csvRows.push(`Total Concerns,${data.summary.totalConcerns}`);
    csvRows.push('');

    // All Teachers Details
    csvRows.push('TEACHERS - COMPLETE LIST');
    csvRows.push('Teacher Name,Email,Support Requests Used,Support Requests Limit,Active,Created Date,Last Login');
    
    data.teachers.forEach(teacherData => {
      const teacher = teacherData.teacher;
      csvRows.push([
        `"${teacher.firstName} ${teacher.lastName}"`,
        teacher.email,
        (teacher.supportRequestsUsed || 0).toString(),
        (teacher.supportRequestsLimit || 0).toString(),
        teacher.isActive ? 'Yes' : 'No',
        teacher.createdAt?.toLocaleDateString() || 'Unknown',
        teacher.lastLoginAt?.toLocaleDateString() || 'Never'
      ].join(','));
    });
    csvRows.push('');

    // All Student Concerns Across School
    const allConcerns = data.teachers.flatMap(teacherData => 
      teacherData.concerns.map(concern => ({
        ...concern,
        teacherName: `${teacherData.teacher.firstName} ${teacherData.teacher.lastName}`
      }))
    );

    if (allConcerns.length > 0) {
      csvRows.push('ALL STUDENT CONCERNS - COMPLETE DETAILS');
      csvRows.push('Concern ID,Teacher Name,Student Name,Grade,Teacher Position,Incident Date,Location,Concern Types,Severity,Description,Actions Taken,Date Created');
      
      allConcerns.forEach(concern => {
        const concernTypes = Array.isArray(concern.concernTypes) 
          ? (concern.concernTypes as string[]).join('; ') 
          : 'Not specified';
        const actionsTaken = Array.isArray(concern.actionsTaken)
          ? (concern.actionsTaken as string[]).join('; ')
          : 'None specified';
        
        csvRows.push([
          concern.id,
          `"${concern.teacherName}"`,
          `"${concern.studentFirstName} ${concern.studentLastInitial}."`,
          concern.grade,
          concern.teacherPosition,
          concern.incidentDate?.toLocaleDateString() || 'Unknown',
          concern.location,
          `"${concernTypes}"`,
          concern.severityLevel,
          `"${concern.description.replace(/"/g, '""')}"`,
          `"${actionsTaken}"`,
          concern.createdAt?.toLocaleDateString() || 'Unknown'
        ].join(','));
      });
      csvRows.push('');

      // All Interventions Across School
      const allInterventions = allConcerns.flatMap(concern => 
        concern.interventions.map(intervention => ({
          ...intervention,
          concernId: concern.id,
          teacherName: concern.teacherName,
          studentName: `${concern.studentFirstName} ${concern.studentLastInitial}.`
        }))
      );

      csvRows.push('ALL AI INTERVENTIONS - COMPLETE DETAILS');
      csvRows.push('Intervention ID,Concern ID,Teacher Name,Student Name,Title,Description,Steps,Timeline,Saved,Date Created');
      
      allInterventions.forEach(intervention => {
        const steps = Array.isArray(intervention.steps)
          ? (intervention.steps as string[]).join(' | ')
          : JSON.stringify(intervention.steps);
        
        csvRows.push([
          intervention.id,
          intervention.concernId,
          `"${intervention.teacherName}"`,
          `"${intervention.studentName}"`,
          `"${intervention.title.replace(/"/g, '""')}"`,
          `"${intervention.description.replace(/"/g, '""')}"`,
          `"${steps.replace(/"/g, '""')}"`,
          intervention.timeline || 'Not specified',
          intervention.saved ? 'Yes' : 'No',
          intervention.createdAt?.toLocaleDateString() || 'Unknown'
        ].join(','));
      });
      csvRows.push('');

      // All Follow-up Questions Across School
      const allFollowUps = allConcerns.flatMap(concern => 
        concern.followUpQuestions.map(q => ({ 
          ...q, 
          concernId: concern.id, 
          teacherName: concern.teacherName,
          studentName: `${concern.studentFirstName} ${concern.studentLastInitial}.` 
        }))
      );
      
      if (allFollowUps.length > 0) {
        csvRows.push('ALL FOLLOW-UP QUESTIONS - COMPLETE DETAILS');
        csvRows.push('Question ID,Concern ID,Teacher Name,Student Name,Question,AI Response,Date Asked');
        
        allFollowUps.forEach(followUp => {
          csvRows.push([
            followUp.id,
            followUp.concernId,
            `"${followUp.teacherName}"`,
            `"${followUp.studentName}"`,
            `"${followUp.question.replace(/"/g, '""')}"`,
            `"${followUp.response.replace(/"/g, '""')}"`,
            followUp.createdAt?.toLocaleDateString() || 'Unknown'
          ].join(','));
        });
        csvRows.push('');
      }

      // All Progress Notes Across School
      const allProgressNotes = allConcerns.flatMap(concern => 
        concern.progressNotes.map(note => ({ 
          ...note, 
          concernId: concern.id, 
          teacherName: concern.teacherName,
          studentName: `${concern.studentFirstName} ${concern.studentLastInitial}.`
        }))
      );
      
      if (allProgressNotes.length > 0) {
        csvRows.push('ALL PROGRESS NOTES - COMPLETE DETAILS');
        csvRows.push('Note ID,Concern ID,Teacher Name,Student Name,Progress Note,Outcome,Next Steps,Date Added');
        
        allProgressNotes.forEach(note => {
          csvRows.push([
            note.id,
            note.concernId,
            `"${note.teacherName}"`,
            `"${note.studentName}"`,
            `"${note.note.replace(/"/g, '""')}"`,
            note.outcome || 'Not specified',
            `"${(note.nextSteps || 'None specified').replace(/"/g, '""')}"`,
            note.createdAt?.toLocaleDateString() || 'Unknown'
          ].join(','));
        });
      }
    } else {
      csvRows.push('No concerns found for this school.');
    }
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