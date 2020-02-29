function factorial(n) {
  if (n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

for (let i = 1; i < 9; i++) {
  document.write(`${i}! = ${factorial(i)} \u{1F63F} <br />`);
}
