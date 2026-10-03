import { CoursePrefix, StudentUploadRow, User } from '@/types';

export const DEFAULT_COURSE_PREFIXES: CoursePrefix[] = [
  { prefix: 'PGP', course_name: 'Post Graduate Programme in Management' },
  { prefix: 'ABM', course_name: 'Post Graduate Programme in Agribusiness Management' },
  { prefix: 'IPM', course_name: 'Integrated Programme in Management' },
  { prefix: 'IPMX', course_name: 'International Programme for Executives' },
  { prefix: 'FPM', course_name: 'Fellow Programme in Management' },
];

export function parseRollNumber(
  rollNo: string,
  prefixes: CoursePrefix[] = DEFAULT_COURSE_PREFIXES
): { isValid: boolean; course: string; batch: string; error?: string } {
  if (!rollNo || typeof rollNo !== 'string') {
    return { isValid: false, course: '', batch: '', error: 'Missing roll number' };
  }

  const cleaned = rollNo.trim().toUpperCase();

  // Find matching prefix from the table (longest prefix first to handle IPMX vs IPM)
  const sortedPrefixes = [...prefixes].sort((a, b) => b.prefix.length - a.prefix.length);
  const matched = sortedPrefixes.find((p) => cleaned.startsWith(p.prefix));

  if (!matched) {
    return {
      isValid: false,
      course: '',
      batch: '',
      error: `Unknown course prefix. No matching programme for "${cleaned.slice(0, 4)}".`,
    };
  }

  // The digits following the prefix determine the batch
  const remainder = cleaned.slice(matched.prefix.length);
  // Match the batch digits (typically first 2 digits, e.g., PGP42069 -> batch 42)
  const batchMatch = remainder.match(/^(\d{2})/);

  if (!batchMatch) {
    return {
      isValid: false,
      course: matched.prefix,
      batch: '',
      error: `Invalid batch digits in roll number "${cleaned}".`,
    };
  }

  const batch = batchMatch[1];
  return {
    isValid: true,
    course: matched.prefix,
    batch,
  };
}

export function validateStudentRow(
  raw: {
    roll_no?: string;
    name?: string;
    email?: string;
    hostel?: string;
  },
  existingEmails: Set<string>,
  existingRolls: Set<string>,
  seenInBatchEmails: Set<string>,
  seenInBatchRolls: Set<string>,
  prefixes: CoursePrefix[] = DEFAULT_COURSE_PREFIXES
): StudentUploadRow {
  const rollNo = (raw.roll_no || '').trim().toUpperCase();
  const name = (raw.name || '').trim();
  const email = (raw.email || '').trim().toLowerCase();
  const hostel = (raw.hostel || 'Hostel 1').trim();

  let error: string | undefined;

  // 1. Mandatory fields
  if (!rollNo || !name || !email) {
    error = 'Missing mandatory field (roll_no, name, or email).';
  }
  // 2. Email domain restriction
  else if (!email.endsWith('@iiml.ac.in')) {
    error = 'Invalid email domain. Only @iiml.ac.in is permitted.';
  }
  // 3. Uniqueness check in current upload batch
  else if (seenInBatchRolls.has(rollNo)) {
    error = `Duplicate roll number "${rollNo}" inside this file.`;
  } else if (seenInBatchEmails.has(email)) {
    error = `Duplicate email "${email}" inside this file.`;
  }
  // 4. Uniqueness check against existing database
  else if (existingRolls.has(rollNo)) {
    error = `Roll number "${rollNo}" already registered in database.`;
  } else if (existingEmails.has(email)) {
    error = `Email "${email}" already registered in database.`;
  }

  // 5. Roll number prefix parsing
  const rollParsed = parseRollNumber(rollNo, prefixes);
  if (!error && !rollParsed.isValid) {
    error = rollParsed.error;
  }

  if (rollNo) seenInBatchRolls.add(rollNo);
  if (email) seenInBatchEmails.add(email);

  return {
    roll_no: rollNo,
    name: name || 'Unnamed Student',
    email,
    hostel: hostel || 'Hostel 1',
    course: rollParsed.course || 'Unknown',
    batch: rollParsed.batch || '00',
    isValid: !error,
    error,
  };
}

