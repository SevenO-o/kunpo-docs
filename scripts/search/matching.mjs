// Pagefind's Chinese fragments contain zero-width word separators. Retain the
// original punctuation so model IDs and parameter names stay distinct.
const normalize = value => (value || '').normalize('NFKC').toLowerCase().replace(/\u200b/g, '');

export function queryTerms(query) {
  return normalize(query).match(/[\p{L}\p{N}_]+(?:[./-][\p{L}\p{N}_]+)*/gu) || [];
}

export function matchesQuery(content, terms) {
  const text = normalize(content);
  return terms.length > 0 && terms.every(term => text.includes(term));
}

export function matchingSection(page, terms) {
  const sections = page.sub_results?.filter(section => section.url?.includes('#')) || [];
  return sections.find(section => matchesQuery(section.title, terms)) ||
    sections.find(section => matchesQuery(section.plain_excerpt, terms));
}
