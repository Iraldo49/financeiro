 // ============================================
    // SISTEMA DE ARMAZENAMENTO NO NAVEGADOR (localStorage)
    // ============================================
    
    // Chaves para armazenamento
    const STORAGE_KEY = 'controle_financeiro_transactions';
    const PRODUTOS_KEY = 'controle_financeiro_produtos';
    const ESTOQUE_KEY = 'controle_financeiro_estoque';
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
    let produtos = [];
    let estoque = {};
    let pendingDeleteId = null;
    let isLoading = false;

    // ============================================
    // FUNÇÕES DE TEMA DARK/LIGHT
    // ============================================
    
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
    // FUNÇÕES DE PRODUTOS E ESTOQUE
    // ============================================
    
    // Carregar produtos
    function loadProdutos() {
      try {
        const stored = localStorage.getItem(PRODUTOS_KEY);
        if (stored) {
          produtos = JSON.parse(stored);
        } else {
          // Produtos de exemplo
          produtos = [
            {
              id: generateId(),
              setor: 'fastfood',
              nome: 'Hambúrguer Simples',
              preco_venda: 150.00,
              composicao: [
                { insumo: 'Pão', quantidade: 1, custo_unitario: 15.00 },
                { insumo: 'Hambúrguer', quantidade: 1, custo_unitario: 45.00 },
                { insumo: 'Queijo', quantidade: 1, custo_unitario: 20.00 }
              ],
              custo_total: 80.00,
              lucro: 70.00,
              data_criacao: new Date().toISOString()
            },
            {
              id: generateId(),
              setor: 'bar',
              nome: 'Cerveja',
              preco_venda: 70.00,
              composicao: [
                { insumo: 'Cerveja', quantidade: 1, custo_unitario: 45.00 }
              ],
              custo_total: 45.00,
              lucro: 25.00,
              data_criacao: new Date().toISOString()
            }
          ];
          saveProdutos();
        }
      } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        produtos = [];
      }
      return produtos;
    }
    
    function saveProdutos() {
      localStorage.setItem(PRODUTOS_KEY, JSON.stringify(produtos));
    }
    
    // Carregar estoque
    function loadEstoque() {
      try {
        const stored = localStorage.getItem(ESTOQUE_KEY);
        if (stored) {
          estoque = JSON.parse(stored);
        } else {
          estoque = {};
        }
      } catch (e) {
        console.error('Erro ao carregar estoque:', e);
        estoque = {};
      }
      return estoque;
    }
    
    function saveEstoque() {
      localStorage.setItem(ESTOQUE_KEY, JSON.stringify(estoque));
    }
    
    // Atualizar estoque após compra
    function atualizarEstoqueCompra(insumo, quantidade, preco_total, sector) {
      if (!estoque[sector]) estoque[sector] = {};
      if (!estoque[sector][insumo]) {
        estoque[sector][insumo] = {
          quantidade: 0,
          custo_medio: 0,
          ultima_compra: null
        };
      }
      
      const item = estoque[sector][insumo];
      const custo_unitario = preco_total / quantidade;
      
      // Calcular novo custo médio
      const valor_total_atual = item.quantidade * item.custo_medio;
      const valor_total_novo = quantidade * custo_unitario;
      const quantidade_total = item.quantidade + quantidade;
      
      item.custo_medio = quantidade_total > 0 ? (valor_total_atual + valor_total_novo) / quantidade_total : 0;
      item.quantidade = quantidade_total;
      item.ultima_compra = new Date().toISOString();
      
      saveEstoque();
    }
    
    // Consumir estoque para venda
    function consumirEstoque(setor, composicao, quantidade) {
      let temEstoque = true;
      
      for (const item of composicao) {
        const insumo = item.insumo;
        const qtdNecessaria = item.quantidade * quantidade;
        
        if (!estoque[setor] || !estoque[setor][insumo] || estoque[setor][insumo].quantidade < qtdNecessaria) {
          temEstoque = false;
          break;
        }
      }
      
      if (!temEstoque) return false;
      
      for (const item of composicao) {
        const insumo = item.insumo;
        const qtdNecessaria = item.quantidade * quantidade;
        estoque[setor][insumo].quantidade -= qtdNecessaria;
      }
      
      saveEstoque();
      return true;
    }

    // ============================================
    // FUNÇÕES DE ARMAZENAMENTO LOCAL
    // ============================================
    
    function loadTransactions() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          allTransactions = JSON.parse(stored);
          allTransactions = allTransactions.map(t => {
            if (!t.__backendId) t.__backendId = t.id || generateId();
            if (!t.id) t.id = t.__backendId;
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
    
    function addTransaction(transaction) {
      const newTransaction = { ...transaction };
      if (!newTransaction.id) newTransaction.id = generateId();
      if (!newTransaction.__backendId) newTransaction.__backendId = newTransaction.id;
      allTransactions.push(newTransaction);
      saveTransactions();
      return { isOk: true, data: newTransaction };
    }
    
    function removeTransaction(id) {
      const index = allTransactions.findIndex(t => t.__backendId === id);
      if (index !== -1) {
        allTransactions.splice(index, 1);
        saveTransactions();
        return { isOk: true };
      }
      return { isOk: false };
    }
    
    function removeAllTransactions() {
      allTransactions = [];
      saveTransactions();
      return { isOk: true };
    }

    // ============================================
    // FUNÇÕES DE CÁLCULO
    // ============================================
    
    function calcularTotaisCarteira(wallet, date = new Date()) {
      const dateStr = date.toDateString();
      
      const saldoInicial = allTransactions
        .filter(t => t.wallet === wallet && t.type === 'saldo_carteira' && new Date(t.created_at).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const entradas = allTransactions
        .filter(t => t.wallet === wallet && t.payment_type === 'fisico' && new Date(t.created_at).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const saidas = allTransactions
        .filter(t => t.wallet === wallet && t.payment_type === 'eletronico' && new Date(t.created_at).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const saldoEsperado = saldoInicial + entradas - saidas;
      
      return { saldoInicial, entradas, saidas, saldoEsperado };
    }
    
    function calcularLucroVenda(produto, quantidade) {
      if (!produto) return 0;
      const custoTotal = (produto.custo_total || 0) * quantidade;
      const vendaTotal = (produto.preco_venda || 0) * quantidade;
      return vendaTotal - custoTotal;
    }
    
    function updateFooter() {
      const footerBusiness = document.getElementById('footer-business-name');
      if (footerBusiness) footerBusiness.textContent = config.business_name || 'Controle Financeiro';
      
      const totalFooter = document.getElementById('total-transactions-footer');
      if (totalFooter) totalFooter.textContent = `${allTransactions.length} transação${allTransactions.length !== 1 ? 'ões' : ''}`;
      
      const lastUpdate = document.getElementById('last-update-footer');
      if (lastUpdate) lastUpdate.textContent = `Atualizado ${new Date().toLocaleTimeString('pt-BR')}`;
    }

    // ============================================
    // FUNÇÕES DE INTERFACE
    // ============================================
    
    // Atualizar select de insumos
    function atualizarSelectInsumos() {
      const select = document.getElementById('insumo-select');
      if (!select) return;
      
      const setor = document.getElementById('produto-setor').value;
      const insumos = new Set();
      
      allTransactions
        .filter(t => t.type === 'compra' && t.sector === setor && t.product_name)
        .forEach(t => insumos.add(t.product_name));
      
      select.innerHTML = '<option value="">Selecione um insumo</option>';
      Array.from(insumos).sort().forEach(insumo => {
        select.innerHTML += `<option value="${insumo}">${insumo}</option>`;
      });
    }
    
    // Renderizar lista de produtos
    function renderizarProdutos() {
      const container = document.getElementById('produtos-lista');
      const filtro = document.getElementById('filtro-setor-produtos')?.value || 'todos';
      
      if (!container) return;
      
      let produtosFiltrados = produtos;
      if (filtro !== 'todos') {
        produtosFiltrados = produtos.filter(p => p.setor === filtro);
      }
      
      if (produtosFiltrados.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">Nenhum produto cadastrado</p>';
        return;
      }
      
      container.innerHTML = produtosFiltrados.sort((a, b) => a.nome.localeCompare(b.nome)).map(p => {
        const emEstoque = verificarEstoqueDisponivel(p);
        const estoqueClass = emEstoque ? 'text-emerald-400' : 'text-red-400';
        const estoqueText = emEstoque ? '✓ Disponível' : '⚠️ Sem estoque';
        
        return `
          <div class="bg-slate-700/50 rounded-lg p-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-medium">${p.setor === 'bar' ? '🍺' : '🍔'} ${p.nome}</span>
                <div class="text-xs text-slate-400 mt-1">
                  <span>Venda: ${formatCurrency(p.preco_venda)}</span>
                  <span class="mx-2">•</span>
                  <span>Custo: ${formatCurrency(p.custo_total || 0)}</span>
                  <span class="mx-2">•</span>
                  <span class="text-purple-400">Lucro: ${formatCurrency(p.lucro || 0)}</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs ${estoqueClass}">${estoqueText}</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-slate-400">
              <strong>Composição:</strong> ${p.composicao.map(c => `${c.quantidade}x ${c.insumo}`).join(', ')}
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Verificar disponibilidade de estoque
    function verificarEstoqueDisponivel(produto) {
      if (!produto || !produto.composicao) return false;
      
      for (const item of produto.composicao) {
        const insumo = item.insumo;
        const qtdNecessaria = item.quantidade;
        
        if (!estoque[produto.setor] || 
            !estoque[produto.setor][insumo] || 
            estoque[produto.setor][insumo].quantidade < qtdNecessaria) {
          return false;
        }
      }
      return true;
    }
    
    // Atualizar select de produtos para venda
    function atualizarSelectVendas() {
      const select = document.getElementById('venda-produto');
      const setor = document.getElementById('venda-setor').value;
      
      if (!select) return;
      
      const produtosSetor = produtos.filter(p => p.setor === setor);
      
      select.innerHTML = '<option value="">Selecione um produto</option>';
      produtosSetor.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(p => {
        const emEstoque = verificarEstoqueDisponivel(p);
        select.innerHTML += `<option value="${p.id}" data-produto='${JSON.stringify(p)}'>${p.nome} - ${formatCurrency(p.preco_venda)} ${!emEstoque ? '(⚠️ sem estoque)' : ''}</option>`;
      });
    }
    
    // Atualizar preview do produto selecionado para venda
    function atualizarPreviewVenda() {
      const select = document.getElementById('venda-produto');
      const quantidade = parseFloat(document.getElementById('venda-quantidade').value) || 1;
      const infoDiv = document.getElementById('produto-info');
      
      if (!select.value) {
        infoDiv.classList.add('hidden');
        return;
      }
      
      const produto = produtos.find(p => p.id === select.value);
      if (!produto) return;
      
      const custoUnitario = produto.custo_total || 0;
      const precoUnitario = produto.preco_venda || 0;
      const lucroUnitario = precoUnitario - custoUnitario;
      
      document.getElementById('produto-preco-unitario').textContent = formatCurrency(precoUnitario);
      document.getElementById('produto-custo-unitario').textContent = formatCurrency(custoUnitario);
      document.getElementById('produto-lucro-unitario').textContent = formatCurrency(lucroUnitario);
      
      const vendaTotal = precoUnitario * quantidade;
      const custoTotal = custoUnitario * quantidade;
      const lucroTotal = vendaTotal - custoTotal;
      
      document.getElementById('venda-total').textContent = formatCurrency(vendaTotal);
      document.getElementById('venda-custo-total').textContent = formatCurrency(custoTotal);
      document.getElementById('venda-lucro-total').textContent = formatCurrency(lucroTotal);
      
      let composicaoHtml = '<span class="font-medium">Composição:</span><br>';
      produto.composicao.forEach(item => {
        const qtdNecessaria = item.quantidade * quantidade;
        const disponivel = estoque[produto.setor]?.[item.insumo]?.quantidade || 0;
        const cor = disponivel >= qtdNecessaria ? 'text-emerald-400' : 'text-red-400';
        composicaoHtml += `${item.quantidade}x ${item.insumo} (${qtdNecessaria} usados, ${disponivel} disp) - <span class="${cor}">${cor === 'text-emerald-400' ? '✓' : '⚠️'}</span><br>`;
      });
      
      document.getElementById('produto-composicao-info').innerHTML = composicaoHtml;
      infoDiv.classList.remove('hidden');
    }
    
    // Atualizar fecho das carteiras
    function atualizarFechoCarteiras() {
      const hoje = new Date();
      
      // M-Pesa
      const mpesa = calcularTotaisCarteira('mpesa', hoje);
      document.getElementById('mpesa-inicial').textContent = formatCurrency(mpesa.saldoInicial);
      document.getElementById('mpesa-entradas').textContent = formatCurrency(mpesa.entradas);
      document.getElementById('mpesa-saidas').textContent = formatCurrency(mpesa.saidas);
      document.getElementById('mpesa-saldo-esperado').textContent = formatCurrency(mpesa.saldoEsperado);
      
      // E-mola
      const emola = calcularTotaisCarteira('emola', hoje);
      document.getElementById('emola-inicial').textContent = formatCurrency(emola.saldoInicial);
      document.getElementById('emola-entradas').textContent = formatCurrency(emola.entradas);
      document.getElementById('emola-saidas').textContent = formatCurrency(emola.saidas);
      document.getElementById('emola-saldo-esperado').textContent = formatCurrency(emola.saldoEsperado);
    }
    
    // Registrar fecho de carteira
    function registrarFecho(wallet, saldoReal) {
      const hoje = new Date();
      const totais = calcularTotaisCarteira(wallet, hoje);
      const diferenca = saldoReal - totais.saldoEsperado;
      
      const fecho = {
        id: generateId(),
        __backendId: generateId(),
        type: 'fecho',
        wallet: wallet,
        amount: saldoReal,
        saldo_esperado: totais.saldoEsperado,
        diferenca: diferenca,
        description: `Fecho diário - Saldo Real: ${formatCurrency(saldoReal)} | Esperado: ${formatCurrency(totais.saldoEsperado)} | Diferença: ${formatCurrency(diferenca)}`,
        created_at: new Date().toISOString()
      };
      
      addTransaction(fecho);
      
      // Registrar novo saldo inicial para amanhã
      if (diferenca !== 0) {
        const ajuste = {
          id: generateId(),
          __backendId: generateId(),
          type: 'ajuste_carteira',
          wallet: wallet,
          amount: Math.abs(diferenca),
          payment_type: diferenca > 0 ? 'fisico' : 'eletronico',
          description: `Ajuste por diferença no fecho (${diferenca > 0 ? '+' : '-'}${formatCurrency(diferenca)})`,
          created_at: new Date().toISOString()
        };
        addTransaction(ajuste);
      }
      
      const saldoInicialAmanha = {
        id: generateId(),
        __backendId: generateId(),
        type: 'saldo_carteira',
        wallet: wallet,
        amount: saldoReal,
        description: `Saldo inicial para ${new Date(Date.now() + 86400000).toLocaleDateString('pt-BR')}`,
        created_at: new Date(Date.now() + 86400000).toISOString()
      };
      addTransaction(saldoInicialAmanha);
      
      return diferenca;
    }

    // ============================================
    // FUNÇÕES ORIGINAIS (ADAPTADAS)
    // ============================================
    
    function formatCurrency(value, symbol) {
      if (value === undefined || value === null) value = 0;
      return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol || config.currency_symbol}`;
    }
    
    function generateId() {
      return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white text-sm`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
    
    function getSalesForDate(sector, date) {
      const dateStr = date.toDateString();
      return allTransactions
        .filter(t => t.sector === sector && t.type === 'venda' && new Date(t.created_at).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    
    function getPurchasesForDate(sector, date) {
      const dateStr = date.toDateString();
      return allTransactions
        .filter(t => t.sector === sector && t.type === 'compra' && new Date(t.created_at).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    
    function calculateTotals() {
      const today = new Date().toDateString();
      
      const barInitial = allTransactions.filter(t => t.sector === 'bar' && t.type === 'saldo_inicial').reduce((sum, t) => sum + (t.amount || 0), 0);
      const barSales = allTransactions.filter(t => t.sector === 'bar' && t.type === 'venda').reduce((sum, t) => sum + (t.amount || 0), 0);
      const barTotal = barInitial + barSales;
      
      const barLucro = allTransactions
        .filter(t => t.sector === 'bar' && t.type === 'venda')
        .reduce((sum, t) => sum + (t.lucro_venda || 0), 0);

      const fastfoodInitial = allTransactions.filter(t => t.sector === 'fastfood' && t.type === 'saldo_inicial').reduce((sum, t) => sum + (t.amount || 0), 0);
      const fastfoodSales = allTransactions.filter(t => t.sector === 'fastfood' && t.type === 'venda').reduce((sum, t) => sum + (t.amount || 0), 0);
      const fastfoodTotal = fastfoodInitial + fastfoodSales;
      
      const fastfoodLucro = allTransactions
        .filter(t => t.sector === 'fastfood' && t.type === 'venda')
        .reduce((sum, t) => sum + (t.lucro_venda || 0), 0);

      const mpesaFisico = allTransactions.filter(t => t.wallet === 'mpesa' && t.payment_type === 'fisico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const mpesaEletronico = allTransactions.filter(t => t.wallet === 'mpesa' && t.payment_type === 'eletronico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const mpesaTotal = mpesaFisico - mpesaEletronico;

      const emolaFisico = allTransactions.filter(t => t.wallet === 'emola' && t.payment_type === 'fisico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const emolaEletronico = allTransactions.filter(t => t.wallet === 'emola' && t.payment_type === 'eletronico').reduce((sum, t) => sum + (t.amount || 0), 0);
      const emolaTotal = emolaFisico - emolaEletronico;

      const caixaConsolidado = barTotal + fastfoodTotal;
      const carteirasTotal = mpesaTotal + emolaTotal;
      const totalGeral = caixaConsolidado + carteirasTotal;

      const comprasHoje = allTransactions
        .filter(t => t.type === 'compra' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const vendasHoje = allTransactions
        .filter(t => t.type === 'venda' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const lucroLiquido = allTransactions
        .filter(t => t.type === 'venda' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + (t.lucro_venda || 0), 0);

      return {
        barInitial, barSales, barTotal, barLucro,
        fastfoodInitial, fastfoodSales, fastfoodTotal, fastfoodLucro,
        mpesaFisico, mpesaEletronico, mpesaTotal,
        emolaFisico, emolaEletronico, emolaTotal,
        caixaConsolidado, carteirasTotal, totalGeral,
        comprasHoje, vendasHoje, lucroLiquido
      };
    }
    
    function updateDashboard() {
      const totals = calculateTotals();
      
      document.getElementById('total-geral').textContent = formatCurrency(totals.totalGeral);
      document.getElementById('caixa-consolidado').textContent = formatCurrency(totals.caixaConsolidado);
      document.getElementById('compras-hoje').textContent = formatCurrency(totals.comprasHoje);
      document.getElementById('lucro-liquido').textContent = formatCurrency(totals.lucroLiquido);
      
      document.getElementById('bar-total').textContent = formatCurrency(totals.barTotal);
      document.getElementById('bar-inicial').textContent = formatCurrency(totals.barInitial, '');
      document.getElementById('bar-vendas').textContent = formatCurrency(totals.barSales, '');
      document.getElementById('bar-lucro').textContent = formatCurrency(totals.barLucro, '');
      
      document.getElementById('fastfood-total').textContent = formatCurrency(totals.fastfoodTotal);
      document.getElementById('fastfood-inicial').textContent = formatCurrency(totals.fastfoodInitial, '');
      document.getElementById('fastfood-vendas').textContent = formatCurrency(totals.fastfoodSales, '');
      document.getElementById('fastfood-lucro').textContent = formatCurrency(totals.fastfoodLucro, '');
      
      document.getElementById('mpesa-total').textContent = formatCurrency(totals.mpesaTotal);
      document.getElementById('mpesa-fisico').textContent = formatCurrency(totals.mpesaFisico, '');
      document.getElementById('mpesa-eletronico').textContent = formatCurrency(totals.mpesaEletronico, '');
      
      document.getElementById('emola-total').textContent = formatCurrency(totals.emolaTotal);
      document.getElementById('emola-fisico').textContent = formatCurrency(totals.emolaFisico, '');
      document.getElementById('emola-eletronico').textContent = formatCurrency(totals.emolaEletronico, '');
      
      updateFooter();
    }
    
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
        
        barHTML += `<div class="bg-slate-600/50 rounded-lg p-3"><div class="flex justify-between items-center mb-1"><span class="text-sm font-medium">${dateStr}</span><span class="${barColor} font-bold">${formatCurrency(barProfit)}</span></div><div class="text-xs text-slate-400 grid grid-cols-2 gap-2"><div>Vendas: <span class="text-white">${formatCurrency(barSales, '')}</span></div><div>Compras: <span class="text-red-400">${formatCurrency(barPurchases, '')}</span></div></div></div>`;
        fastfoodHTML += `<div class="bg-slate-600/50 rounded-lg p-3"><div class="flex justify-between items-center mb-1"><span class="text-sm font-medium">${dateStr}</span><span class="${ffColor} font-bold">${formatCurrency(ffProfit)}</span></div><div class="text-xs text-slate-400 grid grid-cols-2 gap-2"><div>Vendas: <span class="text-white">${formatCurrency(ffSales, '')}</span></div><div>Compras: <span class="text-red-400">${formatCurrency(ffPurchases, '')}</span></div></div></div>`;
      }
      
      barContainer.innerHTML = barHTML || '<p class="text-slate-400 text-center py-4">Sem dados</p>';
      fastfoodContainer.innerHTML = fastfoodHTML || '<p class="text-slate-400 text-center py-4">Sem dados</p>';
    }
    
    function renderTransactions() {
      const container = document.getElementById('transactions-list');
      const filter = document.getElementById('filter-type').value;
      
      let filtered = allTransactions;
      if (filter === 'venda') filtered = allTransactions.filter(t => t.type === 'venda');
      else if (filter === 'compra') filtered = allTransactions.filter(t => t.type === 'compra');
      else if (filter === 'carteira') filtered = allTransactions.filter(t => t.wallet && t.type !== 'fecho' && t.type !== 'saldo_carteira');
      else if (filter === 'fecho') filtered = allTransactions.filter(t => t.type === 'fecho' || t.type === 'ajuste_carteira');
      
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
          icon = t.sector === 'bar' ? '🍺' : '🍔';
          label = `Venda - ${t.sector === 'bar' ? 'Bar' : 'Fast Food'} - ${t.produto_nome || ''}`;
          colorClass = 'text-emerald-400';
        } else if (t.type === 'compra') {
          icon = '🛒';
          label = `Compra - ${t.sector === 'bar' ? 'Bar' : 'Fast Food'} - ${t.product_name || ''}`;
          colorClass = 'text-red-400';
        } else if (t.type === 'fecho') {
          icon = '📆';
          label = `Fecho - ${t.wallet === 'mpesa' ? 'M-Pesa' : 'E-mola'}`;
          colorClass = 'text-purple-400';
        } else if (t.type === 'ajuste_carteira') {
          icon = '⚖️';
          label = `Ajuste - ${t.wallet === 'mpesa' ? 'M-Pesa' : 'E-mola'}`;
          colorClass = 'text-yellow-400';
        } else if (t.wallet) {
          icon = '📲';
          label = `${t.wallet === 'mpesa' ? 'M-Pesa' : 'E-mola'} - ${t.payment_type === 'fisico' ? 'Entrada' : 'Saída'}`;
          colorClass = t.wallet === 'mpesa' ? 'text-red-400' : 'text-orange-400';
        } else {
          icon = '📝';
          label = t.type === 'saldo_inicial' ? 'Saldo Inicial' : t.type;
          colorClass = 'text-slate-400';
        }
        
        let valorDisplay = formatCurrency(t.amount);
        if (t.type === 'venda') valorDisplay = `+${formatCurrency(t.amount)}`;
        else if (t.type === 'compra') valorDisplay = `-${formatCurrency(t.amount)}`;
        else if (t.wallet && t.payment_type === 'eletronico') valorDisplay = `-${formatCurrency(t.amount)}`;
        else if (t.wallet) valorDisplay = `+${formatCurrency(t.amount)}`;
        
        return `<div class="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-3 animate-slide" data-id="${t.__backendId || t.id}"><div class="flex items-center gap-3 min-w-0"><span class="text-xl flex-shrink-0">${icon}</span><div class="min-w-0"><p class="font-medium ${colorClass} truncate">${label}</p><p class="text-xs text-slate-400 truncate">${t.description || 'Sem descrição'} • ${dateStr}</p></div></div><div class="flex items-center gap-2 flex-shrink-0"><span class="font-bold ${t.type === 'compra' || (t.wallet && t.payment_type === 'eletronico') ? 'text-red-400' : 'text-emerald-400'}">${valorDisplay}</span><button class="delete-btn text-slate-400 hover:text-red-400 p-1 transition-colors" data-id="${t.__backendId || t.id}">🗑️</button></div></div>`;
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
    
    // ============================================
    // HANDLERS DE FORMULÁRIO
    // ============================================
    
    function handleSaldoInicial(e, sector) {
      e.preventDefault();
      if (isLoading) return;
      
      const form = e.target;
      const formData = new FormData(form);
      const amount = parseFloat(formData.get('amount'));
      
      if (isNaN(amount) || amount < 0) {
        showToast('Por favor, insira um valor válido', 'error');
        return;
      }
      
      isLoading = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Salvando...';
      submitBtn.disabled = true;
      
      const transaction = {
        id: generateId(),
        __backendId: generateId(),
        type: 'saldo_inicial',
        sector: sector,
        amount: amount,
        description: formData.get('description') || `Saldo inicial ${sector}`,
        created_at: new Date().toISOString()
      };
      
      addTransaction(transaction);
      showToast('Saldo inicial registrado!');
      form.reset();
      
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isLoading = false;
      updateDashboard();
    }
    
    function handleCompra(e, sector) {
      e.preventDefault();
      if (isLoading) return;
      
      const form = e.target;
      const formData = new FormData(form);
      const amount = parseFloat(formData.get('amount'));
      const quantity = parseFloat(formData.get('quantity'));
      const product_name = formData.get('product_name');
      
      if (isNaN(amount) || amount < 0 || isNaN(quantity) || quantity <= 0) {
        showToast('Por favor, insira valores válidos', 'error');
        return;
      }
      
      isLoading = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Salvando...';
      submitBtn.disabled = true;
      
      const transaction = {
        id: generateId(),
        __backendId: generateId(),
        type: 'compra',
        sector: sector,
        product_name: product_name,
        quantity: quantity,
        amount: amount,
        supplier: formData.get('supplier') || '',
        description: `Compra de ${quantity}x ${product_name}`,
        created_at: new Date().toISOString()
      };
      
      addTransaction(transaction);
      atualizarEstoqueCompra(product_name, quantity, amount, sector);
      
      showToast('Compra registrada!');
      form.reset();
      form.querySelector('input[name="quantity"]').value = '1.00';
      
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isLoading = false;
      
      atualizarSelectInsumos();
      updateDashboard();
    }
    
    function handleCarteira(e, wallet) {
      e.preventDefault();
      if (isLoading) return;
      
      const form = e.target;
      const formData = new FormData(form);
      const amount = parseFloat(formData.get('amount'));
      const payment_type = formData.get('payment_type');
      
      if (isNaN(amount) || amount < 0) {
        showToast('Por favor, insira um valor válido', 'error');
        return;
      }
      
      isLoading = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Salvando...';
      submitBtn.disabled = true;
      
      const transaction = {
        id: generateId(),
        __backendId: generateId(),
        type: 'carteira',
        wallet: wallet,
        amount: amount,
        payment_type: payment_type,
        description: formData.get('description'),
        created_at: new Date().toISOString()
      };
      
      addTransaction(transaction);
      showToast('Movimento registrado!');
      form.reset();
      
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isLoading = false;
      
      updateDashboard();
      atualizarFechoCarteiras();
    }
    
    function handleVenda() {
      if (isLoading) return;
      
      const produtoSelect = document.getElementById('venda-produto');
      const setor = document.getElementById('venda-setor').value;
      const quantidade = parseInt(document.getElementById('venda-quantidade').value) || 1;
      const pagamento = document.getElementById('venda-pagamento').value;
      
      if (!produtoSelect.value) {
        showToast('Selecione um produto', 'error');
        return;
      }
      
      const produto = produtos.find(p => p.id === produtoSelect.value);
      if (!produto) return;
      
      if (!verificarEstoqueDisponivel(produto)) {
        showToast('Estoque insuficiente para este produto', 'error');
        return;
      }
      
      isLoading = true;
      const btn = document.getElementById('registrar-venda-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Registrando...';
      btn.disabled = true;
      
      if (!consumirEstoque(setor, produto.composicao, quantidade)) {
        showToast('Erro ao consumir estoque', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
        isLoading = false;
        return;
      }
      
      const vendaTotal = produto.preco_venda * quantidade;
      const lucroVenda = (produto.preco_venda - (produto.custo_total || 0)) * quantidade;
      
      const transaction = {
        id: generateId(),
        __backendId: generateId(),
        type: 'venda',
        sector: setor,
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: quantidade,
        amount: vendaTotal,
        lucro_venda: lucroVenda,
        pagamento: pagamento,
        description: `Venda de ${quantidade}x ${produto.nome}`,
        created_at: new Date().toISOString()
      };
      
      addTransaction(transaction);
      
      // Se pagamento for por carteira, registrar entrada
      if (pagamento === 'mpesa' || pagamento === 'emola') {
        const pagamentoTrans = {
          id: generateId(),
          __backendId: generateId(),
          type: 'carteira',
          wallet: pagamento,
          amount: vendaTotal,
          payment_type: 'fisico',
          description: `Venda de ${quantidade}x ${produto.nome} (${setor === 'bar' ? 'Bar' : 'Fast Food'})`,
          created_at: new Date().toISOString()
        };
        addTransaction(pagamentoTrans);
      }
      
      showToast(`Venda registrada! Lucro: ${formatCurrency(lucroVenda)}`);
      btn.innerHTML = originalText;
      btn.disabled = false;
      isLoading = false;
      
      document.getElementById('venda-produto').value = '';
      document.getElementById('venda-quantidade').value = '1';
      document.getElementById('produto-info').classList.add('hidden');
      
      renderizarProdutos();
      updateDashboard();
      atualizarFechoCarteiras();
      renderizarVendasRecentes();
    }
    
    function renderizarVendasRecentes() {
      const container = document.getElementById('vendas-recentes');
      if (!container) return;
      
      const vendas = allTransactions
        .filter(t => t.type === 'venda')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      if (vendas.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">Nenhuma venda registrada</p>';
        return;
      }
      
      container.innerHTML = vendas.map(v => {
        const date = new Date(v.created_at);
        const dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="bg-slate-700/50 rounded-lg p-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-medium">${v.setor === 'bar' ? '🍺' : '🍔'} ${v.produto_nome}</span>
                <span class="text-xs text-slate-400 ml-2">${v.quantidade}x</span>
              </div>
              <span class="font-bold text-emerald-400">+${formatCurrency(v.amount)}</span>
            </div>
            <div class="flex justify-between text-xs mt-1">
              <span class="text-slate-400">${dateStr} • ${v.pagamento === 'dinheiro' ? '💵' : v.pagamento === 'mpesa' ? '📲 M-Pesa' : '📲 E-mola'}</span>
              <span class="text-purple-400">💰 Lucro: ${formatCurrency(v.lucro_venda || 0)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // ============================================
    // SETUP E INICIALIZAÇÃO
    // ============================================
    
    function setupTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-btn').forEach(b => {
            b.classList.remove('active');
            b.classList.add('text-slate-400');
          });
          btn.classList.remove('text-slate-400');
          btn.classList.add('active');
          
          const tabId = btn.dataset.tab;
          document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
          document.getElementById(`tab-${tabId}`).classList.remove('hidden');
          
          if (tabId === 'comparacao') updateComparison();
          if (tabId === 'carteiras') atualizarFechoCarteiras();
          if (tabId === 'produtos') {
            atualizarSelectInsumos();
            renderizarProdutos();
          }
          if (tabId === 'vendas') {
            atualizarSelectVendas();
            renderizarVendasRecentes();
          }
        });
      });
    }
    
    function init() {
      // Carregar dados
      loadTheme();
      loadTransactions();
      loadProdutos();
      loadEstoque();
      
      // Setup
      setupTabs();
      
      // Event listeners
      document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
      
      // Forms
      document.getElementById('bar-form')?.addEventListener('submit', (e) => handleSaldoInicial(e, 'bar'));
      document.getElementById('fastfood-form')?.addEventListener('submit', (e) => handleSaldoInicial(e, 'fastfood'));
      document.getElementById('bar-compras-form')?.addEventListener('submit', (e) => handleCompra(e, 'bar'));
      document.getElementById('fastfood-compras-form')?.addEventListener('submit', (e) => handleCompra(e, 'fastfood'));
      document.getElementById('mpesa-form')?.addEventListener('submit', (e) => handleCarteira(e, 'mpesa'));
      document.getElementById('emola-form')?.addEventListener('submit', (e) => handleCarteira(e, 'emola'));
      
      // Produto
      document.getElementById('add-insumo-btn')?.addEventListener('click', () => {
        const select = document.getElementById('insumo-select');
        const quantidade = parseFloat(document.getElementById('insumo-quantidade').value);
        const setor = document.getElementById('produto-setor').value;
        const container = document.getElementById('composicao-container');
        
        if (!select.value || !quantidade || quantidade <= 0) {
          showToast('Selecione um insumo e quantidade válida', 'error');
          return;
        }
        
        // Buscar custo médio do estoque
        const custo = estoque[setor]?.[select.value]?.custo_medio || 0;
        
        const insumoDiv = document.createElement('div');
        insumoDiv.className = 'flex items-center gap-2 bg-slate-600/50 p-2 rounded-lg';
        insumoDiv.innerHTML = `
          <span class="flex-1 text-sm">${select.value}</span>
          <span class="text-sm">${quantidade}x</span>
          <span class="text-xs text-orange-400">${formatCurrency(custo * quantidade)}</span>
          <button type="button" class="remove-insumo text-red-400 hover:text-red-300 px-1">✕</button>
          <input type="hidden" name="insumo" value="${select.value}">
          <input type="hidden" name="insumo_qtd" value="${quantidade}">
          <input type="hidden" name="insumo_custo" value="${custo}">
        `;
        
        container.appendChild(insumoDiv);
        
        insumoDiv.querySelector('.remove-insumo').addEventListener('click', () => insumoDiv.remove());
        
        select.value = '';
        document.getElementById('insumo-quantidade').value = '';
        
        // Calcular custo total
        let custoTotal = 0;
        container.querySelectorAll('input[name="insumo_custo"]').forEach(input => {
          custoTotal += parseFloat(input.value) * parseFloat(input.closest('div').querySelector('input[name="insumo_qtd"]').value);
        });
        document.getElementById('custo-total-produto').textContent = formatCurrency(custoTotal);
        
        const precoVenda = parseFloat(document.getElementById('produto-preco').value) || 0;
        document.getElementById('preco-venda-preview').textContent = formatCurrency(precoVenda);
        document.getElementById('lucro-estimado').textContent = formatCurrency(precoVenda - custoTotal);
      });
      
      document.getElementById('salvar-produto-btn')?.addEventListener('click', () => {
        const setor = document.getElementById('produto-setor').value;
        const nome = document.getElementById('produto-nome').value;
        const preco = parseFloat(document.getElementById('produto-preco').value);
        const container = document.getElementById('composicao-container');
        
        if (!nome || !preco || preco <= 0) {
          showToast('Preencha nome e preço do produto', 'error');
          return;
        }
        
        const composicao = [];
        let custoTotal = 0;
        
        container.querySelectorAll('div.bg-slate-600\\/50').forEach(div => {
          const insumo = div.querySelector('input[name="insumo"]').value;
          const quantidade = parseFloat(div.querySelector('input[name="insumo_qtd"]').value);
          const custo = parseFloat(div.querySelector('input[name="insumo_custo"]').value);
          
          composicao.push({ insumo, quantidade, custo_unitario: custo });
          custoTotal += custo * quantidade;
        });
        
        if (composicao.length === 0) {
          showToast('Adicione pelo menos um insumo', 'error');
          return;
        }
        
        const produto = {
          id: generateId(),
          setor,
          nome,
          preco_venda: preco,
          composicao,
          custo_total: custoTotal,
          lucro: preco - custoTotal,
          data_criacao: new Date().toISOString()
        };
        
        produtos.push(produto);
        saveProdutos();
        
        showToast('Produto cadastrado com sucesso!');
        
        // Limpar formulário
        document.getElementById('produto-nome').value = '';
        document.getElementById('produto-preco').value = '';
        container.innerHTML = '';
        document.getElementById('custo-total-produto').textContent = formatCurrency(0);
        document.getElementById('preco-venda-preview').textContent = formatCurrency(0);
        document.getElementById('lucro-estimado').textContent = formatCurrency(0);
        
        renderizarProdutos();
      });
      
      // Venda
      document.getElementById('venda-setor')?.addEventListener('change', () => {
        atualizarSelectVendas();
        document.getElementById('produto-info').classList.add('hidden');
      });
      
      document.getElementById('venda-produto')?.addEventListener('change', atualizarPreviewVenda);
      document.getElementById('venda-quantidade')?.addEventListener('input', atualizarPreviewVenda);
      document.getElementById('registrar-venda-btn')?.addEventListener('click', handleVenda);
      
      // Filtros
      document.getElementById('filtro-setor-produtos')?.addEventListener('change', renderizarProdutos);
      document.getElementById('filter-type')?.addEventListener('change', renderTransactions);
      
      // Fecho carteiras
      document.getElementById('fechar-mpesa-btn')?.addEventListener('click', () => {
        const saldoReal = parseFloat(document.getElementById('mpesa-saldo-real').value);
        if (isNaN(saldoReal)) {
          showToast('Insira o saldo real da M-Pesa', 'error');
          return;
        }
        
        const diferenca = registrarFecho('mpesa', saldoReal);
        const divDiferenca = document.getElementById('mpesa-diferenca');
        divDiferenca.classList.remove('hidden');
        
        if (diferenca === 0) {
          divDiferenca.className = 'mt-2 p-2 rounded-lg text-sm bg-emerald-600/20 text-emerald-400';
          divDiferenca.innerHTML = '✅ Fecho concluído! Saldo confere.';
        } else {
          divDiferenca.className = 'mt-2 p-2 rounded-lg text-sm bg-yellow-600/20 text-yellow-400';
          divDiferenca.innerHTML = `⚠️ Fecho com diferença de ${formatCurrency(Math.abs(diferenca))} (${diferenca > 0 ? 'sobra' : 'falta'}). Ajuste registrado.`;
        }
        
        showToast('Fecho da M-Pesa registrado!');
        atualizarFechoCarteiras();
      });
      
      document.getElementById('fechar-emola-btn')?.addEventListener('click', () => {
        const saldoReal = parseFloat(document.getElementById('emola-saldo-real').value);
        if (isNaN(saldoReal)) {
          showToast('Insira o saldo real da E-mola', 'error');
          return;
        }
        
        const diferenca = registrarFecho('emola', saldoReal);
        const divDiferenca = document.getElementById('emola-diferenca');
        divDiferenca.classList.remove('hidden');
        
        if (diferenca === 0) {
          divDiferenca.className = 'mt-2 p-2 rounded-lg text-sm bg-emerald-600/20 text-emerald-400';
          divDiferenca.innerHTML = '✅ Fecho concluído! Saldo confere.';
        } else {
          divDiferenca.className = 'mt-2 p-2 rounded-lg text-sm bg-yellow-600/20 text-yellow-400';
          divDiferenca.innerHTML = `⚠️ Fecho com diferença de ${formatCurrency(Math.abs(diferenca))} (${diferenca > 0 ? 'sobra' : 'falta'}). Ajuste registrado.`;
        }
        
        showToast('Fecho da E-mola registrado!');
        atualizarFechoCarteiras();
      });
      
      // Export
      document.getElementById('export-btn')?.addEventListener('click', exportReport);
      document.getElementById('reset-btn')?.addEventListener('click', resetAllData);
      
      // Delete modal
      document.getElementById('cancel-delete')?.addEventListener('click', closeModals);
      document.getElementById('confirm-delete')?.addEventListener('click', () => {
        if (pendingDeleteId) deleteTransaction(pendingDeleteId);
      });
      
      // Clear modal
      document.getElementById('clear-all-btn')?.addEventListener('click', () => {
        document.getElementById('clear-modal').classList.remove('hidden');
        document.getElementById('clear-modal').classList.add('flex');
      });
      document.getElementById('cancel-clear')?.addEventListener('click', closeModals);
      document.getElementById('confirm-clear')?.addEventListener('click', () => {
        removeAllTransactions();
        showToast('Todas as transações foram excluídas!');
        updateDashboard();
        renderTransactions();
        closeModals();
      });
      
      // Close modals on backdrop
      document.getElementById('delete-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModals();
      });
      document.getElementById('clear-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModals();
      });
      
      // Mobile menu
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
      
      // Initial render
      updateDashboard();
      renderTransactions();
      atualizarFechoCarteiras();
    }
    
    // Funções globais
    window.deleteTransaction = function(id) {
      removeTransaction(id);
      showToast('Transação excluída!');
      updateDashboard();
      renderTransactions();
      closeModals();
    };
    
    window.closeModals = function() {
      document.getElementById('delete-modal').classList.add('hidden');
      document.getElementById('delete-modal').classList.remove('flex');
      document.getElementById('clear-modal').classList.add('hidden');
      document.getElementById('clear-modal').classList.remove('flex');
      pendingDeleteId = null;
    };
    
    window.exportReport = function() {
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
   Lucro:         ${formatCurrency(totals.barLucro)}
   Saldo Final:   ${formatCurrency(totals.barTotal)}

🍔 FAST FOOD
   Saldo Inicial: ${formatCurrency(totals.fastfoodInitial)}
   Total Vendas:  ${formatCurrency(totals.fastfoodSales)}
   Lucro:         ${formatCurrency(totals.fastfoodLucro)}
   Saldo Final:   ${formatCurrency(totals.fastfoodTotal)}

💵 CAIXA CONSOLIDADO: ${formatCurrency(totals.caixaConsolidado)}

CARTEIRAS MÓVEIS
${'-'.repeat(40)}
📲 M-PESA
   Entradas:  ${formatCurrency(totals.mpesaFisico)}
   Saídas:    ${formatCurrency(totals.mpesaEletronico)}
   Saldo:     ${formatCurrency(totals.mpesaTotal)}

📲 E-MOLA
   Entradas:  ${formatCurrency(totals.emolaFisico)}
   Saídas:    ${formatCurrency(totals.emolaEletronico)}
   Saldo:     ${formatCurrency(totals.emolaTotal)}

📱 CARTEIRAS CONSOLIDADO: ${formatCurrency(totals.carteirasTotal)}

RESUMO DO DIA
${'-'.repeat(40)}
Total Vendas:  ${formatCurrency(totals.vendasHoje)}
Total Compras: ${formatCurrency(totals.comprasHoje)}
Lucro Líquido: ${formatCurrency(totals.lucroLiquido)}

💰 TOTAL GERAL: ${formatCurrency(totals.totalGeral)}

Produtos em Estoque: ${Object.keys(estoque).length}
Total de Transações: ${allTransactions.length}
${'='.repeat(60)}`;
      
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_financeiro_${date.replace(/\//g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Relatório exportado com sucesso!');
    };
    
    window.resetAllData = function() {
      if (confirm('⚠️ ATENÇÃO! Esta ação irá apagar TODOS os dados permanentemente. Deseja continuar?')) {
        removeAllTransactions();
        localStorage.removeItem(PRODUTOS_KEY);
        localStorage.removeItem(ESTOQUE_KEY);
        produtos = [];
        estoque = {};
        showToast('Todos os dados foram resetados!');
        updateDashboard();
        renderTransactions();
        renderizarProdutos();
      }
    };
    
    // Iniciar
    init();
