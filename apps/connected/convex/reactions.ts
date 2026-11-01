// Shared fixed choices: clients cannot supply arbitrary text or media.
export const REACTIONS = {
  hi: { label: 'Hi', glyph: '☀' },
  heart: { label: 'A little love', glyph: '♥' },
  wave: { label: 'Waving hello', glyph: '👋' },
  tea: { label: 'Tea together?', glyph: '🍵' },
  coffee: { label: 'Coffee together?', glyph: '☕' },
  thanks: { label: 'Thank you', glyph: '🙏' },
  cheer: { label: 'Cheering you on', glyph: '📣' },
  hug: { label: 'A little hug', glyph: '🤗' },
  highfive: { label: 'High five', glyph: '🙌' },
  sparkle: { label: 'A little sparkle', glyph: '✨' },
  thinking: { label: 'Thinking of you', glyph: '💭' },
  celebrate: { label: 'Let’s celebrate', glyph: '🎉' },
} as const;
export type Reaction = keyof typeof REACTIONS;
