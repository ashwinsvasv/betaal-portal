export interface ModerationResult {
  hasAbuse: boolean;
  abusiveWordsFound: string[];
  targetsNamedPerson: boolean;
  detectedName?: string;
  heldForReview: boolean;
  reason?: string;
}

export const DEFAULT_ABUSE_WORDS = [
  'idiot',
  'stupid',
  'bastard',
  'bloody',
  'corrupt',
  'scammer',
  'thief',
  'incompetent',
  'useless',
  'pathetic',
  'fraud',
  'rubbish',
  'scoundrel',
];

export const KNOWN_PERSON_NAMES = [
  'Ashwin Narayan',
  'Kabir Mehta',
  'Ananya Sen',
  'Rohan Kulkarni',
  'Tanvi Verma',
  'Devashish Roy',
  'Meera Iyer',
  'Siddharth Jain',
  'Vikramaditya Rao',
  'Pooja Hegde',
  'Prof. Sharma',
  'Prof. Gupta',
  'Director',
  'Dean',
];

export function checkIssueContent(
  title: string,
  details: string,
  abuseWordList: string[] = DEFAULT_ABUSE_WORDS,
  knownNames: string[] = KNOWN_PERSON_NAMES
): ModerationResult {
  const combined = `${title} ${details}`.toLowerCase();

  // 1. Check for abusive words (Prompts student to rephrase)
  const abusiveWordsFound = abuseWordList.filter((word) => {
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    return regex.test(combined);
  });

  // 2. Check if a named individual is targeted (Holds for admin review instead of auto-posting)
  let detectedName: string | undefined;
  const targetsNamedPerson = knownNames.some((name) => {
    const isPresent = new RegExp(`\\b${name.toLowerCase()}\\b`, 'i').test(combined);
    if (isPresent) detectedName = name;
    return isPresent;
  });

  const heldForReview = targetsNamedPerson;
  let reason: string | undefined;

  if (targetsNamedPerson) {
    reason = `Complaint references a specific named individual ("${detectedName}"). Held in Admin Review Queue before public posting.`;
  }

  return {
    hasAbuse: abusiveWordsFound.length > 0,
    abusiveWordsFound,
    targetsNamedPerson,
    detectedName,
    heldForReview,
    reason,
  };
}

export const COMMENT_REMOVAL_REASONS = [
  'Harassment or personal attack',
  'Profanity or uncivil language',
  'Misinformation or unverified rumors',
  'Spam or irrelevant advertising',
  'Confidential or personal identifiable information',
];
