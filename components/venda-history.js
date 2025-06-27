import { db } from '../firebase-config.js';
import { ref, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";


class VendaHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
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
      </style>

      <h2>Histórico de Vendas</h2>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Contato</th>
            <th>Endereço</th>
            <th>Modalidade</th>
            <th>Pagamento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="vendas-tbody">
        </tbody>
      </table>
    `;
  }

  connectedCallback() {
    const vendasRef = ref(db, 'vendas');
    onValue(vendasRef, snapshot => {
      const tbody = this.shadowRoot.getElementById('vendas-tbody');
      tbody.innerHTML = '';

      snapshot.forEach(childSnapshot => {
        const venda = childSnapshot.val();
        const key = childSnapshot.key;

        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td>${venda.tipo || ''}</td>
          <td>${venda.cliente || ''}</td>
          <td>${venda.contato || ''}</td>
          <td>${venda.endereco || ''}</td>
          <td>${venda.modalidade || ''}</td>
          <td><span class="${venda.pago ? 'pago' : 'receber'}">${venda.pago ? 'PAGO' : 'À RECEBER'}</span></td>
          <td>
              ${venda.pago
                ? '<button class="btn-excluir" data-key="' + key + '">Excluir</button>'
                : `<button class="btn-pagar" data-key="${key}">Marcar como Pago</button>
                   <button class="btn-excluir" data-key="${key}">Excluir</button>`}
            </td>

        `;

        tbody.appendChild(tr);
      });

      // Adiciona listeners para excluir
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
            if(confirm('Confirma marcar esta venda como PAGO?')) {
              try {
                await update(ref(db, `vendas/${key}`), { pago: true });
              } catch(err) {
                alert('Erro ao atualizar pagamento: ' + err.message);
              }
            }
          });
        });
    });
  }
}

customElements.define('venda-history', VendaHistory);
