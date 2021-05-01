import emoji from 'emoji-js';
import cheerio from 'cheerio';
import axios from 'axios';

const e = new emoji.EmojiConvertor();
e.replace_mode = 'unified';
e.allow_native = true;

export const parseEmojis = (text: string) => e.replace_colons(text);

export const getImageURLFromSlackPage = async (url: string) => {
  const imagePage = await axios.get(url);
  const $ = cheerio.load(imagePage.data);

  return $('a.file_body.image_body img').attr('src')!;
}
