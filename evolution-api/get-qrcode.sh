#!/bin/bash

API_URL="http://localhost:8080"
API_KEY="PkhtfB2FWvwb2hq8l1JrzWJv2oNG2YJiMZ95FCy7CQg="
INSTANCE="agendahof"

echo "🔍 Buscando QR Code da instância: $INSTANCE"
echo "⏳ Aguardando QR Code ser gerado..."
echo ""

for i in {1..30}; do
    RESPONSE=$(curl -s -X GET "$API_URL/instance/connect/$INSTANCE" -H "apikey: $API_KEY")

    # Verificar se tem base64 na resposta
    if echo "$RESPONSE" | grep -q "base64\|data:image"; then
        echo "✅ QR Code encontrado!"
        echo ""
        echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'base64' in data:
        print('QR Code (base64):', data['base64'][:100], '...')
    elif 'code' in data:
        print('QR Code:', data['code'][:100], '...')
    print('')
    print('✅ Acesse o visualizador em:')
    print('   file:///home/nicolas/Agenda-HOF/evolution-api/qrcode-viewer.html')
    print('')
    print('   Ou clique em \"Atualizar QR Code\" no navegador')
except:
    print(sys.stdin.read())
"
        exit 0
    fi

    # Verificar status
    if echo "$RESPONSE" | grep -q "count"; then
        COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('count', 0))" 2>/dev/null)
        echo "Tentativa $i/30 - Count: $COUNT"
    else
        echo "Tentativa $i/30"
    fi

    sleep 2
done

echo ""
echo "⚠️  QR Code não foi gerado após 60 segundos"
echo ""
echo "Possíveis soluções:"
echo "1. Recarregue a página: file:///home/nicolas/Agenda-HOF/evolution-api/qrcode-viewer.html"
echo "2. Verifique os logs: docker logs evolution_api"
echo "3. Recrie a instância rodando novamente este script"
