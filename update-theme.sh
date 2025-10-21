#!/bin/bash

# Script para adicionar classes light: aos arquivos
# Padrões de substituição para tema claro

# Função para adicionar classe light
add_light_class() {
    local file=$1
    
    # bg-gray-900 -> bg-gray-900 light:bg-white
    sed -i 's/bg-gray-900"/bg-gray-900 light:bg-gray-50"/g' "$file"
    sed -i "s/bg-gray-900'/bg-gray-900 light:bg-gray-50'/g" "$file"
    sed -i 's/bg-gray-900 /bg-gray-900 light:bg-gray-50 /g' "$file"
    
    # bg-gray-800 -> bg-gray-800 light:bg-white
    sed -i 's/bg-gray-800"/bg-gray-800 light:bg-white"/g' "$file"
    sed -i "s/bg-gray-800'/bg-gray-800 light:bg-white'/g" "$file"
    sed -i 's/bg-gray-800 /bg-gray-800 light:bg-white /g' "$file"
    
    # bg-gray-700 -> bg-gray-700 light:bg-gray-100
    sed -i 's/bg-gray-700"/bg-gray-700 light:bg-gray-100"/g' "$file"
    sed -i "s/bg-gray-700'/bg-gray-700 light:bg-gray-100'/g" "$file"
    sed -i 's/bg-gray-700 /bg-gray-700 light:bg-gray-100 /g' "$file"
    
    # text-white -> text-white light:text-gray-900
    sed -i 's/text-white"/text-white light:text-gray-900"/g' "$file"
    sed -i "s/text-white'/text-white light:text-gray-900'/g" "$file"
    sed -i 's/text-white /text-white light:text-gray-900 /g' "$file"
    
    # text-gray-400 -> text-gray-400 light:text-gray-600
    sed -i 's/text-gray-400"/text-gray-400 light:text-gray-600"/g' "$file"
    sed -i "s/text-gray-400'/text-gray-400 light:text-gray-600'/g" "$file"
    sed -i 's/text-gray-400 /text-gray-400 light:text-gray-600 /g' "$file"
    
    # border-gray-700 -> border-gray-700 light:border-gray-200
    sed -i 's/border-gray-700"/border-gray-700 light:border-gray-200"/g' "$file"
    sed -i "s/border-gray-700'/border-gray-700 light:border-gray-200'/g" "$file"
    sed -i 's/border-gray-700 /border-gray-700 light:border-gray-200 /g' "$file"
    
    echo "Atualizado: $file"
}

# Aplicar ao App.tsx
add_light_class "src/App.tsx"

echo "Tema aplicado com sucesso!"
