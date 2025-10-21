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

  // Verificar se já tem o import do useConfirm
  if (!content.includes("import { useConfirm }")) {
    // Encontrar a última linha de import
    const importLines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex !== -1) {
      importLines.splice(lastImportIndex + 1, 0, "import { useConfirm } from '@/hooks/useConfirm'");
      content = importLines.join('\n');
      modified = true;
      console.log(`✅ Adicionado import do useConfirm em ${filePath}`);
    }
  }

  // Verificar se já tem o hook useConfirm declarado
  if (!content.includes('const { confirm, ConfirmDialog } = useConfirm()')) {
    // Procurar pelo nome da função/componente
    const functionMatch = content.match(/export default function (\w+)/);

    if (functionMatch) {
      const functionName = functionMatch[1];

      // Encontrar onde declarar o hook (após outros hooks)
      const hookPattern = /const .+ = use\w+\([^)]*\)/g;
      const hooks = [...content.matchAll(hookPattern)];

      if (hooks.length > 0) {
        const lastHook = hooks[hooks.length - 1];
        const insertPosition = lastHook.index + lastHook[0].length;

        content = content.slice(0, insertPosition) +
                  '\n  const { confirm, ConfirmDialog } = useConfirm()' +
                  content.slice(insertPosition);
        modified = true;
        console.log(`✅ Adicionado hook useConfirm em ${filePath}`);
      }
    }
  }

  // Adicionar <ConfirmDialog /> antes do fechamento do componente, se ainda não existir
  if (!content.includes('<ConfirmDialog />')) {
    // Encontrar o último </div> ou </>  antes do fechamento da função
    const returnMatch = content.match(/return \(([\s\S]*)\n\s*\)\s*\n\s*}/);

    if (returnMatch) {
      const returnContent = returnMatch[1];
      const lines = returnContent.split('\n');

      // Encontrar a última tag de fechamento
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === '</div>' || lines[i].trim() === '</>') {
          const indent = lines[i].match(/^(\s*)/)[1];
          lines.splice(i + 1, 0, '', `${indent}{/* Modal de Confirmação */}`, `${indent}<ConfirmDialog />`);
          break;
        }
      }

      const newReturnContent = lines.join('\n');
      content = content.replace(returnMatch[0], `return (${newReturnContent}\n  )\n}`);
      modified = true;
      console.log(`✅ Adicionado <ConfirmDialog /> em ${filePath}`);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Arquivo atualizado: ${filePath}\n`);
  } else {
    console.log(`ℹ️  Nenhuma modificação necessária em: ${filePath}\n`);
  }
});

console.log('\n🎉 Substituição concluída!');
console.log('\n⚠️  PRÓXIMOS PASSOS:');
console.log('1. Verifique manualmente cada arquivo');
console.log('2. Substitua as chamadas confirm() por await confirm({...})');
console.log('3. Execute: npx tsc --noEmit');
console.log('4. Faça o commit das mudanças');
