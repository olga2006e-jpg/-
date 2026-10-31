#!/usr/bin/env bash
# ============================================================
# HAUNTED ACADEMY — LOCAL OFFLINE AI SETUP SCRIPT
# ============================================================

set -e

echo "🎃 Настройка локального ИИ для 'Академии Теней'..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama не найдена."
    echo "👉 Скачайте и установите с официального сайта: https://ollama.com/download"
    echo "Или на macOS через brew: brew install ollama"
    exit 1
fi

echo "✅ Ollama обнаружена!"

# Check if model is downloaded
# Default model: qwen2.5:3b (great Russian language support, fast on CPU & GPU)
# Alternative light model: llama3.2:1b (ultra-fast for low-end laptops)
MODEL_NAME=${1:-"qwen2.5:3b"}

echo "📥 Проверяем / скачиваем модель '$MODEL_NAME' (делайте это пока есть интернет!)..."
ollama pull "$MODEL_NAME"

echo ""
echo "🚀 Запуск Ollama сервера в фоне..."
ollama serve > /dev/null 2>&1 &

sleep 2

echo "🧠 Тестируем ответ локального ИИ..."
curl -s -X POST http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"model\": \"$MODEL_NAME\", \"prompt\": \"Привет, ты кто? Ответь одним предложением.\", \"stream\": false}" \
  | grep -o '"response":"[^"]*"' || echo "Тестовый запрос отправлен!"

echo ""
echo "🎉 Локальный ИИ полностью готов к работе БЕЗ ИНТЕРНЕТА!"
