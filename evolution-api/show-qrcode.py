#!/usr/bin/env python3
"""
Script para forçar geração e exibição do QR Code da Evolution API
"""
import requests
import time
import json
import base64
from io import BytesIO

API_URL = "http://localhost:8080"
API_KEY = "PkhtfB2FWvwb2hq8l1JrzWJv2oNG2YJiMZ95FCy7CQg="
INSTANCE = "agendahof"

headers = {
    "apikey": API_KEY,
    "Content-Type": "application/json"
}

print("🔍 Buscando QR Code para instância:", INSTANCE)
print("=" * 60)

# Tentar por 30 segundos
for attempt in range(30):
    try:
        response = requests.get(
            f"{API_URL}/instance/connect/{INSTANCE}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()

            # Verificar se tem QR Code
            if 'base64' in data:
                print("\n✅ QR CODE ENCONTRADO!\n")
                qr_code = data['base64']
                print("QR Code (base64):", qr_code[:100] + "...")
                print("\nCopie o código base64 acima e cole em:")
                print("https://base64.guru/converter/decode/image")
                print("\nOu abra o arquivo HTML em:")
                print("file:///home/nicolas/Agenda-HOF/evolution-api/qrcode-viewer.html")

                # Salvar em arquivo HTML
                html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>QR Code - Agenda HOF</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }}
        h1 {{ color: #333; }}
        img {{ max-width: 400px; border-radius: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Escaneie o QR Code</h1>
        <p>Instância: <strong>{INSTANCE}</strong></p>
        <img src="{qr_code}" alt="QR Code WhatsApp"/>
        <p style="margin-top: 20px; color: #666;">
            Abra o WhatsApp no celular e escaneie este código
        </p>
    </div>
</body>
</html>
                """

                with open('/home/nicolas/Agenda-HOF/evolution-api/qrcode-display.html', 'w') as f:
                    f.write(html_content)

                print("\n✅ QR Code salvo em: qrcode-display.html")
                print("Abrindo no navegador...")

                import subprocess
                subprocess.run(['xdg-open', '/home/nicolas/Agenda-HOF/evolution-api/qrcode-display.html'])

                break

            elif 'code' in data:
                print("\n✅ QR CODE ENCONTRADO!\n")
                print("QR Code:", data['code'][:100] + "...")
                break

            else:
                count = data.get('count', 0)
                print(f"⏳ Tentativa {attempt + 1}/30 - Aguardando QR Code... (count: {count})")

        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text}")

    except Exception as e:
        print(f"⚠️  Erro na tentativa {attempt + 1}: {e}")

    time.sleep(2)

else:
    print("\n❌ QR Code não foi gerado após 60 segundos")
    print("\nPossíveis soluções:")
    print("1. Recarregue o Manager: http://localhost:8080/manager")
    print("2. Verifique os logs: docker logs evolution_api")
    print("3. Tente usar o pareamento por código em vez de QR Code")
