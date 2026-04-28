function hasLabel(issue, name) {
  return (issue.labels || []).some((l) => l.name === name);
}

function filterFeature(issues, slug) {
  return issues.filter((i) => hasLabel(i, `feature:${slug}`)).sort((a, b) => a.number - b.number);
}

function filterRole(issues, role) {
  return issues.filter((i) => hasLabel(i, `role:${role}`));
}

export function aggregate(productIssues, designIssues, appIssues, slug) {
  // If slug not given, fall back to all (used by tests where input is already filtered).
  const filterIfSlug = slug ? (xs) => filterFeature(xs, slug) : (xs) => xs.slice().sort((a, b) => a.number - b.number);
  return {
    product: filterRole(filterIfSlug(productIssues), 'product'),
    design: filterRole(filterIfSlug(designIssues), 'design'),
    app: filterRole(filterIfSlug(appIssues), 'app'),
  };
}

export function deriveStatus(allIssues) {
  if (allIssues.length === 0) return 'dispatched';
  const allClosed = allIssues.every((i) => i.state === 'CLOSED');
  if (allClosed) return 'completed';
  const anyClosed = allIssues.some((i) => i.state === 'CLOSED');
  if (anyClosed) return 'in-progress';
  return 'dispatched';
}

export function deriveProgress(allIssues) {
  const closed = allIssues.filter((i) => i.state === 'CLOSED').length;
  return `${closed}/${allIssues.length}`;
}
