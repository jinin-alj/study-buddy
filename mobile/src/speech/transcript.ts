/** Add a newly finished phrase to what the student has said so far. */
export function appendPhrase(finishedText: string, phrase: string): string {
  const trimmedPhrase = phrase.trim();
  if (trimmedPhrase === '') {
    return finishedText;
  }
  if (finishedText === '') {
    return trimmedPhrase;
  }
  return `${finishedText} ${trimmedPhrase}`;
}

/** Everything heard so far: finished phrases plus the phrase still being recognised. */
export function joinTranscript(finishedText: string, inProgressText: string): string {
  return appendPhrase(finishedText, inProgressText);
}
