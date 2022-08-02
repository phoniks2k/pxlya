/*
 * Admintools
 */

import React, { useState, useEffect } from 'react';
import { t } from 'ttag';

async function submitIPAction(
  action,
  callback,
) {
  const data = new FormData();
  const iplist = document.getElementById('iparea').value;
  data.append('ip', iplist);
  data.append('ipaction', action);
  const resp = await fetch('./api/modtools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(await resp.text());
}

async function getModList(
  callback,
) {
  const data = new FormData();
  data.append('modlist', true);
  const resp = await fetch('./api/modtools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    callback(await resp.json());
  } else {
    callback([]);
  }
}

async function submitRemMod(
  userId,
  callback,
) {
  const data = new FormData();
  data.append('remmod', userId);
  const resp = await fetch('./api/modtools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(resp.ok, await resp.text());
}

async function submitMakeMod(
  userName,
  callback,
) {
  const data = new FormData();
  data.append('makemod', userName);
  const resp = await fetch('./api/modtools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    callback(await resp.json());
  } else {
    callback(await resp.text());
  }
}


function Admintools() {
  const [iPAction, selectIPAction] = useState('ban');
  const [modName, selectModName] = useState('');
  const [resp, setResp] = useState(null);
  const [modlist, setModList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getModList((mods) => setModList(mods));
  }, []);

  return (
    <div style={{ textAlign: 'center', paddingLeft: '5%', paddingRight: '5%' }}>
      {resp && (
        <div style={{
          borderStyle: 'solid',
          borderColor: '#D4D4D4',
          borderWidth: 2,
          padding: 5,
          display: 'inline-block',
        }}
        >
          {resp.split('\n').map((line) => (
            <p className="modaltext">
              {line}
            </p>
          ))}
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => setResp(null)}
          >
            {t`Close`}
          </span>
        </div>
      )}
      <div>
        <br />
        <h3 className="modaltitle">{t`IP Actions`}</h3>
        <p className="modalcotext">
          {t`Do stuff with IPs (one IP per line)`}
        </p>
        <select
          value={iPAction}
          onChange={(e) => {
            const sel = e.target;
            selectIPAction(sel.options[sel.selectedIndex].value);
          }}
        >
          {['ban', 'unban', 'whitelist', 'unwhitelist'].map((opt) => (
            <option
              value={opt}
            >
              {opt}
            </option>
          ))}
        </select>
        <br />
        <textarea rows="10" cols="17" id="iparea" /><br />
        <button
          type="button"
          onClick={() => {
            if (submitting) {
              return;
            }
            setSubmitting(true);
            submitIPAction(
              iPAction,
              (ret) => {
                setSubmitting(false);
                setResp(ret);
              },
            );
          }}
        >
          {(submitting) ? '...' : t`Submit`}
        </button>
        <br />
        <div className="modaldivider" />
        <h3 className="modaltitle">{t`Manage Moderators`}</h3>
        <p className="modalcotext">
          {t`Remove Moderator`}
        </p>
        {(modlist.length) ? (
          <span
            className="unblocklist"
          >
            {modlist.map((mod) => (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (submitting) {
                    return;
                  }
                  setSubmitting(true);
                  submitRemMod(mod[0], (success, ret) => {
                    if (success) {
                      setModList(
                        modlist.filter((modl) => (modl[0] !== mod[0])),
                      );
                    }
                    setSubmitting(false);
                    setResp(ret);
                  });
                }}
              >
                {`⦸ ${mod[0]} ${mod[1]}`}
              </div>
            ))}
          </span>
        )
          : (
            <p className="modaltext">{t`There are no mods`}</p>
          )}
        <br />

        <p className="modalcotext">
          {t`Assign new Mod`}
        </p>
        <p className="modalcotext">
          {t`Enter UserName of new Mod`}:&nbsp;
          <input
            value={modName}
            style={{
              display: 'inline-block',
              width: '100%',
              maxWidth: '20em',
            }}
            type="text"
            placeholder={t`User Name`}
            onChange={(evt) => {
              const co = evt.target.value.trim();
              selectModName(co);
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
            submitMakeMod(
              modName,
              (ret) => {
                if (typeof ret === 'string') {
                  setResp(ret);
                } else {
                  setResp(`Made ${ret[1]} mod successfully.`);
                  setModList([...modlist, ret]);
                }
                setSubmitting(false);
              },
            );
          }}
        >
          {(submitting) ? '...' : t`Submit`}
        </button>
        <br />
        <div className="modaldivider" />
        <br />
      </div>
    </div>
  );
}

export default React.memo(Admintools);
