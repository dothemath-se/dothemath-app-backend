import emoji from 'emoji-js';
import cheerio from 'cheerio';
import axios from 'axios';

const e = new emoji.EmojiConvertor();
e.replace_mode = 'unified';
e.allow_native = true;

export const parseEmojis = (text: string) => {
  return e.replace_colons(text);
}

export const getImageURLFromSlackPage = async (url: string) => {

  const imagePage = await axios.get(url);
  const $ = cheerio.load(imagePage.data);
  const container = $('.image_body.file_body');

  return container[0].children[0].attribs.src;
}