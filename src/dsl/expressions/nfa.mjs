const transitions = {
  start: { paren_open: "paren_open" },

  unary: { unary: "unary", unit: "unit", number_unit: 'number_unit', paren_open: "paren_open" },

  unit: { operator: "operator", paren_close: "paren_close", "#": "hash" },

  number_unit: { operator: "operator", paren_close: "paren_close", "#": "hash" },

  operator: {
    unary: "unary",
    unit: "unit",
    number_unit: "number_unit",
    paren_open: "paren_open",
  },

  hash: { name: "unit" },

  paren_open: {
    unary: "unary",
    unit: "unit",
    number_unit: 'number_unit',
    paren_open: "paren_open",
    name: "unit",
    "#": "hash"
  },

  paren_close: { operator: "operator", paren_close: "paren_close", unit: 'unit' }
};

function detectPossibleTypes(t) {
  const types = new Set();

  if (/^\d+(?:[./]\d+)?[a-z]*$/.test(t)) types.add("number_unit");

  if (/^[a-z]+$/.test(t)) types.add("unit");

  if (/^[A-Za-z_][\w-]*$/.test(t)) types.add("name");

  if (t === "#") types.add("#");
  if (t === "(") types.add("paren_open");
  if (t === ")") types.add("paren_close");

  if (t === "+" || t === "-") types.add("plusminus");
  if (t === "*" || t === "/") types.add("operator");

  return Array.from(types);
}

function* runNFA(transitions, start = "start") {
  let states = new Set([start]);

  while (true) {
    const t = yield { states: Array.from(states) };
    if (t === undefined) break; 

    const possTypes = detectPossibleTypes(t);
    const nextStates = new Set();

    for (const s of states) {
      for (const ty of possTypes) {
        if (ty === "plusminus") {
          if (transitions[s]?.["unary"]) nextStates.add(transitions[s]["unary"]);
          if (transitions[s]?.["operator"]) nextStates.add(transitions[s]["operator"]);
        } else {
          if (transitions[s]?.[ty]) nextStates.add(transitions[s][ty]);
        }
      }
    }

    if (nextStates.size === 0) {
      throw new Error(
        `No valid transition for token "${t}" from states: ${Array.from(states).join(", ")}`
      );
    }

    states = nextStates;
  }

  const accepting = new Set(["unit", "paren_close"]);
  return Array.from(states).some((s) => accepting.has(s));
}

export { runNFA, transitions };
