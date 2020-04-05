import emoji from 'emoji-js';

const e = new emoji.EmojiConvertor();
e.replace_mode = 'unified';
e.allow_native = true;

export const parseEmojis = (text: string) => {
  return e.replace_colons(text);
}