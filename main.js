import './firebase-config.js';
import './components/estoque-view.js';
import './components/config-estoque.js'
import './components/venda-form.js'
import './components/venda-history.js'

document.getElementById('toggle-config').addEventListener('click', () => {
  const config = document.querySelector('config-estoque');
  config.classList.toggle('hidden');
});

document.getElementById('toggle-venda').addEventListener('click', () => {
  const config = document.querySelector('venda-form');
  config.classList.toggle('hidden');
});
