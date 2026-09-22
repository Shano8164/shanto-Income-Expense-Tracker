// Retrieve stored transactions from LocalStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// DOM Elements
const form = document.getElementById('transaction-form');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');

const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const netBalanceEl = document.getElementById('net-balance');
const transactionListEl = document.getElementById('transaction-list');
const downloadPdfBtn = document.getElementById('download-pdf');

// Save data to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update UI & Calculate Dashboard Totals
function updateUI() {
  transactionListEl.innerHTML = '';

  let totalIncome = 0;
  let totalExpense = 0;

  if (transactions.length === 0) {
    transactionListEl.innerHTML = `<p class="text-slate-400 text-center py-4">No transactions recorded yet.</p>`;
  } else {
    transactions.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }

      // Render List Item
      const itemEl = document.createElement('div');
      itemEl.className = 'flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700';
      itemEl.innerHTML = `
        <div>
          <h3 class="font-medium text-white">${t.title}</h3>
          <p class="text-xs text-slate-400">${t.category} • ${t.date}</p>
        </div>
        <div class="flex items-center space-x-4">
          <span class="font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}">
            ${t.type === 'income' ? '+' : '-'}$${amt.toFixed(2)}
          </span>
          <button onclick="deleteTransaction(${t.id})" class="text-slate-500 hover:text-rose-400 transition-colors" title="Delete Entry">
            ✕
          </button>
        </div>
      `;
      transactionListEl.appendChild(itemEl);
    });
  }

  const netBalance = totalIncome - totalExpense;

  totalIncomeEl.innerText = `$${totalIncome.toFixed(2)}`;
  totalExpenseEl.innerText = `$${totalExpense.toFixed(2)}`;
  netBalanceEl.innerText = `$${netBalance.toFixed(2)}`;
  
  if (netBalance < 0) {
    netBalanceEl.className = 'text-2xl font-bold mt-1 text-rose-500';
  } else {
    netBalanceEl.className = 'text-2xl font-bold mt-1 text-blue-400';
  }
}

// Add New Transaction
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value.trim() || 'General';

  if (!title || isNaN(amount) || amount <= 0) return;

  const newTransaction = {
    id: Date.now(),
    title,
    amount,
    type,
    category,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  };

  transactions.unshift(newTransaction);
  saveToLocalStorage();
  updateUI();

  // Reset Input Fields
  titleInput.value = '';
  amountInput.value = '';
  categoryInput.value = '';
});

// Delete Transaction
window.deleteTransaction = function(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToLocalStorage();
  updateUI();
};

// ==========================================
//  PDF Generation Function
// ==========================================
downloadPdfBtn.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert('No transactions available to export!');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // PDF Document Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("Income & Expense Statement", 14, 18);
  
  // Custom Header Text requested by user
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("You can easily keep track of your income and expenses using the app created by Shanto Khan.", 14, 26);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

  // Summary Calculations
  const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  // Summary Table in PDF
  doc.autoTable({
    startY: 38,
    head: [['Total Income', 'Total Expense', 'Net Balance']],
    body: [[`$${income.toFixed(2)}`, `$${expense.toFixed(2)}`, `$${balance.toFixed(2)}`]],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] }
  });

  // Detailed Transaction Rows
  const tableRows = transactions.map((t, index) => [
    index + 1,
    t.date,
    t.title,
    t.category,
    t.type.toUpperCase(),
    `${t.type === 'income' ? '+' : '-'} $${t.amount.toFixed(2)}`
  ]);

  // Main Transactions Table in PDF
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['#', 'Date', 'Title', 'Category', 'Type', 'Amount ($)']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85] }
  });

  // Save PDF
  doc.save(`Income_Expense_Report_${Date.now()}.pdf`);
});

// Initial Load
updateUI();