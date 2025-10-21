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
  'src/components/admin/CourtesyUsersSection.tsx'
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if file has ConfirmDialog but is missing fragment wrapper
  if (content.includes('<ConfirmDialog />') && content.includes('return (')) {
    // Find the pattern where ConfirmDialog is added after closing tags
    // Pattern: closing tags + ConfirmDialog + closing paren
    const returnMatch = content.match(/(return \()\s*\n([\s\S]*?)(\{\/\* Modal de Confirmação \*\/\}\s*<ConfirmDialog \/>\s*\))/);

    if (returnMatch) {
      const returnStatement = returnMatch[0];

      // Check if already has fragment wrapper
      if (!returnStatement.includes('<>')) {
        // Find first JSX element after return (
        const afterReturnParen = returnStatement.substring(returnStatement.indexOf('return (') + 8);
        const firstElement = afterReturnParen.match(/^\s*<(\w+)/);

        if (firstElement) {
          // Add <> after return (
          content = content.replace(/(return \()\s*\n/, '$1\n    <>\n');

          // Add </> before ConfirmDialog
          content = content.replace(/(\{\/\* Modal de Confirmação \*\/\}\s*<ConfirmDialog \/>)\s*\)/, '$1\n    </>\n  )');

          console.log(`✅ Adicionado Fragment wrapper em: ${filePath}`);
          modified = true;
        }
      }
    }
  }

  // Fix PurchasesManager utility functions that shouldn't be async
  if (filePath.includes('PurchasesManager')) {
    if (content.includes('const formatCurrency = async (')) {
      content = content.replace(/const formatCurrency = async \(/g, 'const formatCurrency = (');
      console.log(`✅ Removido async de formatCurrency em: ${filePath}`);
      modified = true;
    }
    if (content.includes('const getStatusColor = async (')) {
      content = content.replace(/const getStatusColor = async \(/g, 'const getStatusColor = (');
      console.log(`✅ Removido async de getStatusColor em: ${filePath}`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Arquivo corrigido: ${filePath}\n`);
  } else {
    console.log(`ℹ️  Nenhuma correção necessária em: ${filePath}\n`);
  }
});

console.log('\n🎉 Correção de JSX ConfirmDialog concluída!');
