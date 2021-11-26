import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Parser } from 'commonmark';

import MarkdownParser from '../../src/core/MarkdownParser';

import Markdown from './Markdown';

const reader = new Parser({ smart: true });
const a = new MarkdownParser();

function parseText(text, setDuration, setCmDuration, setMd) {
  let startt = Date.now();
  const arr = a.parse(text);
  setDuration(Date.now() - startt);
  startt = Date.now();
  reader.parse(text);
  setCmDuration(Date.now() - startt);
  setMd(arr);
}

const App = () => {
  const [md, setMd] = useState([]);
  const [duration, setDuration] = useState('');
  const [cmDuration, setCmDuration] = useState('');

  return (
    <div>
      <textarea
        cols="100"
        rows="30"
        onChange={(evt) => {
          parseText(evt.target.value, setDuration, setCmDuration, setMd);
        }}
      />
      <p>Parse-time: {duration}ms / commonmark: {cmDuration}</p>
      <Markdown mdArray={md} />
      <textarea
        cols="100"
        rows="30"
        readOnly
        value={JSON.stringify(md, null, 2)}
      />
    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<App />, document.getElementById('reactroot'));
});

