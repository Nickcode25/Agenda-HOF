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
  'src/pages/admin/PurchasesManager.tsx',
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

  // Fix 1: Remove async from component declarations (export default async function)
  if (content.includes('export default async function')) {
    content = content.replace(/export default async function /g, 'export default function ');
    console.log(`✅ Removido async de export default em: ${filePath}`);
    modified = true;
  }

  // Fix 2: Add async to arrow functions in onClick handlers that use await
  // Pattern: onClick={() => { if (await confirm...
  content = content.replace(/onClick=\{(\(\)\s*=>\s*\{[^}]*await[^}]*\})\}/g, (match, func) => {
    if (!func.includes('async')) {
      console.log(`✅ Adicionado async a onClick em: ${filePath}`);
      modified = true;
      return `onClick={async ${func}}`;
    }
    return match;
  });

  // Fix 3: Remove async from non-async functions that don't use await
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    // Skip if line contains 'await' or already has handleSubmit/handleDelete/handle* that should be async
    if (line.includes('await') ||
        line.match(/const\s+handle[A-Z]\w+\s*=\s*async/) ||
        line.match(/const\s+on[A-Z]\w+\s*=\s*async/)) {
      return line;
    }

    // Remove async from formatDate, generatePassword, copyCredentials, etc
    if (line.match(/const\s+(formatDate|generatePassword|copyCredentials|handleOpenModal|handleCloseModal)\s*=\s*async\s*\(/)) {
      console.log(`✅ Removido async desnecessário em: ${filePath}`);
      modified = true;
      return line.replace(/=\s*async\s*\(/, '= (');
    }

    return line;
  });

  content = fixedLines.join('\n');

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Arquivo corrigido: ${filePath}\n`);
  } else {
    console.log(`ℹ️  Nenhuma correção necessária em: ${filePath}\n`);
  }
});

console.log('\n🎉 Correção de componentes async concluída!');
