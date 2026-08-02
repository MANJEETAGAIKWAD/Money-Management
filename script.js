/**
 * Money Management Dashboard - Black Theme with Red (Expenses) & Green (Income/Savings/Profits) Amounts
 * Created & Maintained by Manjeet Gaikwad
 * Features: Complete State Management, Custom Category & Goal Creators, Live Transaction Ledger, Chart.js Integration & Error Boundaries
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. GLOBAL ERROR BOUNDARY & SAFE EXECUTOR
    // ---------------------------------------------------------
    window.addEventListener('error', (event) => {
        console.error('Global Error Captured:', event.error || event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Rejection Captured:', event.reason);
    });

    function safeExecuteWidget(widgetName, containerElement, renderFn) {
        try {
            renderFn();
        } catch (error) {
            console.error(`[Error Boundary] Error in widget '${widgetName}':`, error);
            if (containerElement) {
                containerElement.innerHTML = `
                    <div class="error-card">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <h4>Widget Failure</h4>
                        <p>Could not render ${widgetName}.</p>
                        <button class="btn-retry" onclick="location.reload()">Reload Dashboard</button>
                    </div>`;
            }
        }
    }

    // ---------------------------------------------------------
    // 2. STATE MANAGEMENT (PERSISTENT & FULLY CUSTOMIZABLE)
    // ---------------------------------------------------------
    const defaultState = {
        userName: 'Jeet',
        userRole: 'Actor / Mumbai',
        userAvatar: 'https://ui-avatars.com/api/?name=Jeet&background=22C55E&color=000000',
        income: 50000,
        fixed: 21500,
        food: 7500,
        cosmetics: 4000,
        clothing: 5500,
        transport: 3000,
        efMonthly: 5000,
        efCurrent: 65000,
        efTarget: 250000,
        mf: 3000,
        stocks: 2000,
        cagr: 12,
        categories: [
            { id: 'cat-1', name: 'Housing & Utilities', desc: 'Rent, Electricity, Medical', spent: 21500, total: 21500, icon: 'fa-house' },
            { id: 'cat-2', name: 'Food & Outings', desc: 'Groceries, Restaurants', spent: 7500, total: 8000, icon: 'fa-utensils' },
            { id: 'cat-3', name: 'Cosmetics & Grooming', desc: 'Professional requirement', spent: 4000, total: 4000, icon: 'fa-spray-can-sparkles' },
            { id: 'cat-4', name: 'Clothing & Fashion', desc: 'Auditions, Events', spent: 5500, total: 4000, icon: 'fa-shirt' },
            { id: 'cat-5', name: 'Transport', desc: 'Metro, Rickshaws', spent: 3000, total: 3500, icon: 'fa-car' }
        ],
        goals: [
            { id: 'goal-1', title: 'Emergency Fund', subtitle: 'Target: 6 months essential expenses', target: 250000, saved: 65000, monthly: 5000, icon: 'fa-shield-halved' }
        ],
        transactions: [
            { id: 'tx-1', date: '2026-08-01', title: 'Commercial Shoot Advance', category: 'Salary & Acting Income', type: 'income', amount: 50000 },
            { id: 'tx-2', date: '2026-08-02', title: 'Monthly Apartment Rent', category: 'Housing & Utilities', type: 'expense', amount: 18000 },
            { id: 'tx-3', date: '2026-08-02', title: 'Grocery Restock', category: 'Food & Outings', type: 'expense', amount: 4500 }
        ]
    };

    let state;
    try {
        const saved = localStorage.getItem('moneyMgmtStateV2');
        state = saved ? JSON.parse(saved) : { ...defaultState };
        if (!state.categories || state.categories.length === 0) state.categories = [...defaultState.categories];
        if (!state.goals || state.goals.length === 0) state.goals = [...defaultState.goals];
        if (!state.transactions) state.transactions = [...defaultState.transactions];
    } catch (e) {
        state = { ...defaultState };
    }

    const saveState = () => {
        try {
            localStorage.setItem('moneyMgmtStateV2', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state to localStorage', e);
        }
    };

    let ratioChartInstance = null;

    // Elements Cache
    const elements = {
        userName: document.getElementById('header-user-name'),
        userRole: document.getElementById('header-user-role'),
        userAvatar: document.getElementById('header-avatar'),
        balanceAmount: document.querySelector('.balance-amount'),
        targetSavings: document.querySelectorAll('.account-value')[0],
        fixedEssentials: document.querySelectorAll('.account-value')[1],
        profLifestyle: document.querySelectorAll('.account-value')[2],
        wealthForecast: document.getElementById('wealth-forecast-val'),
        cagrSubtitle: document.getElementById('cagr-subtitle'),
        mfDisplay: document.getElementById('mf-display-val'),
        stocksDisplay: document.getElementById('stocks-display-val'),
        budgetContainer: document.getElementById('budget-categories'),
        budgetTabContainer: document.getElementById('budget-tab-categories'),
        goalsContainer: document.getElementById('goals-list-container'),
        simSlider: document.getElementById('no-income-months'),
        simDisplay: document.getElementById('simulator-month-display'),
        simRequired: document.getElementById('sim-required'),
        simStatus: document.getElementById('sim-status'),
        alertContainer: document.getElementById('smart-alert-container'),
        txTableBody: document.getElementById('transaction-table-body'),
        analytics1y: document.getElementById('analytics-1y'),
        analytics3y: document.getElementById('analytics-3y'),
        analytics5y: document.getElementById('analytics-5y'),
        pageHeading: document.getElementById('page-title-heading')
    };

    // ---------------------------------------------------------
    // 3. UI RENDER ENGINE
    // ---------------------------------------------------------
    const renderDashboard = () => {
        // User Profile Header
        if (elements.userName) elements.userName.textContent = state.userName || 'Jeet';
        if (elements.userRole) elements.userRole.textContent = state.userRole || 'Actor / Mumbai';

        // Overview Amounts
        safeExecuteWidget('Overview Card', elements.balanceAmount?.parentElement, () => {
            const totalSavings = (state.efMonthly || 0) + (state.mf || 0) + (state.stocks || 0);
            const totalFixed = state.fixed || 0;
            const lifestyleSpent = (state.food || 0) + (state.cosmetics || 0) + (state.clothing || 0) + (state.transport || 0);

            // Income in Green
            if (elements.balanceAmount) elements.balanceAmount.textContent = `₹${(state.income || 0).toLocaleString('en-IN')}.00`;
            
            // Savings in Green
            if (elements.targetSavings) {
                elements.targetSavings.textContent = `₹${totalSavings.toLocaleString('en-IN')}.00`;
                elements.targetSavings.className = 'account-value green-amount';
            }

            // Fixed Essentials Expenses in Red
            if (elements.fixedEssentials) {
                elements.fixedEssentials.textContent = `₹${totalFixed.toLocaleString('en-IN')}.00`;
                elements.fixedEssentials.className = 'account-value red-amount';
            }

            // Lifestyle Expenses in Red
            if (elements.profLifestyle) {
                elements.profLifestyle.textContent = `₹${lifestyleSpent.toLocaleString('en-IN')}.00`;
                elements.profLifestyle.className = 'account-value red-amount';
            }
        });

        // Wealth Forecast Calculations (Green Profits/Growth)
        safeExecuteWidget('Wealth Forecast', elements.wealthForecast?.parentElement, () => {
            const pmt = (state.mf || 0) + (state.stocks || 0);
            const r = (state.cagr || 12) / 100;
            const n = 12;
            const ratePerPeriod = r / n;

            // 1 Year Future Value
            const fv1 = pmt > 0 ? pmt * ((Math.pow(1 + ratePerPeriod, 12) - 1) / ratePerPeriod) : 0;
            const fv3 = pmt > 0 ? pmt * ((Math.pow(1 + ratePerPeriod, 36) - 1) / ratePerPeriod) : 0;
            const fv5 = pmt > 0 ? pmt * ((Math.pow(1 + ratePerPeriod, 60) - 1) / ratePerPeriod) : 0;

            if (elements.wealthForecast) {
                elements.wealthForecast.textContent = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fv1);
            }
            if (elements.cagrSubtitle) elements.cagrSubtitle.textContent = `Projected portfolio value after 12 months (${state.cagr || 12}% CAGR).`;
            if (elements.mfDisplay) elements.mfDisplay.textContent = `₹${(state.mf || 0).toLocaleString('en-IN')}/mo`;
            if (elements.stocksDisplay) elements.stocksDisplay.textContent = `₹${(state.stocks || 0).toLocaleString('en-IN')}/mo`;

            // Analytics Tab Projections in Green
            if (elements.analytics1y) {
                elements.analytics1y.textContent = `₹${Math.round(fv1).toLocaleString('en-IN')}`;
                elements.analytics1y.className = 'analytics-amount';
            }
            if (elements.analytics3y) {
                elements.analytics3y.textContent = `₹${Math.round(fv3).toLocaleString('en-IN')}`;
                elements.analytics3y.className = 'analytics-amount';
            }
            if (elements.analytics5y) {
                elements.analytics5y.textContent = `₹${Math.round(fv5).toLocaleString('en-IN')}`;
                elements.analytics5y.className = 'analytics-amount';
            }
        });

        // Chart Render (Expenses = Red #ef4444, Savings = Green #22c55e)
        safeExecuteWidget('Expense Chart', document.querySelector('.chart-container'), () => {
            const totalExpenses = (state.categories || []).reduce((acc, cat) => acc + (cat.spent || 0), 0);
            const totalSavings = (state.efMonthly || 0) + (state.mf || 0) + (state.stocks || 0);

            const ctx = document.getElementById('ratioChart')?.getContext('2d');
            if (ctx) {
                if (ratioChartInstance) ratioChartInstance.destroy();
                ratioChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Expenses', 'Savings & Investments'],
                        datasets: [{
                            data: [totalExpenses, totalSavings],
                            backgroundColor: ['#ef4444', '#22c55e'],
                            hoverBackgroundColor: ['#f87171', '#4ade80'],
                            borderWidth: 0,
                            cutout: '78%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#09090b',
                                titleColor: '#ffffff',
                                bodyColor: '#a1a1aa',
                                borderColor: '#3f3f46',
                                borderWidth: 1,
                                padding: 12,
                                callbacks: {
                                    label: (ctx) => `  ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}`
                                }
                            }
                        }
                    },
                    plugins: [{
                        id: 'textCenter',
                        beforeDraw: function (chart) {
                            const width = chart.width, height = chart.height, ctx = chart.ctx;
                            ctx.restore();
                            ctx.font = "bold 1.7em Inter, sans-serif";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "#ef4444"; // Expenses total text in red
                            const text = "₹" + (totalExpenses / 1000).toFixed(1) + "k";
                            const textX = Math.round((width - ctx.measureText(text).width) / 2);
                            const textY = height / 2 - 10;
                            ctx.fillText(text, textX, textY);

                            ctx.font = "600 0.75em Inter, sans-serif";
                            ctx.fillStyle = "#a1a1aa";
                            const text2 = "TOTAL SPENT";
                            const textX2 = Math.round((width - ctx.measureText(text2).width) / 2);
                            ctx.fillText(text2, textX2, textY + 26);
                            ctx.save();
                        }
                    }]
                });
            }
        });

        // Budget Categories List Render (Dashboard & Budget Tab)
        safeExecuteWidget('Budget Categories', elements.budgetContainer, () => {
            renderCategoriesList(elements.budgetContainer, false);
            renderCategoriesList(elements.budgetTabContainer, true);
        });

        // Savings Goals Render
        safeExecuteWidget('Savings Goals', elements.goalsContainer, () => {
            renderSavingsGoals();
        });

        // Transactions Table Render
        safeExecuteWidget('Transactions Table', elements.txTableBody, () => {
            renderTransactionsTable();
        });

        updateSimulator();
    };

    // Helper: Render Budget Categories (Expenses in Red)
    const renderCategoriesList = (container, showDelete) => {
        if (!container) return;
        container.innerHTML = '';

        const overBudgetCats = [];
        state.categories.forEach(cat => {
            const pct = Math.min((cat.spent / cat.total) * 100, 100);
            const isOver = cat.spent > cat.total;
            if (isOver) overBudgetCats.push(cat.name);

            const overText = isOver
                ? `<div class="over-budget-text"><i class="fa-solid fa-circle-exclamation"></i> OVER BUDGET BY ₹${(cat.spent - cat.total).toLocaleString('en-IN')}</div>`
                : '';

            const deleteBtn = showDelete ? `<button class="cat-delete-btn" data-id="${cat.id}"><i class="fa-solid fa-trash-can"></i></button>` : '';

            container.insertAdjacentHTML('beforeend', `
                <div class="category-item">
                    <div class="cat-header">
                        <div class="cat-info">
                            <div class="cat-icon"><i class="fa-solid ${cat.icon || 'fa-tag'}"></i></div>
                            <div>
                                <div class="cat-name">${cat.name}</div>
                                <div class="cat-desc">${cat.desc || ''}</div>
                            </div>
                        </div>
                        <div class="cat-actions">
                            <div class="cat-amounts">
                                <div class="cat-spent">₹${cat.spent.toLocaleString('en-IN')}</div>
                                <div class="cat-total">of ₹${cat.total.toLocaleString('en-IN')}</div>
                            </div>
                            ${deleteBtn}
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${pct}%"></div>
                    </div>
                    ${overText}
                </div>
            `);
        });

        // Bind delete listeners if present
        container.querySelectorAll('.cat-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                state.categories = state.categories.filter(c => c.id !== id);
                saveState();
                renderDashboard();
            });
        });

        // Smart Alert Banner
        if (elements.alertContainer && !showDelete) {
            if (overBudgetCats.length > 0) {
                elements.alertContainer.innerHTML = `
                    <div class="alert-banner">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <div><strong>Smart Alert:</strong> Spending on <em>${overBudgetCats.join(' and ')}</em> has exceeded the limit. Reallocate funds to stay on target.</div>
                    </div>`;
            } else {
                elements.alertContainer.innerHTML = '';
            }
        }
    };

    // Helper: Render Savings Goals (Saved amounts in Green)
    const renderSavingsGoals = () => {
        if (!elements.goalsContainer) return;
        elements.goalsContainer.innerHTML = '';

        const mainGoal = state.goals.find(g => g.id === 'goal-1');
        if (mainGoal) {
            mainGoal.saved = state.efCurrent || 65000;
            mainGoal.target = state.efTarget || 250000;
            mainGoal.monthly = state.efMonthly || 5000;
        }

        state.goals.forEach(goal => {
            const pct = Math.min(((goal.saved / goal.target) * 100), 100).toFixed(1);
            const remaining = Math.max(0, goal.target - goal.saved);
            const months = goal.monthly > 0 ? Math.ceil(remaining / goal.monthly) : 'Infinite';
            const isCompleted = goal.saved >= goal.target;

            const badgeText = isCompleted ? 'COMPLETED 🎉' : `${pct}% DONE`;

            elements.goalsContainer.insertAdjacentHTML('beforeend', `
                <div class="goal-item">
                    <div class="goal-header">
                        <div class="goal-icon"><i class="fa-solid ${goal.icon || 'fa-bullseye'}"></i></div>
                        <div class="goal-title-row">
                            <h4>${goal.title}</h4>
                            <span class="badge">${badgeText}</span>
                        </div>
                    </div>
                    <p class="goal-subtitle">${goal.subtitle || 'Custom Financial Goal'}</p>
                    <div class="goal-progress-info">
                        <span class="saved-amount">₹${goal.saved.toLocaleString('en-IN')} <small>saved</small></span>
                        <span class="target-amount">of ₹${goal.target.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="progress-bar-container large">
                        <div class="progress-fill goal-fill" style="width: ${pct}%;"></div>
                    </div>
                    <p class="goal-eta"><i class="fa-regular fa-clock"></i> Goal ETA: <strong>${months} month${months > 1 ? 's' : ''}</strong> at ₹${goal.monthly.toLocaleString('en-IN')}/mo</p>
                </div>
            `);
        });
    };

    // Helper: Render Transactions Table (Income = Green, Expense = Red)
    const renderTransactionsTable = () => {
        if (!elements.txTableBody) return;
        elements.txTableBody.innerHTML = '';

        if (!state.transactions || state.transactions.length === 0) {
            elements.txTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 24px;">No transactions recorded yet. Click "+ Add Transaction" to create one.</td></tr>`;
            return;
        }

        state.transactions.forEach(tx => {
            const isIncome = tx.type === 'income';
            const typeBadge = `<span class="type-badge ${isIncome ? 'income' : 'expense'}">${isIncome ? 'INCOME' : 'EXPENSE'}</span>`;
            const amountFormatted = `${isIncome ? '+' : '-'}₹${tx.amount.toLocaleString('en-IN')}`;
            const amountClass = isIncome ? 'amount-green' : 'amount-red';

            elements.txTableBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${tx.date}</td>
                    <td><strong>${tx.title}</strong></td>
                    <td>${tx.category}</td>
                    <td>${typeBadge}</td>
                    <td class="${amountClass}" style="font-weight: 700;">${amountFormatted}</td>
                    <td><button class="btn-delete-item" data-id="${tx.id}"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `);
        });

        elements.txTableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                state.transactions = state.transactions.filter(t => t.id !== id);
                saveState();
                renderDashboard();
            });
        });
    };

    // ---------------------------------------------------------
    // 4. DRY SPELL SIMULATOR
    // ---------------------------------------------------------
    const updateSimulator = () => {
        safeExecuteWidget('Dry Spell Simulator', elements.simRequired?.parentElement, () => {
            if (!elements.simSlider) return;
            const months = parseInt(elements.simSlider.value) || 1;
            if (elements.simDisplay) elements.simDisplay.textContent = `${months} Month${months > 1 ? 's' : ''}`;

            const survivalMonthly = (state.fixed || 0) + (state.food || 0);
            const requiredAmount = survivalMonthly * months;
            if (elements.simRequired) elements.simRequired.textContent = `₹${requiredAmount.toLocaleString('en-IN')}`;

            if (elements.simStatus) {
                const statusBox = elements.simStatus.parentElement;
                if ((state.efCurrent || 0) >= requiredAmount) {
                    elements.simStatus.textContent = "Fund Sufficient";
                    if (statusBox) statusBox.className = "result-box highlighted";
                } else {
                    elements.simStatus.textContent = "Fund Shortfall";
                    if (statusBox) statusBox.className = "result-box danger-highlight";
                }
            }
        });
    };

    if (elements.simSlider) elements.simSlider.addEventListener('input', updateSimulator);

    // ---------------------------------------------------------
    // 5. TAB NAVIGATION ENGINE
    // ---------------------------------------------------------
    const navItems = [
        { id: 'nav-dashboard', tab: 'tab-dashboard', title: 'Dashboard' },
        { id: 'nav-transactions', tab: 'tab-transactions', title: 'Transactions Ledger' },
        { id: 'nav-budgets', tab: 'tab-budgets', title: 'Budget Allocation Manager' },
        { id: 'nav-analytics', tab: 'tab-analytics', title: 'Wealth Growth Analytics' }
    ];

    navItems.forEach(item => {
        const navEl = document.getElementById(item.id);
        if (navEl) {
            navEl.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(n => {
                    document.getElementById(n.id)?.classList.remove('active');
                    document.getElementById(n.tab)?.classList.remove('active');
                });
                navEl.classList.add('active');
                document.getElementById(item.tab)?.classList.add('active');
                if (elements.pageHeading) elements.pageHeading.textContent = item.title;
            });
        }
    });

    // ---------------------------------------------------------
    // 6. MODALS & FORMS HANDLERS
    // ---------------------------------------------------------
    const toggleModal = (modalId, active) => {
        const m = document.getElementById(modalId);
        if (m) {
            if (active) m.classList.add('active');
            else m.classList.remove('active');
        }
    };

    // Profile & Financial Settings Modal
    const openSettingsModal = () => {
        document.getElementById('input-user-name').value = state.userName || 'Jeet';
        document.getElementById('input-user-role').value = state.userRole || 'Actor / Mumbai';
        document.getElementById('input-income').value = state.income || 0;
        document.getElementById('input-fixed').value = state.fixed || 0;
        document.getElementById('input-food').value = state.food || 0;
        document.getElementById('input-cosmetics').value = state.cosmetics || 0;
        document.getElementById('input-clothing').value = state.clothing || 0;
        document.getElementById('input-transport').value = state.transport || 0;
        document.getElementById('input-ef-target').value = state.efTarget || 250000;
        document.getElementById('input-ef-current').value = state.efCurrent || 0;
        document.getElementById('input-ef-monthly').value = state.efMonthly || 0;
        document.getElementById('input-mf').value = state.mf || 0;
        document.getElementById('input-stocks').value = state.stocks || 0;
        document.getElementById('input-cagr').value = state.cagr || 12;
        toggleModal('settings-modal', true);
    };

    document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
    document.getElementById('edit-profile-trigger')?.addEventListener('click', openSettingsModal);
    document.getElementById('user-profile-widget')?.addEventListener('click', openSettingsModal);
    document.getElementById('edit-income-quick-btn')?.addEventListener('click', openSettingsModal);
    document.getElementById('edit-investment-btn')?.addEventListener('click', openSettingsModal);
    document.getElementById('edit-limits-btn')?.addEventListener('click', openSettingsModal);

    document.getElementById('close-modal-btn')?.addEventListener('click', () => toggleModal('settings-modal', false));
    document.getElementById('cancel-btn')?.addEventListener('click', () => toggleModal('settings-modal', false));

    document.getElementById('settings-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        state.userName = document.getElementById('input-user-name').value;
        state.userRole = document.getElementById('input-user-role').value;
        state.income = parseInt(document.getElementById('input-income').value) || 0;
        state.fixed = parseInt(document.getElementById('input-fixed').value) || 0;
        state.food = parseInt(document.getElementById('input-food').value) || 0;
        state.cosmetics = parseInt(document.getElementById('input-cosmetics').value) || 0;
        state.clothing = parseInt(document.getElementById('input-clothing').value) || 0;
        state.transport = parseInt(document.getElementById('input-transport').value) || 0;
        state.efTarget = parseInt(document.getElementById('input-ef-target').value) || 250000;
        state.efCurrent = parseInt(document.getElementById('input-ef-current').value) || 0;
        state.efMonthly = parseInt(document.getElementById('input-ef-monthly').value) || 0;
        state.mf = parseInt(document.getElementById('input-mf').value) || 0;
        state.stocks = parseInt(document.getElementById('input-stocks').value) || 0;
        state.cagr = parseInt(document.getElementById('input-cagr').value) || 12;

        saveState();
        renderDashboard();
        toggleModal('settings-modal', false);
    });

    // Add Transaction Modal
    const openAddTx = () => {
        document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
        toggleModal('add-transaction-modal', true);
    };

    document.getElementById('open-add-transaction-btn')?.addEventListener('click', openAddTx);
    document.getElementById('open-add-transaction-btn-2')?.addEventListener('click', openAddTx);
    document.getElementById('close-tx-modal-btn')?.addEventListener('click', () => toggleModal('add-transaction-modal', false));
    document.getElementById('cancel-tx-btn')?.addEventListener('click', () => toggleModal('add-transaction-modal', false));

    document.getElementById('add-transaction-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('tx-title').value;
        const amount = parseInt(document.getElementById('tx-amount').value) || 0;
        const type = document.getElementById('tx-type').value;
        const category = document.getElementById('tx-category').value;
        const date = document.getElementById('tx-date').value;

        const newTx = { id: 'tx-' + Date.now(), title, amount, type, category, date };
        state.transactions.unshift(newTx);

        if (type === 'expense') {
            const cat = state.categories.find(c => c.name === category);
            if (cat) cat.spent += amount;
        }

        saveState();
        renderDashboard();
        toggleModal('add-transaction-modal', false);
        document.getElementById('add-transaction-form').reset();
    });

    // Add Savings Goal Modal
    const openAddGoal = () => toggleModal('add-goal-modal', true);
    document.getElementById('open-add-goal-btn')?.addEventListener('click', openAddGoal);
    document.getElementById('close-goal-modal-btn')?.addEventListener('click', () => toggleModal('add-goal-modal', false));
    document.getElementById('cancel-goal-btn')?.addEventListener('click', () => toggleModal('add-goal-modal', false));

    document.getElementById('add-goal-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('goal-title').value;
        const target = parseInt(document.getElementById('goal-target').value) || 0;
        const saved = parseInt(document.getElementById('goal-saved').value) || 0;
        const monthly = parseInt(document.getElementById('goal-monthly').value) || 0;

        const newGoal = {
            id: 'goal-' + Date.now(),
            title,
            subtitle: `Target: ₹${target.toLocaleString('en-IN')}`,
            target,
            saved,
            monthly,
            icon: 'fa-bullseye'
        };
        state.goals.push(newGoal);

        saveState();
        renderDashboard();
        toggleModal('add-goal-modal', false);
        document.getElementById('add-goal-form').reset();
    });

    // Add Budget Category Modal
    const openAddCat = () => toggleModal('add-category-modal', true);
    document.getElementById('open-add-category-btn')?.addEventListener('click', openAddCat);
    document.getElementById('open-add-category-btn-2')?.addEventListener('click', openAddCat);
    document.getElementById('close-cat-modal-btn')?.addEventListener('click', () => toggleModal('add-category-modal', false));
    document.getElementById('cancel-cat-btn')?.addEventListener('click', () => toggleModal('add-category-modal', false));

    document.getElementById('add-category-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name-input').value;
        const desc = document.getElementById('cat-desc-input').value;
        const spent = parseInt(document.getElementById('cat-spent-input').value) || 0;
        const total = parseInt(document.getElementById('cat-total-input').value) || 0;

        const newCat = {
            id: 'cat-' + Date.now(),
            name,
            desc,
            spent,
            total,
            icon: 'fa-layer-group'
        };
        state.categories.push(newCat);

        saveState();
        renderDashboard();
        toggleModal('add-category-modal', false);
        document.getElementById('add-category-form').reset();
    });

    // Search bar filter
    document.getElementById('global-search-input')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            renderDashboard();
            return;
        }

        if (elements.txTableBody) {
            const filtered = state.transactions.filter(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query));
            elements.txTableBody.innerHTML = '';
            filtered.forEach(tx => {
                const isIncome = tx.type === 'income';
                const amountClass = isIncome ? 'amount-green' : 'amount-red';
                elements.txTableBody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${tx.date}</td>
                        <td><strong>${tx.title}</strong></td>
                        <td>${tx.category}</td>
                        <td><span class="type-badge ${isIncome ? 'income' : 'expense'}">${isIncome ? 'INCOME' : 'EXPENSE'}</span></td>
                        <td class="${amountClass}" style="font-weight: 700;">₹${tx.amount.toLocaleString('en-IN')}</td>
                        <td><button class="btn-delete-item" data-id="${tx.id}"><i class="fa-solid fa-trash"></i></button></td>
                    </tr>
                `);
            });
        }
    });

    // Initial Dashboard Render
    renderDashboard();
});
