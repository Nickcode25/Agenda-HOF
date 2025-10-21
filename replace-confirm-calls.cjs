const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/patients/PatientsList.tsx',
  'src/pages/expenses/ExpenseCategories.tsx',
  'src/pages/cash/CashRegistersList.tsx',
  'src/pages/cash/CashSessionPage.tsx',
  'src/pages/expenses/ExpensesList.tsx',
  'src/pages/sales/SalesList.tsx',
  'src/pages/stock/StockList.tsx',
  'src/pages/medical/MedicalRecordPage.tsx',
  'src/pages/medical/AnamnesisForm.tsx',
  'src/pages/professionals/ProfessionalDetail.tsx',
  'src/pages/subscriptions/PlansList.tsx',
  'src/pages/procedures/ProcedureDetail.tsx',
  'src/pages/notifications/NotificationsPage.tsx',
  'src/components/DayTimeline.tsx',
  'src/pages/subscriptions/PlanDetail.tsx',
  'src/pages/admin/CustomersManager.tsx',
  'src/pages/admin/PurchasesManager.tsx',
  'src/components/admin/CourtesyUsersSection.tsx',
  'src/components/AppointmentModal.tsx'
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Padrão 1: if (confirm('mensagem'))
  const pattern1 = /if\s*\(\s*confirm\s*\(\s*[`'"](.+?)[`'"]\s*\)\s*\)/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, (match, message) => {
      console.log(`  📝 Padrão 1 encontrado: ${message.substring(0, 50)}...`);
      return `if (await confirm({ title: 'Confirmação', message: '${message}' }))`;
    });
    modified = true;
  }

  // Padrão 2: if (confirm(`mensagem`))
  content = content.replace(/if\s*\(\s*confirm\s*\(\s*`(.+?)`\s*\)\s*\)/g, (match, message) => {
    console.log(`  📝 Padrão 2 encontrado: ${message.substring(0, 50)}...`);
    modified = true;
    return `if (await confirm({ title: 'Confirmação', message: \`${message}\` }))`;
  });

  // Padrão 3: if (!confirm('mensagem')) return
  content = content.replace(/if\s*\(\s*!confirm\s*\(\s*[`'"](.+?)[`'"]\s*\)\s*\)\s*return/g, (match, message) => {
    console.log(`  📝 Padrão 3 encontrado: ${message.substring(0, 50)}...`);
    modified = true;
    return `if (!(await confirm({ title: 'Confirmação', message: '${message}' }))) return`;
  });

  // Padrão 4: if (!confirm(`mensagem`)) return
  content = content.replace(/if\s*\(\s*!confirm\s*\(\s*`(.+?)`\s*\)\s*\)\s*return/g, (match, message) => {
    console.log(`  📝 Padrão 4 encontrado: ${message.substring(0, 50)}...`);
    modified = true;
    return `if (!(await confirm({ title: 'Confirmação', message: \`${message}\` }))) return`;
  });

  // Tornar funções async se ainda não forem
  if (modified) {
    // Procurar funções que não são async
    content = content.replace(/(\s+)(const\s+\w+\s*=\s*)\(/g, (match, spaces, funcDecl) => {
      if (match.includes('async')) return match;
      return `${spaces}${funcDecl}async (`;
    });

    content = content.replace(/(\s+)(function\s+\w+\s*)\(/g, (match, spaces, funcDecl) => {
      if (match.includes('async')) return match;
      return `${spaces}async ${funcDecl}(`;
    });

    content = content.replace(/(handle\w+)\s*=\s*\(/g, (match, funcName) => {
      if (match.includes('async')) return match;
      return `${funcName} = async (`;
    });
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Arquivo atualizado: ${filePath}\n`);
  } else {
    console.log(`ℹ️  Nenhuma modificação necessária em: ${filePath}\n`);
  }
});

console.log('\n🎉 Substituição de chamadas concluída!');
