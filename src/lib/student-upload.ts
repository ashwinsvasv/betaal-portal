import { CoursePrefix, StudentUploadRow, User } from '@/types';
import { ALL_HOSTELS } from '@/lib/constants';

export const DEFAULT_COURSE_PREFIXES: CoursePrefix[] = [
  { prefix: 'PGP', course_name: 'Post Graduate Programme in Management' },
  { prefix: 'ABM', course_name: 'Post Graduate Programme in Agribusiness Management' },
  { prefix: 'IPM', course_name: 'Integrated Programme in Management' },
  { prefix: 'IPMX', course_name: 'International Programme for Executives' },
  { prefix: 'FPM', course_name: 'Fellow Programme in Management' },
  { prefix: 'PHD', course_name: 'Doctoral Programme in Management' },
  { prefix: 'EFPM', course_name: 'Executive Fellow Programme in Management' },
  { prefix: 'WMP', course_name: 'Working Managers Programme' },
  { prefix: 'SM', course_name: 'Sustainable Management' },
];

/**
 * Parses roll numbers of the format XXXAAYYY (e.g., PGP42069, ABM20001, PHD41001)
 * where XXX = Course prefix, AA = 2-digit Batch number, YYY = Student sequence.
 */
export function parseRollNumber(
  rollNo: string,
  prefixes: CoursePrefix[] = DEFAULT_COURSE_PREFIXES
): { isValid: boolean; course: string; batch: string; error?: string } {
  if (!rollNo || typeof rollNo !== 'string') {
    return { isValid: false, course: '', batch: '', error: 'Missing roll number' };
  }

  const cleaned = rollNo.trim().toUpperCase();

  // Method 1: Known prefixes match (longest prefix first)
  const sortedPrefixes = [...prefixes].sort((a, b) => b.prefix.length - a.prefix.length);
  const matched = sortedPrefixes.find((p) => cleaned.startsWith(p.prefix));

  if (matched) {
    const remainder = cleaned.slice(matched.prefix.length);
    const batchMatch = remainder.match(/^(\d{2})/);
    if (batchMatch) {
      return {
        isValid: true,
        course: matched.prefix,
        batch: batchMatch[1],
      };
    }
  }

  // Method 2: Generic format regex ^([A-Z]{2,6})(\d{2})(\d{1,5})$ (e.g., PGP42069 -> course: PGP, batch: 42)
  const genericMatch = cleaned.match(/^([A-Z]{2,6})(\d{2})(\d{1,5})$/);
  if (genericMatch) {
    return {
      isValid: true,
      course: genericMatch[1],
      batch: genericMatch[2],
    };
  }

  return {
    isValid: false,
    course: '',
    batch: '',
    error: `Invalid roll number format "${cleaned}". Expected format like PGP42069.`,
  };
}

