/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';
import "./index.css"

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

const start = async () => {
  while (true) {
    if (window.outerWidth != 0 && window.outerWidth != 0) {
      break;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  render(() => <App />, root!);
}

start()
