// Exact power of a one-sided Fisher exact test (protocol §5), found by
// enumerating every possible outcome of two arms of n runs.
// Run: node research/power.mjs
const logFactorial = [0];
for (let i = 1; i <= 200; i++) logFactorial[i] = logFactorial[i - 1] + Math.log(i);
const choose = (n, k) => Math.exp(logFactorial[n] - logFactorial[k] - logFactorial[n - k]);

// P(X >= a) under the null, where X is the violation count in the no-prompt arm.
export function fisherOneSidedP(noPromptViolations, n1, kitViolations, n2) {
  const total = noPromptViolations + kitViolations;
  let p = 0;
  for (let x = noPromptViolations; x <= Math.min(n1, total); x++) {
    p += (choose(n1, x) * choose(n2, total - x)) / choose(n1 + n2, total);
  }
  return p;
}

function power(n, noPromptRate, kitRate, alpha) {
  let result = 0;
  for (let a = 0; a <= n; a++) {
    for (let b = 0; b <= n; b++) {
      const probability =
        choose(n, a) * noPromptRate ** a * (1 - noPromptRate) ** (n - a) *
        choose(n, b) * kitRate ** b * (1 - kitRate) ** (n - b);
      if (fisherOneSidedP(a, n, b, n) <= alpha) result += probability;
    }
  }
  return result;
}

if (process.argv[1]?.endsWith("power.mjs")) {
  const n = 10;
  const alpha = 0.05;
  console.log(`n=${n} per arm, one-sided Fisher exact, alpha=${alpha}`);
  for (const [a, b] of [[0.9, 0.1], [0.8, 0.1], [0.7, 0.1], [0.6, 0.1], [0.5, 0.1], [0.5, 0.2]]) {
    console.log(`  ${a} -> ${b}: power ${power(n, a, b, alpha).toFixed(2)}`);
  }
  console.log(`  e.g. 9/10 vs 1/10: p=${fisherOneSidedP(9, 10, 1, 10).toFixed(4)}; 6/10 vs 1/10: p=${fisherOneSidedP(6, 10, 1, 10).toFixed(4)}`);
}
