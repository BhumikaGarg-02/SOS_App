/**
 * Tokenizer & Shunting-Yard arithmetic evaluator
 * Supports +, − (or -), × (or *), ÷ (or /), decimals, operator precedence.
 * Never uses eval or Function.
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
}

export function tokenize(expr: string): Token[] {
  // Normalize symbols: − -> -, × -> *, ÷ -> /
  const normalized = expr
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '');

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      while (i < normalized.length && ((normalized[i] >= '0' && normalized[i] <= '9') || normalized[i] === '.')) {
        numStr += normalized[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      // Check for unary minus: at start of expression or following another operator or left paren
      const prev = tokens[tokens.length - 1];
      if (ch === '-' && (!prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN')) {
        // Unary minus: peek ahead to see if number follows
        i++;
        let numStr = '-';
        while (i < normalized.length && ((normalized[i] >= '0' && normalized[i] <= '9') || normalized[i] === '.')) {
          numStr += normalized[i];
          i++;
        }
        if (numStr === '-') {
          // Stray minus
          tokens.push({ type: 'OPERATOR', value: '-' });
        } else {
          tokens.push({ type: 'NUMBER', value: numStr });
        }
        continue;
      }

      tokens.push({ type: 'OPERATOR', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Skip unknown character
    i++;
  }

  return tokens;
}

const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

export function evaluateExpression(expr: string): number | null {
  if (!expr || expr.trim() === '') return 0;
  const tokens = tokenize(expr);
  if (tokens.length === 0) return 0;

  // Shunting-Yard algorithm to generate Reverse Polish Notation (RPN)
  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER') {
      outputQueue.push(token);
    } else if (token.type === 'OPERATOR') {
      const o1 = token.value;
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
        (PRECEDENCE[operatorStack[operatorStack.length - 1].value] || 0) >= (PRECEDENCE[o1] || 0)
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type !== 'LPAREN'
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'LPAREN') {
        operatorStack.pop();
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op.type !== 'LPAREN' && op.type !== 'RPAREN') {
      outputQueue.push(op);
    }
  }

  // Evaluate RPN
  const evalStack: number[] = [];
  for (const token of outputQueue) {
    if (token.type === 'NUMBER') {
      const val = parseFloat(token.value);
      if (isNaN(val)) return null;
      evalStack.push(val);
    } else if (token.type === 'OPERATOR') {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop()!;
      const a = evalStack.pop()!;
      let res = 0;
      switch (token.value) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) return null; // Avoid division by zero
          res = a / b;
          break;
        default:
          return null;
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) return null;
  const result = evalStack[0];
  // Round floating point inaccuracies (e.g. 0.1 + 0.2)
  return Math.round(result * 100000000) / 100000000;
}
