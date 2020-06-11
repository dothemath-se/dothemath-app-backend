import iconv from 'iconv-lite';

// Fix for Azure app settings encoding problem.
// https://stackoverflow.com/a/53371417/268091
// This works for all characters except capital Å...
export function fixAzureAppSettingsEncoding(value: string) {
  const buffer = iconv.encode(value, 'win1252');
  return iconv.decode(buffer, 'ibm437');
}
