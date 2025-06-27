import { db } from '../firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

class EstoqueView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .item {
          padding: 15px;
          border-radius: 8px;
          color: white;
          font-weight: bold;
          width: 30%;
          text-align: center;
        }
        .tradicional { background-color: #722F37; }
        .defumado { background-color: #FFD700; color: #333; }
        .recheado { background-color: #1E90FF; }
        .disponivel { opacity: 1; position: relative; }
        .esgotado { opacity: 0.6; position: relative; }
        .esgotado::after {
          content: "ESGOTADO";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          font-size: 1.2em;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 2px #000;
          transform: translateY(-50%);
        }
        .view-wrapper{
          display: flex;
          margin-bottom:50px;
        }
      </style>
      <div class="view-wrapper">
        <div class="item tradicional disponivel" id="tradicional">
          <h2>Tradicional</h2>
          <p id="contador-tradicional">--/-- disponíveis</p>
        </div>
        <div class="item defumado disponivel" id="defumado">
          <h2>Defumado</h2>
          <p id="contador-defumado">--/-- disponíveis</p>
        </div>
        <div class="item recheado disponivel" id="recheado">
          <h2>Recheado</h2>
          <p id="contador-recheado">--/-- disponíveis</p>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this._carregarDados();
  }

  _carregarDados() {
    const hoje = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Referências no Firebase
    const estoqueRef = ref(db, 'estoque');
    const vendasRef = ref(db, 'vendas');

    // Armazenar os dados do estoque inicial
    let estoqueInicial = {
      tradicional: { max: 0, disponivel: 0, data: null },
      defumado: { max: 0, disponivel: 0, data: null },
      recheado: { max: 0, disponivel: 0, data: null }
    };

    // Escuta estoque (para pegar dados mais recentes)
    onValue(estoqueRef, (snapshot) => {
      const config = snapshot.val();
      if (!config) return;

      estoqueInicial = config;

      this._atualizarEstoque(estoqueInicial, []); // ainda não tem vendas, mostra só estoque

      // Depois que o estoque carregar, escuta vendas
      onValue(vendasRef, (snapVendas) => {
        const vendasHoje = [];

        snapVendas.forEach(childSnap => {
          const venda = childSnap.val();
          if (venda.data && venda.data.slice(0, 10) === hoje) {
            vendasHoje.push(venda);
          }
        });

        this._atualizarEstoque(estoqueInicial, vendasHoje);
      });
    });
  }

  _atualizarEstoque(estoque, vendasHoje) {
    // Inicialmente, disponível = estoque.inicial.disponivel
    const estoqueAtual = {
      tradicional: estoque.tradicional.disponivel,
      defumado: estoque.defumado.disponivel,
      recheado: estoque.recheado.disponivel,
    };

    // Subtrair vendas feitas hoje (contar por tipo)
    vendasHoje.forEach(venda => {
      if (estoqueAtual[venda.tipo] !== undefined) {
        estoqueAtual[venda.tipo] -= 1; // assumindo 1 unidade por venda
      }
    });

    // Atualizar a interface com valores e estado
    ['tradicional', 'defumado', 'recheado'].forEach(tipo => {
      const max = estoque[tipo].max;
      const disponivel = estoqueAtual[tipo] < 0 ? 0 : estoqueAtual[tipo];

      const container = this.shadowRoot.getElementById(tipo);
      const contador = this.shadowRoot.getElementById(`contador-${tipo}`);

      contador.textContent = `${disponivel}/${max} disponíveis`;

      if (disponivel <= 0) {
        container.classList.remove('disponivel');
        container.classList.add('esgotado');
      } else {
        container.classList.remove('esgotado');
        container.classList.add('disponivel');
      }
    });
  }
}

customElements.define('estoque-view', EstoqueView);
