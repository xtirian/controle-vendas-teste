import { db } from '../firebase-config.js'; 
import { ref, push, get, child } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

class VendaForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        button.tab {
          padding: 8px 15px;
          margin-right: 5px;
          cursor: pointer;
          border: 1px solid #ccc;
          background: #eee;
          border-radius: 4px 4px 0 0;
          font-weight: bold;
        }
        button.tab.active {
          background: white;
          border-bottom: 1px solid white;
        }
        form {
          border: 1px solid #ccc;
          padding: 15px;
          background: white;
          border-radius: 0 4px 4px 4px;
        }
        form > div {
          margin-bottom: 10px;
        }
        label {
          display: block;
          margin-bottom: 3px;
          font-weight: 600;
        }
        input, select {
          width: 100%;
          padding: 6px;
          box-sizing: border-box;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        button.submit {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 15px;
          cursor: pointer;
          border-radius: 4px;
          font-weight: bold;
        }
        button.submit:hover {
          background-color: #45a049;
        }
      </style>

      <div>
        <button class="tab active" id="tab-encomenda">Encomenda</button>
        <button class="tab" id="tab-retirada">Retirada</button>
      </div>

      <form id="form-encomenda">
        <div>
          <label for="tipo-encomenda">Tipo de Frango:</label>
          <select id="tipo-encomenda">
            <option value="tradicional">Tradicional</option>
            <option value="defumado">Defumado</option>
            <option value="recheado">Recheado</option>
          </select>
        </div>
        <div>
          <label for="nome-encomenda">Nome Completo:</label>
          <input type="text" id="nome-encomenda" required />
        </div>
        <div>
          <label for="telefone-encomenda">Telefone:</label>
          <input type="tel" id="telefone-encomenda" required />
        </div>
        <div>
          <label for="endereco-encomenda">Endereço:</label>
          <input type="text" id="endereco-encomenda" required />
        </div>
        <div>
          <label for="pago-encomenda">Status de Pagamento:</label>
          <select id="pago-encomenda">
            <option value="false">À RECEBER</option>
            <option value="true">PAGO</option>
          </select>
        </div>
        <button type="submit" class="submit">Registrar Encomenda</button>
      </form>

      <form id="form-retirada" style="display:none;">
        <div>
          <label for="tipo-retirada">Tipo de Frango:</label>
          <select id="tipo-retirada">
            <option value="tradicional">Tradicional</option>
            <option value="defumado">Defumado</option>
            <option value="recheado">Recheado</option>
          </select>
        </div>
        <div>
          <label for="nome-retirada">Nome:</label>
          <input type="text" id="nome-retirada" required />
        </div>
        <div>
          <label for="sobrenome-retirada">Sobrenome:</label>
          <input type="text" id="sobrenome-retirada" required />
        </div>
        <button type="submit" class="submit">Registrar Retirada</button>
      </form>
    `;

    this._handleTabClick = this._handleTabClick.bind(this);
    this._handleSubmitEncomenda = this._handleSubmitEncomenda.bind(this);
    this._handleSubmitRetirada = this._handleSubmitRetirada.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.getElementById('tab-encomenda').addEventListener('click', this._handleTabClick);
    this.shadowRoot.getElementById('tab-retirada').addEventListener('click', this._handleTabClick);

    this.shadowRoot.getElementById('form-encomenda').addEventListener('submit', this._handleSubmitEncomenda);
    this.shadowRoot.getElementById('form-retirada').addEventListener('submit', this._handleSubmitRetirada);
  }

  _handleTabClick(e) {
    const tabEncomenda = this.shadowRoot.getElementById('tab-encomenda');
    const tabRetirada = this.shadowRoot.getElementById('tab-retirada');
    const formEncomenda = this.shadowRoot.getElementById('form-encomenda');
    const formRetirada = this.shadowRoot.getElementById('form-retirada');

    if (e.target.id === 'tab-encomenda') {
      tabEncomenda.classList.add('active');
      tabRetirada.classList.remove('active');
      formEncomenda.style.display = 'block';
      formRetirada.style.display = 'none';
    } else {
      tabEncomenda.classList.remove('active');
      tabRetirada.classList.add('active');
      formEncomenda.style.display = 'none';
      formRetirada.style.display = 'block';
    }
  }

  async _verificarEstoqueDisponivel(tipo) {
    const hoje = new Date().toISOString().slice(0, 10);
    const estoqueSnap = await get(child(ref(db), 'estoque'));
    const vendasSnap = await get(child(ref(db), 'vendas'));

    if (!estoqueSnap.exists()) return false;

    const estoque = estoqueSnap.val();
    const disponivelInicial = estoque[tipo]?.disponivel ?? 0;

    // Contar vendas do mesmo tipo e mesmo dia
    let totalVendasHoje = 0;
    if (vendasSnap.exists()) {
      const vendas = vendasSnap.val();
      for (const id in vendas) {
        const venda = vendas[id];
        if (venda.tipo === tipo && venda.data?.slice(0, 10) === hoje) {
          totalVendasHoje++;
        }
      }
    }

    return (disponivelInicial - totalVendasHoje) > 0;
  }

  async _handleSubmitEncomenda(event) {
    event.preventDefault();

    const tipo = this.shadowRoot.getElementById('tipo-encomenda').value;
    const estoqueOk = await this._verificarEstoqueDisponivel(tipo);

    if (!estoqueOk) {
      alert(`Estoque de ${tipo.toUpperCase()} esgotado!`);
      return;
    }

    const venda = {
      tipo,
      cliente: this.shadowRoot.getElementById('nome-encomenda').value,
      contato: this.shadowRoot.getElementById('telefone-encomenda').value,
      endereco: this.shadowRoot.getElementById('endereco-encomenda').value,
      modalidade: 'Encomenda',
      pago: this.shadowRoot.getElementById('pago-encomenda').value === 'true',
      data: new Date().toISOString().split('T')[0]
    };

    try {
      await push(ref(db, 'vendas'), venda);
      this.shadowRoot.getElementById('form-encomenda').reset();
      alert('Encomenda registrada com sucesso!');
    } catch (err) {
      alert('Erro ao registrar encomenda: ' + err.message);
    }
  }

  async _handleSubmitRetirada(event) {
    event.preventDefault();

    const tipo = this.shadowRoot.getElementById('tipo-retirada').value;
    const estoqueOk = await this._verificarEstoqueDisponivel(tipo);

    if (!estoqueOk) {
      alert(`Estoque de ${tipo.toUpperCase()} esgotado!`);
      return;
    }

    const venda = {
      tipo,
      cliente: this.shadowRoot.getElementById('nome-retirada').value + ' ' +
               this.shadowRoot.getElementById('sobrenome-retirada').value,
      contato: '',
      endereco: '',
      modalidade: 'Retirada',
      pago: true,
      data: new Date().toISOString().split('T')[0]
    };

    try {
      await push(ref(db, 'vendas'), venda);
      this.shadowRoot.getElementById('form-retirada').reset();
      alert('Retirada registrada com sucesso!');
    } catch (err) {
      alert('Erro ao registrar retirada: ' + err.message);
    }
  }
}

customElements.define('venda-form', VendaForm);
