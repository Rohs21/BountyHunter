import React from 'react';
import ReactDOM from 'react-dom/client';
// Monkey-patch fetch to fix RPC payload shape for soroban-futurenet in-dev
// This converts positional params for specific methods into named params
// to avoid server errors like: "cannot unmarshal array into Go value of type protocol.GetLedgerEntriesRequest"
if (typeof window !== 'undefined' && window.fetch) {
  const _origFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : (input && input.url) ? input.url : '';
      if (typeof url === 'string' && url.includes('soroban-futurenet.stellar.org') && init && init.body) {
        try {
          const parsed = JSON.parse(init.body.toString());
          if (parsed && parsed.jsonrpc && parsed.method) {
            // Fix getLedgerEntries positional params -> named { keys: [...] }
            if (parsed.method === 'getLedgerEntries' && Array.isArray(parsed.params)) {
              // If params is [[...]] convert to { keys: [...] }
              if (parsed.params.length === 1 && Array.isArray(parsed.params[0])) {
                parsed.params = { keys: parsed.params[0] };
                init = { ...init, body: JSON.stringify(parsed) };
                // console.debug('fetch-wrapper: converted getLedgerEntries params to named form');
              }
            }
          }
        } catch (e) {
          // ignore JSON parse errors and continue
        }
      }
    } catch (e) {
      // ignore
    }

    return _origFetch(input, init);
  };
}
// Also patch XMLHttpRequest.send so axios (which uses XHR) will be covered in the browser.
if (typeof window !== 'undefined' && window.XMLHttpRequest) {
  (function() {
    const XHR = window.XMLHttpRequest;
    const origSend = XHR.prototype.send;

    XHR.prototype.send = function(body) {
      try {
        // body may be string or FormData; we only care about JSON strings
        if (typeof body === 'string') {
          const url = this._url || this.responseURL || '';
          // some libs set this._url when opening — try to read it
          // If not present, we can't reliably check host, so attempt best-effort parse
          let parsedUrl = url || '';
          // Only attempt to modify calls to soroban-futurenet
          if (parsedUrl.includes('soroban-futurenet.stellar.org') || body.includes('getLedgerEntries')) {
            try {
              const json = JSON.parse(body);
              if (json && json.method === 'getLedgerEntries' && Array.isArray(json.params)) {
                if (json.params.length === 1 && Array.isArray(json.params[0])) {
                  json.params = { keys: json.params[0] };
                  body = JSON.stringify(json);
                }
              }
            } catch (e) {
              // ignore malformed JSON
            }
          }
        }
      } catch (e) {
        // ignore
      }

      return origSend.call(this, body);
    };

    const origOpen = XHR.prototype.open;
    XHR.prototype.open = function(method, url) {
      try {
        this._url = url;
      } catch (e) {
        // ignore
      }
      return origOpen.apply(this, arguments);
    };
  })();
}
import { LocationProvider } from '@reach/router';
import { GlobalProvider } from './contexts/GlobalContext';
import { ReduxContext } from './contexts/ReduxContext';
import { WalletProvider } from './contexts/WalletContext';
import { ContractProvider } from './contexts/ContractContext';
import App from './App.jsx';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap/dist/js/bootstrap.js';
import './index.css';
import './style.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <LocationProvider>
    <GlobalProvider>
      <ReduxContext>
        <WalletProvider>
          <ContractProvider>
            <React.StrictMode>
              <App />
            </React.StrictMode>
          </ContractProvider>
        </WalletProvider>
      </ReduxContext>
    </GlobalProvider>    
  </LocationProvider>
);
