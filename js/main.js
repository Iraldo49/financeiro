  // ============================================
    // SISTEMA DE ARMAZENAMENTO NO NAVEGADOR (localStorage)
    // ============================================
    
    // Chave para armazenamento no localStorage
    const STORAGE_KEY = 'controle_financeiro_transactions';
    const THEME_STORAGE_KEY = 'controle_financeiro_theme';
    
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

    // ============================================
    // FUNÇÕES DE TEMA DARK/LIGHT
    // ============================================
    
    // Carregar tema salvo
    function loadTheme() {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-icon').textContent = '☀️';
        document.getElementById('theme-text').textContent = 'Modo Claro';
      } else {
        document.body.classList.remove('light-mode');
        document.getElementById('theme-icon').textContent = '🌙';
        document.getElementById('theme-text').textContent = 'Modo Escuro';
      }
    }
    
    // Alternar tema
    function toggleTheme() {
      if (document.body.classList.contains('light-mode')) {
        document.body.classList.remove('light-mode');
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        document.getElementById('theme-icon').textContent = '🌙';
        document.getElementById('theme-text').textContent = 'Modo Escuro';
      } else {
        document.body.classList.add('light-mode');
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
        document.getElementById('theme-icon').textContent = '☀️';
        document.getElementById('theme-text').textContent = 'Modo Claro';
      }
    }

    // ============================================
    // FUNÇÕES DE ARMAZENAMENTO LOCAL
    // ============================================
    
    // Carregar transações do localStorage
    function loadTransactions() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          allTransactions = JSON.parse(stored);
          // Garantir que cada transação tenha um ID único
          allTransactions = allTransactions.map(t => {
            if (!t.__backendId) {
              t.__backendId = t.id || generateId();
            }
            if (!t.id) {
              t.id = t.__backendId;
            }
            return t;
          });
        } else {
          allTransactions = [];
        }
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
        allTransactions = [];
      }
      return allTransactions;
    }
    
    // Salvar transações no localStorage
    function saveTransactions() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allTransactions));
        return true;
      } catch (e) {
        console.error('Erro ao salvar dados:', e);
        showToast('Erro ao salvar no navegador', 'error');
        return false;
      }
    }
    
    // Adicionar nova transação
    function addTransaction(transaction) {
      // Criar cópia para não modificar original
      const newTransaction = { ...transaction };
      
      // Garantir IDs únicos
      if (!newTransaction.id) {
        newTransaction.id = generateId();
      }
      if (!newTransaction.__backendId) {
        newTransaction.__backendId = newTransaction.id;
      }
      
      allTransactions.push(newTransaction);
      saveTransactions();
      return { isOk: true, data: newTransaction };
    }
    
    // Remover transação por ID
    function removeTransaction(id) {
      const index = allTransactions.findIndex(t => t.__backendId === id);
      if (index !== -1) {
        allTransactions.splice(index, 1);
        saveTransactions();
        return { isOk: true };
      }
      return { isOk: false, error: 'Transação não encontrada' };
    }
    
    // Limpar todas as transações
    function removeAllTransactions() {
      allTransactions = [];
      saveTransactions();
      return { isOk: true };
    }

    // Atualizar footer
    function updateFooter() {
      const footerBusiness = document.getElementById('footer-business-name');
      if (footerBusiness) {
        footerBusiness.textContent = config.business_name || 'Controle Financeiro Fast Food';
      }
      
      const totalFooter = document.getElementById('total-transactions-footer');
      if (totalFooter) {
        totalFooter.textContent = `${allTransactions.length} transação${allTransactions.length !== 1 ? 'ões' : ''}`;
      }
      
      const lastUpdate = document.getElementById('last-update-footer');
      if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Atualizado ${now.toLocaleTimeString('pt-BR')}`;
      }
    }

    // Mobile sidebar toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
      });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
      });
    });

    // Format currency
    function formatCurrency(value, symbol) {
      if (value === undefined || value === null) value = 0;
      return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol || config.currency_symbol}`;
    }

    // Generate unique ID
    function generateId() {
      return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
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
        .reduce((sum, t) => sum + (t.amount || 0), 0);
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
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    // Calculate all totals
    function calculateTotals() {
      const today = new Date().toDateString();
      
      const barInitial = allTransactions.filter(t => t.sector === 'bar' && t.type === 'saldo_inicial').reduce((sum, t) => sum + (t.amount || 0), 0);
      const barSales = allTransactions.filter(t => t.sector === 'bar' && t.type === 'venda').reduce((sum, t) => sum + (t.amount || 0), 0);
      const barTotal = barInitial + barSales;

      const fastfoodInitial = allTransactions.filter(t => t.sector === 'fastfood' && t.type === 'saldo_inicial').reduce((sum, t) => sum + (t.amount || 0), 0);
      const fastfoodSales = allTransactions.filter(t => t.sector === 'fastfood' && t.type === 'venda').reduce((sum, t) => sum + (t.amount || 0), 0);
      const fastfoodTotal = fastfoodInitial + fastfoodSales;

      const mpesaFisico = allTransactions.filter(t => t.wallet === 'mpesa' && t.payment_type === 'fisico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const mpesaEletronico = allTransactions.filter(t => t.wallet === 'mpesa' && t.payment_type === 'eletronico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const mpesaTotal = mpesaFisico + mpesaEletronico;

      const emolaFisico = allTransactions.filter(t => t.wallet === 'emola' && t.payment_type === 'fisico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const emolaEletronico = allTransactions.filter(t => t.wallet === 'emola' && t.payment_type === 'eletronico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const emolaTotal = emolaFisico + emolaEletronico;

      const caixaConsolidado = barTotal + fastfoodTotal;
      const carteirasTotal = mpesaTotal + emolaTotal;
      const totalGeral = caixaConsolidado + carteirasTotal;

      const comprasHoje = allTransactions
        .filter(t => t.type === 'compra' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const vendasHoje = allTransactions
        .filter(t => t.type === 'venda' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

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
      
      updateFooter();
    }

    // Update comparison view
    function updateComparison() {
      const barContainer = document.getElementById('bar-comparison');
      const fastfoodContainer = document.getElementById('fastfood-comparison');

      if (!barContainer || !fastfoodContainer) return;

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
        updateFooter();
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
        } else if (t.wallet === 'emola') {
          icon = '📲'; label = 'E-mola'; colorClass = 'text-orange-400';
        } else {
          icon = '📝'; label = 'Outro'; colorClass = 'text-slate-400';
        }

        return `
          <div class="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-3 animate-slide" data-id="${t.__backendId || t.id}">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xl flex-shrink-0">${icon}</span>
              <div class="min-w-0">
                <p class="font-medium ${colorClass} truncate">${label}</p>
                <p class="text-xs text-slate-400 truncate">${t.description || 'Sem descrição'} • ${dateStr}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="font-bold ${t.type === 'compra' ? 'text-red-400' : 'text-emerald-400'}">${t.type === 'compra' ? '-' : '+'}${formatCurrency(t.amount)}</span>
              <button class="delete-btn text-slate-400 hover:text-red-400 p-1 transition-colors" data-id="${t.__backendId || t.id}">
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
      
      updateFooter();
    }

    // Handle form submission
    function handleFormSubmit(e, sector = null, wallet = null, transactionType = null) {
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

      // Determinar o tipo de transação
      let type = transactionType || formData.get('type') || '';
      if (wallet === 'mpesa' || wallet === 'emola') {
        type = 'carteira';
      }

      const transaction = {
        id: generateId(),
        __backendId: generateId(),
        type: type,
        sector: sector || '',
        wallet: wallet || '',
        amount: amount,
        payment_type: formData.get('payment_type') || '',
        description: formData.get('description') || formData.get('supplier') || '',
        supplier: formData.get('supplier') || '',
        created_at: new Date().toISOString()
      };

      const result = addTransaction(transaction);

      if (result.isOk) {
        showToast('Transação registrada com sucesso!');
        form.reset();
        updateDashboard();
        renderTransactions();
        updateComparison();
      } else {
        showToast('Erro ao salvar transação', 'error');
      }

      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isLoading = false;
    }

    // Delete transaction
    function deleteTransaction(id) {
      const result = removeTransaction(id);

      if (result.isOk) {
        showToast('Transação excluída!');
        updateDashboard();
        renderTransactions();
        updateComparison();
      } else {
        showToast('Erro ao excluir transação', 'error');
      }

      closeModals();
    }

    // Clear all transactions
    function clearAllTransactions() {
      if (allTransactions.length === 0) {
        showToast('Não há transações para excluir', 'info');
        closeModals();
        return;
      }

      removeAllTransactions();
      showToast('Todas as transações foram excluídas!');
      updateDashboard();
      renderTransactions();
      updateComparison();
      closeModals();
    }

    // Reset all data (com confirmação)
    function resetAllData() {
      if (confirm('⚠️ ATENÇÃO! Esta ação irá apagar TODOS os dados permanentemente. Deseja continuar?')) {
        removeAllTransactions();
        showToast('Todos os dados foram resetados!');
        updateDashboard();
        renderTransactions();
        updateComparison();
      }
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
      const time = new Date().toLocaleTimeString('pt-BR');

      let report = `RELATÓRIO FINANCEIRO - ${config.business_name}
Data: ${date} ${time}
${'='.repeat(60)}

CAIXA POR SETOR
${'-'.repeat(40)}
🍺 BAR
   Saldo Inicial: ${formatCurrency(totals.barInitial)}
   Total Vendas:  ${formatCurrency(totals.barSales)}
   Saldo Final:   ${formatCurrency(totals.barTotal)}

🍔 FAST FOOD
   Saldo Inicial: ${formatCurrency(totals.fastfoodInitial)}
   Total Vendas:  ${formatCurrency(totals.fastfoodSales)}
   Saldo Final:   ${formatCurrency(totals.fastfoodTotal)}

💵 CAIXA CONSOLIDADO: ${formatCurrency(totals.caixaConsolidado)}

CARTEIRAS MÓVEIS
${'-'.repeat(40)}
📲 M-PESA
   Dinheiro Físico:     ${formatCurrency(totals.mpesaFisico)}
   Dinheiro Eletrônico: ${formatCurrency(totals.mpesaEletronico)}
   Total M-Pesa:        ${formatCurrency(totals.mpesaTotal)}

📲 E-MOLA
   Dinheiro Físico:     ${formatCurrency(totals.emolaFisico)}
   Dinheiro Eletrônico: ${formatCurrency(totals.emolaEletronico)}
   Total E-mola:        ${formatCurrency(totals.emolaTotal)}

📱 CARTEIRAS CONSOLIDADO: ${formatCurrency(totals.carteirasTotal)}

RESUMO DE COMPRAS E VENDAS (HOJE)
${'-'.repeat(40)}
Total Vendas:  ${formatCurrency(totals.vendasHoje)}
Total Compras: ${formatCurrency(totals.comprasHoje)}
Lucro Líquido: ${formatCurrency(totals.lucroLiquido)}

💰 TOTAL GERAL: ${formatCurrency(totals.totalGeral)}

Total de Transações: ${allTransactions.length}
${'='.repeat(60)}
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

    // Initialize application
    async function init() {
      // Carregar tema salvo
      loadTheme();
      
      // Carregar transações do localStorage
      loadTransactions();
      
      // Setup tabs
      setupTabs();

      // Setup theme toggle
      document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

      // Setup forms
      document.getElementById('bar-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'bar', null));
      document.getElementById('fastfood-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'fastfood', null));
      document.getElementById('bar-compras-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'bar', null, 'compra'));
      document.getElementById('fastfood-compras-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'fastfood', null, 'compra'));
      document.getElementById('mpesa-form')?.addEventListener('submit', (e) => handleFormSubmit(e, null, 'mpesa'));
      document.getElementById('emola-form')?.addEventListener('submit', (e) => handleFormSubmit(e, null, 'emola'));

      // Setup filter
      document.getElementById('filter-type')?.addEventListener('change', renderTransactions);

      // Setup export
      document.getElementById('export-btn')?.addEventListener('click', exportReport);
      
      // Setup reset button
      document.getElementById('reset-btn')?.addEventListener('click', resetAllData);

      // Setup delete modal
      document.getElementById('cancel-delete')?.addEventListener('click', closeModals);
      document.getElementById('confirm-delete')?.addEventListener('click', () => {
        if (pendingDeleteId) deleteTransaction(pendingDeleteId);
      });

      // Setup clear modal
      document.getElementById('clear-all-btn')?.addEventListener('click', () => {
        document.getElementById('clear-modal').classList.remove('hidden');
        document.getElementById('clear-modal').classList.add('flex');
      });
      document.getElementById('cancel-clear')?.addEventListener('click', closeModals);
      document.getElementById('confirm-clear')?.addEventListener('click', clearAllTransactions);

      // Close modals on backdrop click
      document.getElementById('delete-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModals();
      });
      document.getElementById('clear-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModals();
      });

      // Initial render
      updateDashboard();
      renderTransactions();
      updateComparison();
    }

    init();
