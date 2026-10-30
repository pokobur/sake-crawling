/**
 * HTMLの特殊文字をエスケープしてXSSを防止するユーティリティ
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const text = String(str);
  const matchHtmlRegExp = /["'&<>]/;
  const match = matchHtmlRegExp.exec(text);

  if (!match) {
    return text;
  }

  let html = '';
  let index = 0;
  let lastIndex = 0;

  for (index = match.index; index < text.length; index++) {
    let escape = '';
    switch (text.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += text.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + text.substring(lastIndex, index) : html;
}
