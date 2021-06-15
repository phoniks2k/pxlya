
import MarkdownParser from '../../src/core/Markdown';
import { Parser } from 'commonmark';

document.addEventListener('DOMContentLoaded', () => {
  const reader = new Parser({smart: true});
  const a = new MarkdownParser();

  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const time = document.getElementById('time');

  input.addEventListener('input', () => {
    let startt = Date.now();
    const [arr] = a.parseText(input.value);
    time.innerHTML = Date.now() - startt  + 'ms';
    startt = Date.now();
    const parsed = reader.parse(input.value);
    time.innerHTML += ' / commonmark: ' + (Date.now() - startt)  + 'ms';
    console.log(parsed);
    output.value = JSON.stringify(arr, null, 2);
  });
});

