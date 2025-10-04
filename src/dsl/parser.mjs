import { shuntingYard } from "./expressions/parser.mjs";

export function parser(tokens) {
  let pos = 0;

  function peek(offset = 0) {
    return tokens[pos + offset];
  }

  function consume(type, skipLGaps=true, skipRGaps=true) {
    while (peek() && (peek().type === 'WHITESPACE' || peek().type === 'NEWLINE') && skipLGaps) {
      pos++;
    }
    const token = tokens[pos];
    if (!token || (token.type !== type && type)) {
      throw new SyntaxError(`Expected ${type}, got ${token ? token.type : 'EOF'}`);
    }
    pos++;
    while (peek() && (peek().type === 'WHITESPACE' || peek().type === 'NEWLINE') && skipRGaps) {
      pos++;
    }
    return token;
  }

  function match(type) {
    if (peek()?.type === type) {
      return consume(type);
    }
    return null;
  }

  function parseProgram() {
    const body = [];
    while (pos < tokens.length) {
      body.push(parseTopLevelComponent());
      break;
    }
    return { type: 'Program', body };
  }

  function parseTopLevelComponent() {
    const directives = [];
    if (peek()?.type === 'WHITESPACE' || peek()?.type === 'NEWLINE') consume();
    while (peek()?.type === 'DIRECTIVE') {
      directives.push(parseDirective());
    }

    return parseComponent(directives);
  }

function parseDirective() {
  const name = consume('DIRECTIVE').value.slice(1);
  let value = true;

  if (peek()?.type === 'BACKTICK') {
    consume('BACKTICK');
    value = '';
    while (peek() && peek().type !== 'BACKTICK' && peek().type !== 'NEWLINE' && peek().type !== 'DIRECTIVE') {
      value += consume().value;
    }
    if (peek().type !== 'DIRECTIVE') consume();
  }
  return { type: 'Directive', name, value };
}

  function parseComponent(directives = []) {
    let indent = 0;
    if (peek()?.type === 'INDENT') {
      const token = consume('INDENT');
      const colons = (token.value.match(/:/g) || []).length;
      indent = colons + 1
    }

    let name = null;
    if (peek()?.type === 'IDENT') {
      name = consume('IDENT').value;
    } else if (peek()?.type === 'SPREAD') {
      const token = consume('SPREAD');
      return { type: 'TemplateInsert', indent, value: token.value };
    } else {
      throw new SyntaxError(`Expected component name or '...' at position ${pos}`);
    }

    let spec = [];
    if (match('SEPARATOR')) {
      spec = parseSpecList();
    }

    let comment = null;
    if (peek()?.type === 'COMMENT') {
      comment = consume('COMMENT').value.replace(/^::/, '').trim();
    }

    const children = [];
    while (pos < tokens.length) {
      const nextIndent = getNextIndent();
      if (nextIndent > indent) {
        children.push(parseTopLevelComponent());
      } else {
        break;
      }
    }

    return {
      type: 'Component',
      name,
      indent,
      directives,
      spec,
      comment,
      children
    };
  }

  function parseSpecList() {
    const items = [];
    while (peek() && peek().type !== 'NEWLINE' && peek().type !== 'COMMENT' && peek().type !== 'INDENT') {
      if (peek().type === 'PLUS' || peek().type === 'MINUS') {
        const isPositive = peek().type === 'PLUS';
        consume(peek().type);
        const flagName = consume('IDENT').value;
        items.push({ type: 'Flag', unit: flagName, value: isPositive });
      } else if (peek().type === 'IDENT') {
        items.push({ type: 'Template', unit: consume('IDENT').value });
      } else if (peek().type === 'NUMBER_UNIT') {
        const match = consume('NUMBER_UNIT').value.match(/^([\d./]+)([a-z%]+)$/i);
        items.push({
          type: 'UnitValue',
          value: parseFloat(match[1]),
          unit: match[2]
        });
      } else if (peek().type === 'NUMBER') {
        const number = parseFloat(consume('NUMBER').value);
        const unitToken = match('IDENT');
        items.push({
          type: 'UnitValue',
          value: number,
          unit: unitToken ? unitToken.value : null
        });
      } else if (peek().type === 'PAREN_OPEN') {
        const expression = parseExpression();
        items.push({ unit: consume('IDENT').value, ...expression });
      } else {
        pos++;
      }
    }

    return items;
  }

  function parseExpression() {
    const exprTokens = [];
    let opened = 0;
    while (peek()) {
      if (peek().type === 'PAREN_OPEN' && peek(-1).value !== '\\') opened += 1;
      if (peek().type === 'PAREN_CLOSE' && peek(-1).value !== '\\') opened -= 1;
      exprTokens.push(consume(peek().type, false, false).value);
      if (opened === 0) break;
    }
    if (opened !== 0) {
      throw new Error('Parse Error: no close parenthesis');
    }
    
    let root;
    let RPN = shuntingYard(exprTokens);
    let expressionAST = { args: [], parent: undefined };

    if (RPN[0]?.start !== 0 || RPN[0]?.end !== exprTokens.length - 1) {
      expressionAST.args.push({ type: 'Concatation', args: [], parent: expressionAST });
      root = expressionAST.args[0];
      expressionAST = expressionAST.args[0];
    }
    
    const operators = { '+': { type: 'Addition', args: 2 }, '-': { type: 'Subtraction', args: 2 },
      '*': { type: 'Multiplication', args: 2 }, '/': { type: 'Division', args: 2 },
      '#': { type: 'GetValue', args: 2}, 'unary_plus': { type: 'UnaryPlus', args: 1},
      'unary_minus': { type: 'UnaryMinus', args: 1}
    }

    let range = {start: 0, end: 0};

    const concatanate = (start, end) => {
      range.end = start;
      let isQuote = false;
      for (let i = range.start; i < range.end; i++) {
        if (i === range.start) root.args.push('');
        if (exprTokens[i] === '\\') { i++; continue }
        if (exprTokens[i] === '`') { isQuote = !isQuote; continue }
        if (exprTokens[i] === '(' && !isQuote) continue;
        if (isQuote || ![' ', '\t', '\n'].includes(exprTokens[i])) {
          root.args[root.args.length - 1] += exprTokens[i];
        }
      }
      range.start = end;
    }

    for (let i = 0; i < Object.keys(RPN).length; i++) {
      let key = Object.keys(RPN)?.[i];
      if (RPN[RPN[key]?.parent] === undefined) {
        delete RPN[key]?.parent;
      }
      if (RPN[key].parent === undefined) {
        concatanate(RPN[key].start, RPN[key].end + 1);
        for (let j = RPN[key]?.value?.length - 1; j >= 0; j--) {
          if (operators[RPN[key].value[j]] !== undefined) {
            if (expressionAST.type === 'Concatation') {
              expressionAST.args.push({ type: operators[RPN[key].value[j]].type, args: [], parent: expressionAST, symbol: RPN[key].value[j] });
              expressionAST = expressionAST.args[expressionAST.args.length - 1]; 
            } else {
              expressionAST.args.unshift({ type: operators[RPN[key].value[j]].type, args: [], parent: expressionAST, symbol: RPN[key].value[j] });
              expressionAST = expressionAST.args[0];
            }
          } else if (Number.isFinite(RPN[key].value[j])) {
            key = RPN[key].value[j];
            RPN[key].position = j;
            j = RPN[key].value.length;
            continue;
          } else {
            if (expressionAST.type === 'Concatation') {
              expressionAST.args.push(RPN[key].value[j]);
            } else {
              expressionAST.args.unshift(RPN[key].value[j]);
            }
          }
          if (j === 0) {
            j = RPN[key]?.position || 0;
            key = RPN[key]?.parent !== undefined ? RPN[key].parent : key;
          }

          if (expressionAST.args.length === operators[expressionAST.symbol]?.args) {
            expressionAST = expressionAST.parent;
          }
        }
      }
    }

    concatanate(exprTokens.length - 1, 0);

    return { type: 'Expression', value: expressionAST};
  }

  function getNextIndent() {
    if (peek()?.type === 'INDENT') {
      const colons = (peek().value.match(/:/g) || []).length;
      return colons + 1;
    }
    return 0;
  }

  return parseProgram();
}
