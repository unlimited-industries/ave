const checkIfInRange = (number, min, max) => {
  return number >= min && number <= max;
}  

function splitIntoThreeParts(str, delimiter) {
  let parts = str.split(delimiter);
  if (parts.length < 3) return parts;

  let first = parts[0];
  let second = parts[1];
  let third = parts.slice(2).join(delimiter);

  return [first, second, third];
}

const bfs = (graph, start, fn) => {
  const queue = [{node: start, parent: null}];
  const visited = new Set();

  while (queue.length > 0) {
    const { node, parent } = queue.shift();
    if (visited.has(node)) continue;
    visited.add(node);

    for (const key in (graph[node] || {})) {
      const neighbor = graph[node][key];
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, parent: node });
      }
    }
    fn(graph, node, () => { visited.clear() }, parent);
  }
};

function formatTitle(input) {
  const smallWords = ["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "up", "yet"];
  const sanitized = input.replace(/[^\w\-]+/g, '');

  return sanitized.split('-').map((word, index) => {
    const lower = word.toLowerCase();
    if (index === 0 || !smallWords.includes(lower)) {
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    return lower;
  }).join(' ');
}

export { checkIfInRange, splitIntoThreeParts, bfs, formatTitle }
