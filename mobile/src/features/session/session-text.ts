import type { CheckerFeedback, StudySession } from '@/api/types';

/** "You explained 4 of 6 key ideas", counted from the gap map. */
export function summariseCoverage(feedback: CheckerFeedback): string {
  let coveredCount = 0;
  for (const keyIdea of feedback.key_ideas) {
    if (keyIdea.status === 'covered') {
      coveredCount += 1;
    }
  }
  return `You explained ${coveredCount} of ${feedback.key_ideas.length} key ideas.`;
}

/** What Pip should say out loud for the current state of the session. */
export function lineToSpeak(session: StudySession): string {
  if (session.status === 'completed' && session.feedback !== null) {
    return `${summariseCoverage(session.feedback)} Your next step: ${session.feedback.next_step}`;
  }
  let latestBuddyLine = '';
  for (const turn of session.turns) {
    if (turn.speaker === 'buddy') {
      latestBuddyLine = turn.text;
    }
  }
  return latestBuddyLine;
}