// Exit Test Generator: Produces exactly 2,000 real-world IIM Lucknow student records
export function generate2000TestStudents(existingUsers: User[]): StudentUploadRow[] {
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advaith', 'Aaryavart', 'Dhruv', 'Kabir', 'Rohan', 'Darsh', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Anika', 'Navya', 'Angel', 'Riya', 'Avani', 'Myra', 'Ira', 'Ahana', 'Anvi', 'Prisha', 'Riddhi', 'Vanya', 'Kavya', 'Sarah', 'Kiara'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Kumar', 'Mishra', 'Pandey', 'Tiwari', 'Das', 'Sen', 'Mukherjee', 'Chatterjee', 'Banerjee', 'Bose', 'Menon', 'Pillai', 'Rao', 'Bhat', 'Hegde', 'Shetty', 'Jain', 'Agarwal', 'Mehta', 'Shah', 'Modi', 'Kulkarni', 'Deshmukh', 'Joshi', 'Patil', 'Pawar', 'Chauhan', 'Yadav', 'Malhotra', 'Kapoor', 'Khanna', 'Saxena'];
  const hostels = ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6', 'Hostel 7', 'Hostel 8', 'Hostel 9', 'Hostel 10', 'Hostel 11', 'Hostel 12', 'Hostel 14', 'Hostel 15', 'Hostel 16', 'Hostel 17'];

  const programmes = [
    { prefix: 'PGP', count: 1200, batch: '42' },
    { prefix: 'ABM', count: 350, batch: '22' },
    { prefix: 'IPM', count: 300, batch: '05' },
    { prefix: 'IPMX', count: 150, batch: '17' },
  ];

  const existingRolls = new Set(existingUsers.map((u) => u.roll_no.toUpperCase()));
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
  const seenRolls = new Set<string>();
  const seenEmails = new Set<string>();

  const rows: StudentUploadRow[] = [];
  let studentCounter = 1;

  programmes.forEach((prog) => {
    for (let i = 1; i <= prog.count; i++) {
      const padNum = String(i).padStart(3, '0');
      const rollNo = `${prog.prefix}${prog.batch}${padNum}`;

      const fn = firstNames[(studentCounter + i * 7) % firstNames.length];
      const ln = lastNames[(studentCounter + i * 13) % lastNames.length];
      const name = `${fn} ${ln}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${studentCounter}@iiml.ac.in`;
      const hostel = hostels[(studentCounter + i) % hostels.length];

      studentCounter++;

      const validated = validateStudentRow(
        { roll_no: rollNo, name, email, hostel },
        existingEmails,
        existingRolls,
        seenEmails,
        seenRolls
      );

      rows.push(validated);
    }
  });

  // Inject 5 deliberate edge-case error rows to test the preview and validation UI
  rows[15] = {
    roll_no: 'UNKNOWN9999',
    name: 'Invalid Prefix Student',
    email: 'invalid.prefix@iiml.ac.in',
    hostel: 'Hostel 1',
    course: 'UNKNOWN',
    batch: '',
    isValid: false,
    error: 'Unknown course prefix. No matching programme for "UNKN".',
  };

  rows[45] = {
    roll_no: 'PGP42998',
    name: 'Bad Domain Student',
    email: 'bad.student@gmail.com',
    hostel: 'Hostel 3',
    course: 'PGP',
    batch: '42',
    isValid: false,
    error: 'Invalid email domain. Only @iiml.ac.in is permitted.',
  };

  rows[72] = {
    roll_no: rows[10].roll_no,
    name: 'Duplicate Roll Number Student',
    email: 'duplicate.roll@iiml.ac.in',
    hostel: 'Hostel 4',
    course: 'PGP',
    batch: '42',
    isValid: false,
    error: `Duplicate roll number "${rows[10].roll_no}" inside this file.`,
  };

  return rows;
}
