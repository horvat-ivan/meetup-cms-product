import matter from 'gray-matter';

function stringifyDates(obj) {
  // YAML 1.1 (used by gray-matter via js-yaml) auto-coerces unquoted dates
  // like `2026-04-28` to JS Date objects. Coerce them back to ISO date strings
  // so downstream code (and serializePrd round-trips) stays predictable.
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Date) {
      obj[k] = v.toISOString().slice(0, 10);
    }
  }
  return obj;
}

export function parsePrd(content) {
  const parsed = matter(content);
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error('PRD missing YAML frontmatter');
  }
  if (!parsed.data.feature) {
    throw new Error('PRD frontmatter missing required field: feature');
  }

  stringifyDates(parsed.data);

  const titleMatch = parsed.content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : parsed.data.feature;

  return {
    frontmatter: parsed.data,
    body: parsed.content,
    slug: parsed.data.feature,
    title,
  };
}

export function serializePrd(prd) {
  return matter.stringify(prd.body, prd.frontmatter);
}

export function isDraft(prd) {
  return prd.frontmatter.status === 'draft';
}

export function extractSummary(prd) {
  const match = prd.body.match(/## Summary\s*\n([\s\S]*?)(?=\n## |$)/);
  return match ? match[1].trim() : '';
}
