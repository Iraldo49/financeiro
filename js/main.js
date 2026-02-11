 // Default configuration
    const defaultConfig = {
      business_name: 'Controle Financeiro',
      currency_symbol: 'MT',
      background_color: '#0f172a',
      surface_color: '#1e293b',
      text_color: '#f8fafc',
      primary_action_color: '#f97316',
      secondary_action_color: '#64748b'
    };

    let config = { ...defaultConfig };
    let allTransactions = [];
    let pendingDeleteId = null;
    let isLoading = false;

    // Mobile sidebar toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebarOverlay.classList.toggle('hidden');
    });

    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
      });
    });

    // Format currency
    function formatCurrency(value, symbol) {
      return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol || config.currency_symbol}`;
    }

    // Generate unique ID
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Show toast notification
    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white text-sm`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // Get sales for a sector on a specific date
    function getSalesForDate(sector, date) {
      const dateStr = date.toDateString();
      return allTransactions
        .filter(t => 
          t.sector === sector && 
          t.type === 'venda' && 
          new Date(t.created_at).toDateString() === dateStr
        )
        .reduce((sum, t) => sum + t.amount, 0);
    }

    // Get purchases for a sector on a specific date
    function getPurchasesForDate(sector, date) {
      const dateStr = date.toDateString();
      return allTransactions
        .filter(t => 
          (t.sector === sector || (sector === 'bar' && t.wallet === 'bar')) && 
          t.type === 'compra' && 
          new Date(t.created_at).toDateString() === dateStr
        )
        .reduce((sum, t) => sum + t.amount, 0);
    }

    // Calculate all totals
    function calculateTotals() {
      const today = new Date().toDateString();
      
      const barInitial = allTransactions.filter(t => t.sector === 'bar' && t.type === 'saldo_inicial').reduce((sum, t) => sum + t.amount, 0);
      const barSales = allTransactions.filter(t => t.sector === 'bar' && t.type === 'venda').reduce((sum, t) => sum + t.amount, 0);
      const barTotal = barInitial + barSales;

      const fastfoodInitial = allTransactions.filter(t => t.sector === 'fastfood' && t.type === 'saldo_inicial').reduce((sum, t) => sum + t.amount, 0);
      const fastfoodSales = allTransactions.filter(t => t.sector === 'fastfood' && t.type === 'venda').reduce((sum, t) => sum + t.amount, 0);
      const fastfoodTotal = fastfoodInitial + fastfoodSales;

      const mpesaFisico = allTransactions.filter(t => t.wallet === 'mpesa' && t.payment_type === 'fisico').reduce((sum, t) => sum + t.amount, 0);
      const mpesaEletronico = allTransactions.filter(t => t.wallet === 'mpesa' && t.payment_type === 'eletronico').reduce((sum, t) => sum + t.amount, 0);
      const mpesaTotal = mpesaFisico + mpesaEletronico;

      const emolaFisico = allTransactions.filter(t => t.wallet === 'emola' && t.payment_type === 'fisico').reduce((sum, t) => sum + t.amount, 0);
      const emolaEletronico = allTransactions.filter(t => t.wallet === 'emola' && t.payment_type === 'eletronico').reduce((sum, t) => sum + t.amount, 0);
      const emolaTotal = emolaFisico + emolaEletronico;

      const caixaConsolidado = barTotal + fastfoodTotal;
      const carteirasTotal = mpesaTotal + emolaTotal;
      const totalGeral = caixaConsolidado + carteirasTotal;

      const comprasHoje = allTransactions
        .filter(t => t.type === 'compra' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0);

      const vendasHoje = allTransactions
        .filter(t => t.type === 'venda' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0);

      const lucroLiquido = vendasHoje - comprasHoje;

      return {
        barInitial, barSales, barTotal,
        fastfoodInitial, fastfoodSales, fastfoodTotal,
        mpesaFisico, mpesaEletronico, mpesaTotal,
        emolaFisico, emolaEletronico, emolaTotal,
        caixaConsolidado, carteirasTotal, totalGeral,
        comprasHoje, vendasHoje, lucroLiquido
      };
    }

    // Update dashboard
    function updateDashboard() {
      const totals = calculateTotals();

      document.getElementById('total-geral').textContent = formatCurrency(totals.totalGeral);
      document.getElementById('caixa-consolidado').textContent = formatCurrency(totals.caixaConsolidado);
      document.getElementById('compras-hoje').textContent = formatCurrency(totals.comprasHoje);
      document.getElementById('lucro-liquido').textContent = formatCurrency(totals.lucroLiquido);

      document.getElementById('bar-total').textContent = formatCurrency(totals.barTotal);
      document.getElementById('bar-inicial').textContent = formatCurrency(totals.barInitial, '');
      document.getElementById('bar-vendas').textContent = formatCurrency(totals.barSales, '');
      document.getElementById('bar-final').textContent = formatCurrency(totals.barTotal, '');

      document.getElementById('fastfood-total').textContent = formatCurrency(totals.fastfoodTotal);
      document.getElementById('fastfood-inicial').textContent = formatCurrency(totals.fastfoodInitial, '');
      document.getElementById('fastfood-vendas').textContent = formatCurrency(totals.fastfoodSales, '');
      document.getElementById('fastfood-final').textContent = formatCurrency(totals.fastfoodTotal, '');

      document.getElementById('mpesa-total').textContent = formatCurrency(totals.mpesaTotal);
      document.getElementById('mpesa-fisico').textContent = formatCurrency(totals.mpesaFisico, '');
      document.getElementById('mpesa-eletronico').textContent = formatCurrency(totals.mpesaEletronico, '');

      document.getElementById('emola-total').textContent = formatCurrency(totals.emolaTotal);
      document.getElementById('emola-fisico').textContent = formatCurrency(totals.emolaFisico, '');
      document.getElementById('emola-eletronico').textContent = formatCurrency(totals.emolaEletronico, '');
    }

    // Update comparison view
    function updateComparison() {
      const barContainer = document.getElementById('bar-comparison');
      const fastfoodContainer = document.getElementById('fastfood-comparison');

      let barHTML = '';
      let fastfoodHTML = '';

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('pt-BR');
        
        const barSales = getSalesForDate('bar', date);
        const barPurchases = getPurchasesForDate('bar', date);
        const barProfit = barSales - barPurchases;

        const ffSales = getSalesForDate('fastfood', date);
        const ffPurchases = getPurchasesForDate('fastfood', date);
        const ffProfit = ffSales - ffPurchases;

        const barColor = barProfit > 0 ? 'text-emerald-400' : barProfit < 0 ? 'text-red-400' : 'text-slate-400';
        const ffColor = ffProfit > 0 ? 'text-emerald-400' : ffProfit < 0 ? 'text-red-400' : 'text-slate-400';

        barHTML += `
          <div class="bg-slate-600/50 rounded-lg p-3">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium">${dateStr}</span>
              <span class="${barColor} font-bold">${formatCurrency(barProfit)}</span>
            </div>
            <div class="text-xs text-slate-400 grid grid-cols-2 gap-2">
              <div>Vendas: <span class="text-white">${formatCurrency(barSales, '')}</span></div>
              <div>Compras: <span class="text-red-400">${formatCurrency(barPurchases, '')}</span></div>
            </div>
          </div>
        `;

        fastfoodHTML += `
          <div class="bg-slate-600/50 rounded-lg p-3">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium">${dateStr}</span>
              <span class="${ffColor} font-bold">${formatCurrency(ffProfit)}</span>
            </div>
            <div class="text-xs text-slate-400 grid grid-cols-2 gap-2">
              <div>Vendas: <span class="text-white">${formatCurrency(ffSales, '')}</span></div>
              <div>Compras: <span class="text-red-400">${formatCurrency(ffPurchases, '')}</span></div>
            </div>
          </div>
        `;
      }

      barContainer.innerHTML = barHTML || '<p class="text-slate-400 text-center py-4">Sem dados</p>';
      fastfoodContainer.innerHTML = fastfoodHTML || '<p class="text-slate-400 text-center py-4">Sem dados</p>';
    }

    // Render transactions list
    function renderTransactions() {
      const container = document.getElementById('transactions-list');
      const filter = document.getElementById('filter-type').value;

      let filtered = allTransactions;
      if (filter === 'venda') {
        filtered = allTransactions.filter(t => t.type === 'venda');
      } else if (filter === 'compra') {
        filtered = allTransactions.filter(t => t.type === 'compra');
      } else if (filter === 'carteira') {
        filtered = allTransactions.filter(t => t.wallet);
      }

      if (filtered.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">Nenhuma transação registrada</p>';
        return;
      }

      const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      container.innerHTML = sorted.map(t => {
        const date = new Date(t.created_at);
        const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let icon, label, colorClass;
        if (t.type === 'venda') {
          if (t.sector === 'bar') {
            icon = '🍺'; label = 'Venda - Bar'; colorClass = 'text-amber-400';
          } else {
            icon = '🍔'; label = 'Venda - Fast Food'; colorClass = 'text-orange-400';
          }
        } else if (t.type === 'compra') {
          if (t.sector === 'bar') {
            icon = '🛒'; label = 'Compra - Bar'; colorClass = 'text-red-400';
          } else {
            icon = '🛒'; label = 'Compra - Fast Food'; colorClass = 'text-red-400';
          }
        } else if (t.wallet === 'mpesa') {
          icon = '📲'; label = 'M-Pesa'; colorClass = 'text-red-400';
        } else {
          icon = '📲'; label = 'E-mola'; colorClass = 'text-orange-400';
        }

        return `
          <div class="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-3 animate-slide" data-id="${t.__backendId}">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xl flex-shrink-0">${icon}</span>
              <div class="min-w-0">
                <p class="font-medium ${colorClass} truncate">${label}</p>
                <p class="text-xs text-slate-400 truncate">${t.description || 'Sem descrição'} • ${dateStr}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="font-bold ${t.type === 'compra' ? 'text-red-400' : 'text-emerald-400'}">${t.type === 'compra' ? '-' : '+'}${formatCurrency(t.amount)}</span>
              <button class="delete-btn text-slate-400 hover:text-red-400 p-1 transition-colors" data-id="${t.__backendId}">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          pendingDeleteId = btn.dataset.id;
          document.getElementById('delete-modal').classList.remove('hidden');
          document.getElementById('delete-modal').classList.add('flex');
        });
      });
    }

    // Handle form submission
    async function handleFormSubmit(e, sector = null, wallet = null, transactionType = null) {
      e.preventDefault();
      if (isLoading) return;

      const form = e.target;
      const formData = new FormData(form);
      const amount = parseFloat(formData.get('amount'));

      if (isNaN(amount) || amount < 0) {
        showToast('Por favor, insira um valor válido (não negativo)', 'error');
        return;
      }

      if (allTransactions.length >= 999) {
        showToast('Limite de 999 transações atingido. Delete algumas para continuar.', 'error');
        return;
      }

      isLoading = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Salvando...';
      submitBtn.disabled = true;

      const transaction = {
        id: generateId(),
        type: transactionType || formData.get('type') || 'carteira',
        sector: sector || '',
        wallet: wallet || '',
        amount: amount,
        payment_type: formData.get('payment_type') || '',
        description: formData.get('description') || '',
        transaction_type: transactionType || 'venda',
        created_at: new Date().toISOString()
      };

      const result = await window.dataSdk.create(transaction);

      if (result.isOk) {
        showToast('Transação registrada com sucesso!');
        form.reset();
      } else {
        showToast('Erro ao salvar transação', 'error');
      }

      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isLoading = false;
    }

    // Delete transaction
    async function deleteTransaction(id) {
      const transaction = allTransactions.find(t => t.__backendId === id);
      if (!transaction) return;

      isLoading = true;
      const confirmBtn = document.getElementById('confirm-delete');
      confirmBtn.textContent = '⏳ Excluindo...';
      confirmBtn.disabled = true;

      const result = await window.dataSdk.delete(transaction);

      if (result.isOk) {
        showToast('Transação excluída!');
      } else {
        showToast('Erro ao excluir transação', 'error');
      }

      confirmBtn.textContent = 'Excluir';
      confirmBtn.disabled = false;
      isLoading = false;
      closeModals();
    }

    // Clear all transactions
    async function clearAllTransactions() {
      if (allTransactions.length === 0) {
        showToast('Não há transações para excluir', 'info');
        closeModals();
        return;
      }

      isLoading = true;
      const confirmBtn = document.getElementById('confirm-clear');
      confirmBtn.textContent = '⏳ Limpando...';
      confirmBtn.disabled = true;

      for (const transaction of allTransactions) {
        await window.dataSdk.delete(transaction);
      }

      showToast('Todas as transações foram excluídas!');
      confirmBtn.textContent = 'Limpar Tudo';
      confirmBtn.disabled = false;
      isLoading = false;
      closeModals();
    }

    // Close modals
    function closeModals() {
      document.getElementById('delete-modal').classList.add('hidden');
      document.getElementById('delete-modal').classList.remove('flex');
      document.getElementById('clear-modal').classList.add('hidden');
      document.getElementById('clear-modal').classList.remove('flex');
      pendingDeleteId = null;
    }

    // Export report
    function exportReport() {
      const totals = calculateTotals();
      const date = new Date().toLocaleDateString('pt-BR');

      let report = `
╔══════════════════════════════════════════════════════════════╗
║           RELATÓRIO FINANCEIRO - ${config.business_name}
║           Data: ${date}
╠══════════════════════════════════════════════════════════════╣
║                    CAIXA POR SETOR
╠══════════════════════════════════════════════════════════════╣
║ 🍺 BAR
║    Saldo Inicial: ${formatCurrency(totals.barInitial)}
║    Total Vendas:  ${formatCurrency(totals.barSales)}
║    Saldo Final:   ${formatCurrency(totals.barTotal)}
╠──────────────────────────────────────────────────────────────╣
║ 🍔 FAST FOOD
║    Saldo Inicial: ${formatCurrency(totals.fastfoodInitial)}
║    Total Vendas:  ${formatCurrency(totals.fastfoodSales)}
║    Saldo Final:   ${formatCurrency(totals.fastfoodTotal)}
╠══════════════════════════════════════════════════════════════╣
║ 💵 CAIXA CONSOLIDADO: ${formatCurrency(totals.caixaConsolidado)}
╠══════════════════════════════════════════════════════════════╣
║                   CARTEIRAS MÓVEIS
╠══════════════════════════════════════════════════════════════╣
║ 📲 M-PESA
║    Dinheiro Físico:     ${formatCurrency(totals.mpesaFisico)}
║    Dinheiro Eletrônico: ${formatCurrency(totals.mpesaEletronico)}
║    Total M-Pesa:        ${formatCurrency(totals.mpesaTotal)}
╠──────────────────────────────────────────────────────────────╣
║ 📲 E-MOLA
║    Dinheiro Físico:     ${formatCurrency(totals.emolaFisico)}
║    Dinheiro Eletrônico: ${formatCurrency(totals.emolaEletronico)}
║    Total E-mola:        ${formatCurrency(totals.emolaTotal)}
╠══════════════════════════════════════════════════════════════╣
║ 📱 CARTEIRAS CONSOLIDADO: ${formatCurrency(totals.carteirasTotal)}
╠══════════════════════════════════════════════════════════════╣
║           RESUMO DE COMPRAS E VENDAS (HOJE)
╠══════════════════════════════════════════════════════════════╣
║ Total Vendas:  ${formatCurrency(totals.vendasHoje)}
║ Total Compras: ${formatCurrency(totals.comprasHoje)}
║ Lucro Líquido: ${formatCurrency(totals.lucroLiquido)}
╠══════════════════════════════════════════════════════════════╣
║ 💰 TOTAL GERAL: ${formatCurrency(totals.totalGeral)}
╚══════════════════════════════════════════════════════════════╝
      `.trim();

      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_financeiro_${date.replace(/\//g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Relatório exportado com sucesso!');
    }

    // Tab navigation
    function setupTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-btn').forEach(b => {
            b.classList.remove('active');
            if (!b.classList.contains('sidebar-btn')) {
              b.classList.add('text-slate-400');
            }
          });
          btn.classList.add('active');

          const tabId = btn.dataset.tab;
          document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
          });
          document.getElementById(`tab-${tabId}`).classList.remove('hidden');

          if (tabId === 'comparacao') {
            updateComparison();
          }
        });
      });
    }

    // Data handler for SDK
    const dataHandler = {
      onDataChanged(data) {
        allTransactions = data;
        updateDashboard();
        renderTransactions();
        updateComparison();
      }
    };

    // Config change handler
    async function onConfigChange(newConfig) {
      config = { ...defaultConfig, ...newConfig };
      document.getElementById('business-title').textContent = config.business_name || defaultConfig.business_name;
      updateDashboard();
    }

    // Map to capabilities
    function mapToCapabilities(cfg) {
      return {
        recolorables: [],
        borderables: [],
        fontEditable: undefined,
        fontSizeable: undefined
      };
    }

    // Map to edit panel values
    function mapToEditPanelValues(cfg) {
      return new Map([
        ['business_name', cfg.business_name || defaultConfig.business_name],
        ['currency_symbol', cfg.currency_symbol || defaultConfig.currency_symbol]
      ]);
    }

    // Initialize application
    async function init() {
      // Initialize Element SDK
      if (window.elementSdk) {
        window.elementSdk.init({
          defaultConfig,
          onConfigChange,
          mapToCapabilities,
          mapToEditPanelValues
        });
      }

      // Initialize Data SDK
      if (window.dataSdk) {
        const result = await window.dataSdk.init(dataHandler);
        if (!result.isOk) {
          console.error('Failed to initialize data SDK');
        }
      }

      // Setup tabs
      setupTabs();

      // Setup forms
      document.getElementById('bar-form').addEventListener('submit', (e) => handleFormSubmit(e, 'bar', null));
      document.getElementById('fastfood-form').addEventListener('submit', (e) => handleFormSubmit(e, 'fastfood', null));
      document.getElementById('bar-compras-form').addEventListener('submit', (e) => handleFormSubmit(e, 'bar', null, 'compra'));
      document.getElementById('fastfood-compras-form').addEventListener('submit', (e) => handleFormSubmit(e, 'fastfood', null, 'compra'));
      document.getElementById('mpesa-form').addEventListener('submit', (e) => handleFormSubmit(e, null, 'mpesa'));
      document.getElementById('emola-form').addEventListener('submit', (e) => handleFormSubmit(e, null, 'emola'));

      // Setup filter
      document.getElementById('filter-type').addEventListener('change', renderTransactions);

      // Setup export
      document.getElementById('export-btn').addEventListener('click', exportReport);

      // Setup delete modal
      document.getElementById('cancel-delete').addEventListener('click', closeModals);
      document.getElementById('confirm-delete').addEventListener('click', () => {
        if (pendingDeleteId) deleteTransaction(pendingDeleteId);
      });

      // Setup clear modal
      document.getElementById('clear-all-btn').addEventListener('click', () => {
        document.getElementById('clear-modal').classList.remove('hidden');
        document.getElementById('clear-modal').classList.add('flex');
      });
      document.getElementById('cancel-clear').addEventListener('click', closeModals);
      document.getElementById('confirm-clear').addEventListener('click', clearAllTransactions);

      // Close modals on backdrop click
      document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModals();
      });
      document.getElementById('clear-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModals();
      });

      // Initial render
      updateDashboard();
    }

    init();