import { db } from '../firebase-config.js';
import { ref, onValue, remove, update, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

class VendaHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        /* ... (estilos existentes) ... */
        .filters {
          margin-bottom: 10px;
        }
        .filters button {
          margin-right: 10px;
          padding: 6px 12px;
          border: none;
          background-color: #1E90FF;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .filters button.active {
          background-color: #333;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .entregue {
          background-color: #0A3876;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .nao_entregue {
          background-color: #f44336;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .pago {
          background-color: #4CAF50;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .receber {
          background-color: #f44336;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        button.btn-excluir {
          background-color: #e53935;
          color: white;
          border: none;
          padding: 5px 8px;
          cursor: pointer;
          border-radius: 4px;
        }
        button.btn-pagar {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 5px 8px;
          cursor: pointer;
          border-radius: 4px;
        }
        button.btn-entregar {
          background-color:#340746;
          color: white;
          border: none;
          padding: 5px 8px;
          cursor: pointer;
          border-radius: 4px;
        }
      </style>

      <h2>Histórico de Vendas</h2>
      <div class="filters">
        <button id="btn-hoje" class="active">Hoje</button>
        <button id="btn-ontem">Ontem</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Contato</th>
            <th>Endereço</th>
            <th>Modalidade</th>
            <th>Entregue</th>
            <th>Pagamento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="vendas-tbody"></tbody>
      </table>
    `;
  }

  connectedCallback() {
    this.btnHoje = this.shadowRoot.getElementById('btn-hoje');
    this.btnOntem = this.shadowRoot.getElementById('btn-ontem');

    this.btnHoje.addEventListener('click', () => this.carregarVendas('hoje'));
    this.btnOntem.addEventListener('click', () => this.carregarVendas('ontem'));

    this.carregarVendas('hoje');
  }

  carregarVendas(dia) {
    const hoje = new Date();
    const dataSelecionada = new Date(hoje);

    if (dia === 'ontem') {
      dataSelecionada.setDate(dataSelecionada.getDate() - 1);
    }

    const dataFormatada = dataSelecionada.toISOString().split('T')[0]; // "YYYY-MM-DD"

    this.btnHoje.classList.toggle('active', dia === 'hoje');
    this.btnOntem.classList.toggle('active', dia === 'ontem');

    const vendasQuery = query(ref(db, 'vendas'), orderByChild('data'), equalTo(dataFormatada));

    onValue(vendasQuery, snapshot => {
      const tbody = this.shadowRoot.getElementById('vendas-tbody');
      tbody.innerHTML = '';

      if (!snapshot.exists()) {
        tbody.innerHTML = `<tr><td colspan="7">Nenhuma venda registrada em ${dataFormatada}.</td></tr>`;
        return;
      }

      snapshot.forEach(childSnapshot => {
        const venda = childSnapshot.val();
        const key = childSnapshot.key;

        const tr = document.createElement('tr');
        console.log(venda.entregue)
        tr.innerHTML = `
          <td style="${venda.tipo === 'tradicional' ? 'background-color: #722F37; color:#fff' : venda.tipo === 'defumado' ? 'background-color: #FFD700; color:#333' : 'background-color: #1E90FF; color:#fff'}">${venda.tipo || ''}</td>
          <td>${venda.cliente || ''}</td>
          <td>${venda.contato || ''}</td>
          <td>${venda.endereco || ''}</td>
          <td>${venda.modalidade || ''}</td>
          <td><span class="${venda.entregue === true ? 'entregue' : 'nao_entregue'}">${venda.entregue ? 'ENTREGUE' : 'NÃO ENTREGUE'}</span></td>
          <td><span class="${venda.pago ? 'pago' : 'receber'}">${venda.pago ? 'PAGO' : 'À RECEBER'}</span></td>
          <td>
            ${venda.pago
              ? (
                  venda.entregue
                    ? `<button class="btn-excluir" data-key="${key}">Excluir</button>`
                    : `
                      <button class="btn-entregar" data-key="${key}">Marcar Entrega</button>
                      <button class="btn-excluir" data-key="${key}">Excluir</button>
                    `
                )
              : `
                  <button class="btn-entregar" data-key="${key}">Marcar Entrega</button>
                  <button class="btn-pagar" data-key="${key}">Marcar como Pago</button>
                  <button class="btn-excluir" data-key="${key}">Excluir</button>
                `
            }
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Botões de ação
      this.shadowRoot.querySelectorAll('button.btn-entregar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const key = e.target.getAttribute('data-key');
          if(confirm('Confirma a entregue?')) {
            try{
              await update(ref(db, `vendas/${key}`), { entregue: true});
            } catch (err) {
              alert ('Erro ao marcar entrega: ' + err.message)
            }
          } 
        })
      })
      
      this.shadowRoot.querySelectorAll('button.btn-excluir').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const key = e.target.getAttribute('data-key');
          if (confirm('Confirma exclusão dessa venda?')) {
            await remove(ref(db, `vendas/${key}`));
          }
        });
      });

      this.shadowRoot.querySelectorAll('button.btn-pagar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const key = e.target.getAttribute('data-key');
          if (confirm('Confirma marcar esta venda como PAGO?')) {
            try {
              await update(ref(db, `vendas/${key}`), { pago: true });
            } catch (err) {
              alert('Erro ao atualizar pagamento: ' + err.message);
            }
          }
        });
      });
    });
  }
}

customElements.define('venda-history', VendaHistory);
