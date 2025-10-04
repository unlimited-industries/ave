import {runNFA, transitions} from "./nfa.mjs";

const cascadeDelete = (expressions, current) => {
  while (current !== undefined) {
    let parent = expressions[current]?.parent;
    delete expressions[current];
    current = parent;
  }
}

export function shuntingYard(tokens) {
  const prec = {
    "+": 1, "-": 1, "*": 2, "/": 2, "#": 3,
    'unary_minus': 4, 'unary_plus': 4
  };
  const stack = [];
  const expressions = {};

  let state, prev, it;
  let insideBacktick = false;
  let isString = false;
  let current = undefined;

  function shouldPop(opFromStack, newOp) {
    if (!(opFromStack in prec)) return false;

    const rightAssociative = new Set(['unary_minus', 'unary_plus']);
    if (rightAssociative.has(newOp)) {
      return false;
    } else {
      return prec[opFromStack] >= prec[newOp];
    }
  }

  for (let i = 0; i < tokens.length;) {
    if (tokens[i] === '\\') {
      i += 2;
      prev = undefined;
      isString = true;
      current = undefined;
      if (i > tokens.length) {
        throw new Error('No symbol to escape')
      }
      continue;
    }

    if (tokens[i] === '\n' || tokens[i] === ' ' || tokens[i] === '\t') {
      i++;
      continue;
    }

    if (tokens[i] === '`' && tokens[i - 1] !== '\\') {
      insideBacktick = !insideBacktick;
      cascadeDelete(expressions, current);
      isString = true;
      current = undefined;
      prev = undefined;
      i++;
      continue;
    }

    try {
      state = it.next(tokens[i])?.value?.states[0];
    } catch {
      isString = true;
      cascadeDelete(expressions, current);
      current = undefined;
      prev = undefined;
      if (!(tokens[i] === '(' && tokens[i - 1] !== '\\')) {
        continue;
      }
    }

    if (tokens[i] === '(' && tokens[i - 1] !== '\\') {
      isString = false;
      it = runNFA(transitions);
      it.next();
      state = it.next(tokens[i])?.value?.states[0];
      expressions[Object.keys(expressions).length] = { value: [] };

      if (current !== undefined) {
        expressions[Object.keys(expressions).length - 1].parent = current;
        expressions[current].value.push(Object.keys(expressions).length - 1);
      }
      current = Object.keys(expressions).length - 1;
    }

    if (insideBacktick || isString) { prev = undefined; i++; continue }

    if (state === 'unit') {
      if (prev === 'paren_close') {
        if (current !== undefined) expressions[current + 1].unit = tokens[i];
      } else {
        expressions[current].value.push(tokens[i]);
      }
    } else if (state === 'number_unit') {
      expressions[current].value.push(tokens[i]);
    } else if (state === 'unary') {
      let operator = tokens[i] === '-' ? 'unary_minus' : 'unary_plus';
      while (stack.length > 0 && shouldPop(stack[stack.length - 1], operator)) {
        expressions[current].value.push(stack.pop());
      }
      stack.push(operator);
    } else if (state === 'operator' || state === 'hash') {
      while (stack.length > 0 && shouldPop(stack[stack.length - 1], tokens[i])) {
        expressions[current].value.push(stack.pop());
      }
      stack.push(tokens[i]);
    } else if (state === 'paren_open') {
      stack.push(tokens[i]);
      expressions[current].start = i; 
    } else if (state === 'paren_close') {
      while (stack.length > 0 && stack[stack.length - 1] !== "(") {
        let e = stack.pop();
        expressions[current].value.push(e);
      }
      expressions[current].end = i;
      stack.pop();
      current = expressions[current]?.parent;
      if (current === undefined) {
        isString = true;
      }
    }
    prev = state;
    i++;
  }
  if (current !== undefined) {
    delete expressions[current];
  }

  return expressions;
}

// console.log(shuntingYard(['(', ')']));
// console.log(shuntingYard(['(', '123', ')']));
// console.log(shuntingYard(['(', '123', ' ', ' ', '+', '32', ')']));
// console.log(shuntingYard(['(', '123', '+', '(', '5', '+', '3', ')', ')']));
// console.log(shuntingYard(['(', '-', '+', '-', '123', ')']));
// console.log(shuntingYard(['(', 'a', '+', '-', 'b', ')']));
// console.log(shuntingYard(['(', 'a', '-', '-', '(', '-', 'b', '*', '+', '32', ')', ')']));
// console.log(shuntingYard(['(', 'a', '+', '-', 'b', ')', '+']));
// console.log(shuntingYard(['(', 'a', '+', '-', 'b', ')', 'h']));
// console.log(shuntingYard(['(', 'a', '+', '-', '(', 'b', ')', 'a']));
// console.log(shuntingYard(['(', '(', 'a', '+', '-', 'b', ')', '+', 'c']));
// console.log(shuntingYard(['(', '(', 'a', '+', '-', 'b', ')', '+', 'c', '\n', '\n', ')']));
// console.log(shuntingYard('(1+2)'));
// console.log(shuntingYard(['(', 'a', '#', 'Name', ')']));
// console.log(shuntingYard(['(', '123.3m', ' ', ' ', '+', '1/3h', ')']));
// console.log(shuntingYard(['(', 'v', ' ', ' ', '+', 'a', '`', 'v', '`', ')']));
// console.log(shuntingYard(['(', 'v', ' ', ' ', '+', 'a', 'h', ')']));
// console.log(shuntingYard(['(', 'v', ' ', ' ', '+', '`', 'h', '`', '(', '2', '+', '3', ')', ')']));
