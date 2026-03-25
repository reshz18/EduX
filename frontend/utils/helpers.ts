/**
 * Extracts the YouTube video ID from various URL formats or returns the ID if already provided.
 * Supports:
 * - 11 character IDs (e.g., dQw4w9WgXcQ)
 * - watch?v= format
 * - youtu.be/ format
 * - embed/ format
 */
export const getYouTubeVideoId = (input: string | undefined): string => {
  if (!input) return '';
  
  // If it's already an 11-char ID, return it
  if (input.length === 11 && !input.includes('/') && !input.includes('?')) {
    return input;
  }

  // Regular expression to extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = input.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  return '';
};
