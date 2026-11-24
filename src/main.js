import './styles.css';
import { appView } from './app.js';

const root = document.querySelector('#app');

if (!root) {
  throw new Error('App root was not found');
}

root.innerHTML = appView();

