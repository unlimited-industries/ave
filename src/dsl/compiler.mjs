const units = {
  h: {
    get: (scope) =>  scope === undefined ? window.innerHeight : scope.offsetHeight,
    set: (scope, value) => scope === undefined ? scope.style.height = value + 'px' : 0,
  },
  w: {
    get: (scope) =>  scope === undefined ? window.innerWidth : scope.offsetWidth,
    set: (scope, value) => scope === undefined ? scope.style.width = value + 'px' : 0
  }
}

const NotImplementedError = (message = "") => {
    this.name = "NotImplementedError";
    this.message = message;
}
NotImplementedError.prototype = Error.prototype;


let currentEffect = null;

const createSignal = (initialValue) =>  {
  let value = initialValue;
  const subscribers = new Set();

  const get = () => {
    if (currentEffect) subscribers.add(currentEffect);
    return value;
  };

  const set = (newValue) => {
    if (newValue !== value) {
      value = newValue;
      subscribers.forEach(fn => fn());
    }
  };

  return [get, set];
}

const createEffect = (fn) => {
  const run = () => {
    currentEffect = run;
    fn();
    currentEffect = null;
  };
  run();
}

const buildIR = (ast) => {
  let elementNumber = 0;
  const buildExpression = (expr, elementVar) => {
    if (typeof expr === 'string') {
      const regex = /^([+-]?\d*\.?\d*(?:\/\d*\.?\d+)?)?\s*([a-z%]+)?$/i;
      const match = expr?.match(regex);
      if (match) {
        const value = match[1];
        const unit = match[2];
        if (value !== undefined) {
          if (units?.[unit] !== undefined) {
            return `units['${unit}'].get(${unit}) * ${value}`;
          } else if (unit === undefined) {
            return `(${value})`
          } else {
            return
          }
        }
      }
      return `"${expr}"`;
    }

    if (!expr.type) return JSON.stringify(expr);

    switch (expr.type) {
      case 'Addition':
        return `(${buildExpression(expr.args[0], elementVar)} + ${buildExpression(expr.args[1], elementVar)})`;
      case 'Subtraction':
        return `(${buildExpression(expr.args[0], elementVar)} - ${buildExpression(expr.args[1], elementVar)})`;
      case 'Multiplication':
        return `(${buildExpression(expr.args[0], elementVar)} * ${buildExpression(expr.args[1], elementVar)})`;
      case 'Division':
        return `(${buildExpression(expr.args[0], elementVar)} / ${buildExpression(expr.args[1], elementVar)})`;
      case 'GetValue':
        throw new Error('GetValue not implemented yet');
      case 'UnaryMinus':
        return `(-${buildExpression(expr.args[0])})`
      case 'UnaryPlus':
        return `(+${buildExpression(expr.args[0])})`
      default:
        return 'undefined';
    }
  };

  const buildComponent = (node, parent = undefined) => {
    const lines = [];
    const signalsVar = [];

    lines.push(`const element${++elementNumber} = ${parent === undefined ? 'document' : parent}.createElement('div');`);
    let currentElement = `element${elementNumber}`;

    if (node.spec) {
      for (const spec of node.spec) {
        if (units[spec.unit] === undefined) {
          continue;
        }
        switch (spec.type) {
          case 'UnitValue': {
            lines.push(`units['${spec.unit}'].set(${currentElement}, ${spec.value})`);
            break;
          }
          case 'Expression': {
            lines.push(buildExpression(spec.value, `${currentElement}`));
            break;
          }
          case 'Template': {
            const signalVar = `signal_${signalsVar.length}`;
            lines.push(`signals.push(${signalVar})`);
            signalsVar.push(signalVar);
            lines.push(`const [${signalVar}_get, ${signalVar}_set] = createSignal();`);
            lines.push(`createEffect(() => units['${spec.unit}'].set(${currentElement}, ${signalVar}_get()));`);
            break;
          }
          case 'Flag':
            lines.push(`units['${spec.unit}'].set(${currentElement}, 1)`);
            break;
        }
      }
    }

    if (node.children) {
      node.children.forEach((child) => {
        if (child.type === 'Component') {
          const childLines = buildComponent(child, currentElement);
          lines.push(childLines);
          lines.push(`${currentElement}.appendChild(element${elementNumber});`);
        }
      });
    }

    return lines.join('\n');
  };

  let code = 'signals = []\n';
  for (let e of ast.body) {
    code += buildComponent(e);
    code += '\n'
  }

  code += 'return signal'
  
  return new Function('createSignal', 'createEffect', 'units', code);
}


let use = async (component) => {
  component(createSignal, createEffect, units);
}

export { use, buildIR };