/*
 * Admintools
 */

import React, { useState } from 'react';
import { t } from 'ttag';

async function submitIIDAction(
  action,
  iid,
  callback,
) {
  const data = new FormData();
  data.append('iidaction', action);
  data.append('iid', iid);
  const resp = await fetch('./api/modtools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(await resp.text());
}

function ModIIDtools() {
  const [iIDAction, selectIIDAction] = useState('ban');
  const [iid, selectIid] = useState('');
  const [resp, setResp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div style={{ textAlign: 'center', paddingLeft: '5%', paddingRight: '5%' }}>
      <h3 className="modaltitle">{t`IID Actions`}</h3>
      <select
        value={iIDAction}
        onChange={(e) => {
          const sel = e.target;
          selectIIDAction(sel.options[sel.selectedIndex].value);
        }}
      >
        {['givecaptcha']
          .map((opt) => (
            <option
              value={opt}
            >
              {opt}
            </option>
          ))}
      </select>
      <p className="modalcotext">
        {' IID: '}
        <input
          value={iid}
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '10em',
          }}
          type="text"
          placeholder="xxxx-xxxxx-xxxx"
          onChange={(evt) => {
            const newIid = evt.target.value.trim();
            selectIid(newIid);
          }}
        />
      </p>
      <button
        type="button"
        onClick={() => {
          if (submitting) {
            return;
          }
          setSubmitting(true);
          submitIIDAction(
            iIDAction,
            iid,
            (ret) => {
              setSubmitting(false);
              setResp(ret);
            },
          );
        }}
      >
        {(submitting) ? '...' : t`Submit`}
      </button>
      <textarea
        rows="10"
        cols="20"
        id="iparea"
        value={resp}
        readOnly
      />
    </div>
  );
}

export default React.memo(ModIIDtools);
