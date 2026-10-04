import { Issue, IssueCategory, IssueScope } from '@/types';

// Stop words to exclude from text tokenization
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
  'our', 'their', 'this', 'that', 'these', 'those', 'there', 'here', 'what',
  'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'issue', 'problem', 'complaint', 'ticket', 'please', 'help', 'fix', 'broken',
  'working', 'not working', 'properly', 'since', 'days', 'yesterday', 'today',
]);

// Domain-specific synonym clusters for campus grievances
const SYNONYM_CLUSTERS: Record<string, string[]> = {
  internet: ['wifi', 'wi-fi', 'lan', 'ethernet', 'router', 'network', 'connection', 'internet', 'broadband', 'speed', 'bandwidth', 'disconnecting', 'drop', 'ping', 'dns'],
  food_mess: ['mess', 'food', 'caterer', 'catering', 'dining', 'breakfast', 'lunch', 'dinner', 'snack', 'chapati', 'roti', 'rice', 'dal', 'paneer', 'chicken', 'meal', 'taste', 'hygiene', 'cockroach', 'insect', 'worms', 'oil', 'raw', 'undercooked'],
  plumbing_water: ['water', 'geyser', 'hot water', 'cold water', 'shower', 'tap', 'faucet', 'washroom', 'bathroom', 'toilet', 'flush', 'leak', 'leaking', 'drain', 'drainage', 'sewage', 'clogged', 'pipe', 'pipeline'],
  electrical: ['electricity', 'power', 'socket', 'switch', 'light', 'tube light', 'bulb', 'fan', 'ac', 'cooler', 'air conditioner', 'wiring', 'short circuit', 'blackout', 'tripping', 'mcb'],
  sports: ['badminton', 'court', 'gym', 'treadmill', 'weights', 'dumbbell', 'football', 'ground', 'cricket', 'squash', 'table tennis', 'tt', 'pool', 'basketball', 'sports', 'equipment'],
  academics: ['class', 'lecture', 'professor', 'faculty', 'quiz', 'exam', 'midterm', 'endterm', 'grading', 'attendance', 'slides', 'course', 'schedule', 'slot', 'classroom', 'projector', 'mic', 'audio'],
  finance: ['reimbursement', 'bills', 'invoice', 'payment', 'budget', 'funds', 'treasurer', 'fee', 'account', 'claim', 'stipend'],
  hygiene_cleaning: ['cleaning', 'clean', 'garbage', 'trash', 'dustbin', 'sweeper', 'maid', 'corridor', 'wing', 'smell', 'odor', 'hygiene', 'stray', 'dogs', 'monkeys'],
};

/**
 * Tokenizes text into normalized stems & synonym tags
 */
export function tokenizeText(text: string): { tokens: Set<string>; synonymTags: Set<string> } {
  if (!text) return { tokens: new Set(), synonymTags: new Set() };

  // Clean and split words
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const tokens = new Set<string>();
  const synonymTags = new Set<string>();

  for (const word of words) {
    tokens.add(word);

    // Check synonym clusters
    for (const [clusterKey, clusterWords] of Object.entries(SYNONYM_CLUSTERS)) {
      if (clusterWords.some((cw) => cw === word || word.includes(cw) || cw.includes(word))) {
        synonymTags.add(clusterKey);
      }
    }
  }

  return { tokens, synonymTags };
}

/**
 * Calculates Jaccard similarity coefficient between two sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export interface DuplicateMatch {
  issue: Issue;
  similarityScore: number; // 0 to 1
  matchReasons: string[];
}

export interface DuplicateCheckParams {
  title: string;
  details?: string;
  category: IssueCategory;
  scope: IssueScope;
  hostel?: string;
  issues: Issue[];
  minScore?: number;
}

/**
 * Finds similar existing open issues to avoid ticket duplication
 */
export function findSimilarIssues({
  title,
  details = '',
  category,
  scope,
  hostel = '',
  issues,
  minScore = 0.20,
}: DuplicateCheckParams): DuplicateMatch[] {
  if (!title || title.trim().length < 4) return [];

  const draftTokenObj = tokenizeText(`${title} ${details}`);
  const draftTokens = draftTokenObj.tokens;
  const draftSynonyms = draftTokenObj.synonymTags;

  if (draftTokens.size === 0 && draftSynonyms.size === 0) return [];

  const results: DuplicateMatch[] = [];

  for (const issue of issues) {
    // Only check open/active public issues
    const isClosed =
      issue.status === 'Closed' ||
      issue.status === 'Withdrawn' ||
      issue.status === 'Rejected';
    if (isClosed || issue.visibility === 'private' || issue.held_for_review) {
      continue;
    }

    const targetTokenObj = tokenizeText(`${issue.title} ${issue.details}`);
    const tokenSim = jaccardSimilarity(draftTokens, targetTokenObj.tokens);
    const synSim = jaccardSimilarity(draftSynonyms, targetTokenObj.synonymTags);

    // Text & Synonym combined score (base)
    let score = tokenSim * 0.45 + synSim * 0.25;

    const matchReasons: string[] = [];

    // Category match bonus
    if (issue.category === category) {
      score += 0.15;
      matchReasons.push(`Same category: ${category}`);
    }

    // Location / Hostel match bonus
    if (
      hostel &&
      issue.hostel &&
      issue.hostel.toLowerCase() === hostel.toLowerCase() &&
      (scope === 'my hostel' || scope === 'my room')
    ) {
      score += 0.20;
      matchReasons.push(`Same location: ${hostel}`);
    } else if (scope === 'whole campus' && issue.scope === 'whole campus') {
      score += 0.10;
      matchReasons.push('Campus-wide scope');
    }

    // Direct phrase or keyword overlap detection
    const normalizedDraftTitle = title.toLowerCase().trim();
    const normalizedIssueTitle = issue.title.toLowerCase().trim();

    if (
      normalizedIssueTitle.includes(normalizedDraftTitle) ||
      normalizedDraftTitle.includes(normalizedIssueTitle)
    ) {
      score += 0.30;
      matchReasons.push('Direct title overlap');
    }

    // Cap at 1.0
    const finalScore = Math.min(1.0, Number(score.toFixed(2)));

    if (finalScore >= minScore) {
      results.push({
        issue,
        similarityScore: finalScore,
        matchReasons: matchReasons.length > 0 ? matchReasons : ['Similar description & context'],
      });
    }
  }

  // Sort descending by similarity score, then by vote count
  return results
    .sort((a, b) => {
      if (Math.abs(b.similarityScore - a.similarityScore) > 0.08) {
        return b.similarityScore - a.similarityScore;
      }
      return b.issue.vote_count - a.issue.vote_count;
    })
    .slice(0, 5);
}
