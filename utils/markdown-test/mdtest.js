import React from 'react';
import ReactDOM from 'react-dom';

import MarkdownParser from '../../src/core/Markdown';
import { Parser } from 'commonmark';

const reader = new Parser({smart: true});
const a = new MarkdownParser();

function parseText(text, setDuration, setCmDuration) {
  let startt = Date.now();
  const [arr] = a.parseText(text);
  setDuration(Date.now() - startt);
  startt = Date.now();
  const parsed = reader.parse(input.value);
  setCmDuration(Date.now() - startt);
  return JSON.stringify(arr, null, 2);
}

const App = () => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState('');
  const [cmDuration, setCmDuration] = useState('');

  return (
    <div>
      <textarea
        cols="100"
        rows="30"
        onChange={(evt) => setText(evt.target.value)}
      />
      <p>Parse-time: {duration}ms / commonmark: {cmDuration}</p>
      <textarea
        cols="100"
        rows="30"
        value={parseText(text, setDuration, setCmDuration)}
      />
    </div>
  )
};

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(App, document.getElementById('reactroot'));
});

