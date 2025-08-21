import { api, APIError } from "encore.dev/api";
import { userDB } from "../users/db";
import { referralDB } from "../referrals/db";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";

const adminDeepSeekApiKey = secret("AdminDeepSeekAPIKey");

export interface CreateDemoDataRequest {
  teacherCount: number;
  supportRequestCount: number;
  schoolName?: string;
  schoolDistrict?: string;
}

export interface CreateDemoDataResponse {
  success: boolean;
  teachersCreated: number;
  supportRequestsCreated: number;
  message: string;
}

export interface ClearDemoDataResponse {
  success: boolean;
  teachersDeleted: number;
  supportRequestsDeleted: number;
  message: string;
}

// Creates demo data for testing and demonstrations.
export const createDemoData = api<CreateDemoDataRequest, CreateDemoDataResponse>(
  { expose: true, method: "POST", path: "/admin/demo/create", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    if (req.teacherCount < 1 || req.teacherCount > 50) {
      throw APIError.invalidArgument("Teacher count must be between 1 and 50");
    }

    if (req.supportRequestCount < 1 || req.supportRequestCount > 100) {
      throw APIError.invalidArgument("Support request count must be between 1 and 100");
    }

    const schoolName = req.schoolName || "Demo Elementary School";
    const schoolDistrict = req.schoolDistrict || "Demo School District";

    let teachersCreated = 0;
    let supportRequestsCreated = 0;

    // Create demo teachers
    const teacherNames = [
      "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Thompson", "Lisa Anderson",
      "James Wilson", "Maria Garcia", "Robert Brown", "Jennifer Davis", "Christopher Lee",
      "Amanda Miller", "Daniel Martinez", "Jessica Taylor", "Matthew Jackson", "Ashley White",
      "Andrew Harris", "Stephanie Clark", "Kevin Lewis", "Nicole Walker", "Ryan Hall",
      "Megan Young", "Brandon King", "Samantha Wright", "Tyler Lopez", "Rachel Green"
    ];

    const grades = ["Kindergarten", "1st", "2nd", "3rd", "4th", "5th"];
    const subjects = ["General Education", "Mathematics", "English/Language Arts", "Science", "Art", "Music"];
    const teacherTypes = ["classroom", "specialist", "support"];

    for (let i = 0; i < req.teacherCount; i++) {
      try {
        const name = teacherNames[i % teacherNames.length];
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}@${schoolName.toLowerCase().replace(/\s+/g, '')}.demo`;
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const teacherType = teacherTypes[Math.floor(Math.random() * teacherTypes.length)];

        const subscriptionEndDate = new Date();
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

        await userDB.exec`
          INSERT INTO users (
            email, name, school_name, school_district, primary_grade, primary_subject,
            teacher_type, referrals_limit, subscription_start_date, subscription_end_date,
            deepseek_api_key, created_at, updated_at
          ) VALUES (
            ${email}, ${name}, ${schoolName}, ${schoolDistrict}, ${grade}, ${subject},
            ${teacherType}, 20, NOW(), ${subscriptionEndDate}, ${adminDeepSeekApiKey()}, NOW(), NOW()
          )
        `;
        teachersCreated++;
      } catch (error) {
        log.error(`Failed to create demo teacher ${i + 1}:`, { error });
      }
    }

    // Create demo support requests
    const studentFirstNames = [
      "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Sage", "River",
      "Emery", "Rowan", "Phoenix", "Skylar", "Cameron", "Dakota", "Finley", "Hayden", "Kendall", "Peyton"
    ];

    const lastInitials = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
    const locations = ["Classroom", "Cafeteria", "Playground", "Library", "Hallway", "Gymnasium"];
    const concernTypes = [
      ["Academic"], ["Behavior"], ["Social/Emotional"], ["Attendance"], 
      ["Academic", "Behavior"], ["Social/Emotional", "Peer Relationships"]
    ];
    const severityLevels = ["mild", "moderate", "urgent"];
    const actionsTaken = [
      ["Talked with student"], ["Contacted parent"], ["Documented only"],
      ["Talked with student", "Contacted parent"]
    ];

    // Get created teachers for support requests
    const teachers = await userDB.queryAll<{ name: string; teacher_position: string }>`
      SELECT name, 
             CASE 
               WHEN teacher_type = 'classroom' THEN CONCAT(primary_grade, ' Grade Teacher')
               WHEN teacher_type = 'specialist' THEN CONCAT(primary_subject, ' Specialist')
               ELSE 'Support Staff'
             END as teacher_position
      FROM users 
      WHERE school_name = ${schoolName}
      ORDER BY created_at DESC
      LIMIT ${req.teacherCount}
    `;

    for (let i = 0; i < req.supportRequestCount; i++) {
      try {
        const studentFirstName = studentFirstNames[Math.floor(Math.random() * studentFirstNames.length)];
        const studentLastInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const teacher = teachers.length > 0 ? teachers[Math.floor(Math.random() * teachers.length)] : { name: "Demo Teacher", teacher_position: "Teacher" };
        
        const incidentDate = new Date();
        incidentDate.setDate(incidentDate.getDate() - Math.floor(Math.random() * 30));
        
        const location = locations[Math.floor(Math.random() * locations.length)];
        const concernType = concernTypes[Math.floor(Math.random() * concernTypes.length)];
        const severityLevel = severityLevels[Math.floor(Math.random() * severityLevels.length)];
        const actionTaken = actionsTaken[Math.floor(Math.random() * actionsTaken.length)];

        const concernDescriptions = [
          "Student is having difficulty focusing during lessons and frequently disrupts other students.",
          "Student appears withdrawn and reluctant to participate in group activities.",
          "Student is struggling with reading comprehension and falling behind grade level expectations.",
          "Student has been absent frequently and when present, seems disengaged from learning.",
          "Student shows signs of anxiety during testing situations and math activities.",
          "Student has difficulty following multi-step directions and completing assignments."
        ];

        const concernDescription = concernDescriptions[Math.floor(Math.random() * concernDescriptions.length)];

        await referralDB.exec`
          INSERT INTO referrals (
            student_first_name, student_last_initial, grade, teacher, teacher_position,
            incident_date, location, concern_types, concern_description, severity_level,
            actions_taken, created_by_email, created_at
          ) VALUES (
            ${studentFirstName}, ${studentLastInitial}, ${grade}, ${teacher.name}, ${teacher.teacher_position},
            ${incidentDate.toISOString().split('T')[0]}, ${location}, ${JSON.stringify(concernType)}, 
            ${concernDescription}, ${severityLevel}, ${JSON.stringify(actionTaken)}, 
            'admin@concern2care.demo', ${incidentDate}
          )
        `;
        supportRequestsCreated++;
      } catch (error) {
        log.error(`Failed to create demo support request ${i + 1}:`, { error });
      }
    }

    return {
      success: true,
      teachersCreated,
      supportRequestsCreated,
      message: `Successfully created ${teachersCreated} demo teachers and ${supportRequestsCreated} demo support requests.`
    };
  }
);

// Clears all demo data from the system.
export const clearDemoData = api<void, ClearDemoDataResponse>(
  { expose: true, method: "DELETE", path: "/admin/demo/clear", auth: true },
  async () => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    // Delete demo support requests (created by admin)
    const supportRequestsResult = await referralDB.queryRow<{ count: number }>`
      DELETE FROM referrals 
      WHERE created_by_email = 'admin@concern2care.demo'
      RETURNING (SELECT COUNT(*) FROM referrals WHERE created_by_email = 'admin@concern2care.demo') as count
    `;

    // Delete demo teachers (emails ending with .demo)
    const teachersResult = await userDB.queryRow<{ count: number }>`
      DELETE FROM users 
      WHERE email LIKE '%.demo'
      RETURNING (SELECT COUNT(*) FROM users WHERE email LIKE '%.demo') as count
    `;

    const teachersDeleted = teachersResult?.count || 0;
    const supportRequestsDeleted = supportRequestsResult?.count || 0;

    return {
      success: true,
      teachersDeleted,
      supportRequestsDeleted,
      message: `Successfully deleted ${teachersDeleted} demo teachers and ${supportRequestsDeleted} demo support requests.`
    };
  }
);