export function validateStudentRow(
  raw: {
    roll_no?: string;
    name?: string;
    email?: string;
    course?: string;
    batch?: string;
    hostel?: string;
  },
  existingRolls: Set<string>,
  existingEmails: Set<string>,
  prefixes: CoursePrefix[] = DEFAULT_COURSE_PREFIXES
): { isValid: boolean; row?: StudentUploadRow; errors: string[] } {
  const errors: string[] = [];

  const rollNo = (raw.roll_no || '').trim().toUpperCase();
  const name = (raw.name || '').trim();
  const email = (raw.email || '').trim().toLowerCase();
  const rawCourse = (raw.course || '').trim().toUpperCase();
  const rawBatch = (raw.batch || '').trim();
  const hostel = (raw.hostel || '').trim();

  // 1. Roll number validation & parsing
  if (!rollNo) {
    errors.push('Roll number is required.');
  } else if (existingRolls.has(rollNo)) {
    errors.push(`Duplicate roll number "${rollNo}".`);
  }

  const parsed = parseRollNumber(rollNo, prefixes);
  const course = rawCourse || parsed.course;
  const batch = rawBatch || parsed.batch;

  if (!parsed.isValid && (!rawCourse || !rawBatch)) {
    errors.push(parsed.error || 'Could not infer course/batch from roll number.');
  }

  // 2. Name validation
  if (!name) {
    errors.push('Student name is required.');
  }

  // 3. Email validation
  if (!email) {
    errors.push('Email is required.');
  } else if (!email.endsWith('@iiml.ac.in')) {
    errors.push(`Email "${email}" must end with @iiml.ac.in.`);
  } else if (existingEmails.has(email)) {
    errors.push(`Duplicate email "${email}".`);
  }

  // 4. Batch validation
  if (!batch || !/^\d{2}$/.test(batch)) {
    errors.push(`Batch "${batch}" must be 2 digits (e.g. 40, 41, 42).`);
  }

  // 5. Hostel validation
  if (!hostel) {
    errors.push('Hostel is required.');
  } else if (!ALL_HOSTELS.includes(hostel as any)) {
    errors.push(`Invalid hostel "${hostel}". Allowed: Hostel 1 through Hostel 17.`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    row: {
      roll_no: rollNo,
      name,
      email,
      course,
      batch,
      hostel,
    },
    errors: [],
  };
}

export function parseCsvContent(
  csvText: string,
  existingUsers: User[],
  prefixes: CoursePrefix[] = DEFAULT_COURSE_PREFIXES
): {
  validRows: StudentUploadRow[];
  invalidRows: { rowNumber: number; raw: Record<string, string>; errors: string[] }[];
  summary: { total: number; valid: number; invalid: number };
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return {
      validRows: [],
      invalidRows: [],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

  const rollIndex = headers.findIndex((h) => h.includes('roll') || h.includes('id'));
  const nameIndex = headers.findIndex((h) => h.includes('name'));
  const emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
  const courseIndex = headers.findIndex((h) => h.includes('course') || h.includes('programme') || h.includes('program'));
  const batchIndex = headers.findIndex((h) => h.includes('batch') || h.includes('year'));
  const hostelIndex = headers.findIndex((h) => h.includes('hostel') || h.includes('block') || h.includes('residence'));

  const existingRolls = new Set(existingUsers.map((u) => u.roll_no.toUpperCase()));
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  const validRows: StudentUploadRow[] = [];
  const invalidRows: { rowNumber: number; raw: Record<string, string>; errors: string[] }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const raw: Record<string, string> = {
      roll_no: rollIndex >= 0 ? cells[rollIndex] : '',
      name: nameIndex >= 0 ? cells[cells.length > nameIndex ? nameIndex : 1] : '',
      email: emailIndex >= 0 ? cells[emailIndex] : '',
      course: courseIndex >= 0 ? cells[courseIndex] : '',
      batch: batchIndex >= 0 ? cells[batchIndex] : '',
      hostel: hostelIndex >= 0 ? cells[hostelIndex] : '',
    };

    const validation = validateStudentRow(raw, existingRolls, existingEmails, prefixes);

    if (validation.isValid && validation.row) {
      validRows.push(validation.row);
      existingRolls.add(validation.row.roll_no);
      existingEmails.add(validation.row.email);
    } else {
      invalidRows.push({
        rowNumber: i + 1,
        raw,
        errors: validation.errors,
      });
    }
  }

  return {
    validRows,
    invalidRows,
    summary: {
      total: lines.length - 1,
      valid: validRows.length,
      invalid: invalidRows.length,
    },
  };
}

export function generate2000TestStudents(existingUsers?: User[]): StudentUploadRow[] {
  const students: StudentUploadRow[] = [];
  const courses = ['PGP', 'ABM', 'IPM', 'IPMX'];
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Gauri', 'Kavya', 'Aditi', 'Saanvi', 'Riya', 'Sara', 'Pari', 'Isha'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Reddy', 'Mehta', 'Iyer', 'Nair', 'Chawla', 'Bansal', 'Jain', 'Kothari', 'Deshmukh'];

  for (let i = 1; i <= 2000; i++) {
    const course = courses[i % courses.length];
    const batch = course === 'PGP' ? '41' : course === 'ABM' ? '20' : '04';
    const seq = String(i).padStart(4, '0');
    const roll_no = `${course}${batch}${seq}`;
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const name = `${fn} ${ln} #${i}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@iiml.ac.in`;
    const hostelNum = (i % 17) + 1;
    const hostel = `Hostel ${hostelNum}`;

    students.push({
      roll_no,
      name,
      email,
      course,
      batch,
      hostel,
    });
  }

  return students;
}
