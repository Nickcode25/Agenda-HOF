#!/bin/bash

# Script para iniciar Evolution API

echo "🚀 Iniciando Evolution API para Agenda HOF..."
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "Copiando .env.example para .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env e configure sua API_KEY!"
    echo "Execute: openssl rand -base64 32"
    echo "E substitua EVOLUTION_API_KEY no arquivo .env"
    echo ""
    read -p "Pressione Enter para continuar..."
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está instalado!"
    echo "Instale o Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Iniciar containers
echo "▶️  Iniciando containers..."
docker-compose up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "✅ Evolution API iniciada com sucesso!"
echo ""
echo "📍 Acessos:"
echo "   - Evolution API: http://localhost:8080"
echo "   - pgAdmin: http://localhost:5050 (usuário: admin@agendahof.com)"
echo ""
echo "📝 Próximos passos:"
echo "   1. Acesse: http://localhost:8080/manager"
echo "   2. Configure sua API Key no header: apikey"
echo "   3. Crie uma instância para conectar seu WhatsApp"
echo ""
echo "📖 Documentação completa: cat EVOLUTION_SETUP.md"
echo ""
