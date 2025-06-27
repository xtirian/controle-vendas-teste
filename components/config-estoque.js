import { db } from '../firebase-config.js';
import { ref, set, get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

class ConfigEstoque extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .config-estoque {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: white;
          margin-bottom: 20px;
        }
        .config-inputs {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .config-inputs div {
          flex: 1;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          box-sizing: border-box;
        }
        button {
          padding: 10px 15px;
          margin-right: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          color: white;
        }
        button.btn-aplicar {
          background-color: #4CAF50;
        }
        button.btn-cancelar {
          background-color: #f44336;
        }
      </style>

      <div class="config-estoque">
        <h2>Configuração de Estoque</h2>
        <p>Defina a quantidade máxima (até 80) e o estoque inicial para cada tipo de frango:</p>

        <div class="config-inputs">
          <div>
            <label for="max-tradicional">Máx. Tradicional:</label>
            <input type="number" id="max-tradicional" min="1" max="80" />
          </div>
          <div>
            <label for="inicial-tradicional">Inicial Tradicional:</label>
            <input type="number" id="inicial-tradicional" min="0" max="80" />
          </div>
        </div>

        <div class="config-inputs">
          <div>
            <label for="max-defumado">Máx. Defumado:</label>
            <input type="number" id="max-defumado" min="1" max="80" />
          </div>
          <div>
            <label for="inicial-defumado">Inicial Defumado:</label>
            <input type="number" id="inicial-defumado" min="0" max="80" />
          </div>
        </div>

        <div class="config-inputs">
          <div>
            <label for="max-recheado">Máx. Recheado:</label>
            <input type="number" id="max-recheado" min="1" max="80" />
          </div>
          <div>
            <label for="inicial-recheado">Inicial Recheado:</label>
            <input type="number" id="inicial-recheado" min="0" max="80" />
          </div>
        </div>

        <button class="btn-aplicar">Aplicar Configurações</button>
        <button class="btn-cancelar">Cancelar</button>
      </div>
    `;

    this._onAplicar = this._onAplicar.bind(this);
    this._onCancelar = this._onCancelar.bind(this);
  }

  connectedCallback() {
    this._loadConfig();

    this.shadowRoot.querySelector('.btn-aplicar').addEventListener('click', this._onAplicar);
    this.shadowRoot.querySelector('.btn-cancelar').addEventListener('click', this._onCancelar);
  }

  async _loadConfig() {
    const estoqueRef = ref(db, 'estoque');
    const snapshot = await get(estoqueRef);
    const config = snapshot.val() || {
      tradicional: { max: 30, disponivel: 30 },
      defumado: { max: 30, disponivel: 30 },
      recheado: { max: 30, disponivel: 30 }
    };

    this.shadowRoot.getElementById('max-tradicional').value = config.tradicional.max;
    this.shadowRoot.getElementById('inicial-tradicional').value = config.tradicional.disponivel;

    this.shadowRoot.getElementById('max-defumado').value = config.defumado.max;
    this.shadowRoot.getElementById('inicial-defumado').value = config.defumado.disponivel;

    this.shadowRoot.getElementById('max-recheado').value = config.recheado.max;
    this.shadowRoot.getElementById('inicial-recheado').value = config.recheado.disponivel;
  }

  async _onAplicar() {
    const maxTradicional = parseInt(this.shadowRoot.getElementById('max-tradicional').value);
    const inicialTradicional = parseInt(this.shadowRoot.getElementById('inicial-tradicional').value);

    const maxDefumado = parseInt(this.shadowRoot.getElementById('max-defumado').value);
    const inicialDefumado = parseInt(this.shadowRoot.getElementById('inicial-defumado').value);

    const maxRecheado = parseInt(this.shadowRoot.getElementById('max-recheado').value);
    const inicialRecheado = parseInt(this.shadowRoot.getElementById('inicial-recheado').value);

    // Validação simples
    if (
      maxTradicional < inicialTradicional ||
      maxDefumado < inicialDefumado ||
      maxRecheado < inicialRecheado
    ) {
      alert('O estoque inicial não pode ser maior que o máximo.');
      return;
    }

    try {
      await set(ref(db, 'estoque'), {
        tradicional: { max: maxTradicional, disponivel: inicialTradicional },
        defumado: { max: maxDefumado, disponivel: inicialDefumado },
        recheado: { max: maxRecheado, disponivel: inicialRecheado },
        data: new Date().toISOString(),
      });
      alert('Configurações aplicadas com sucesso!');
    } catch (err) {
      alert('Erro ao aplicar configurações: ' + err.message);
    }
  }

  _onCancelar() {
    this._loadConfig();
  }
}

customElements.define('config-estoque', ConfigEstoque);
