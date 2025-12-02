# Быстрый старт

## Запуск всего в Docker (рекомендуется)

### Шаг 1: Настройка окружения

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. При необходимости отредактируйте `.env` файл

### Шаг 2: Запуск в режиме разработки

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Это запустит:
- PostgreSQL на порту 5432
- Backend на порту 3000
- Frontend на порту 5173

Откройте браузер: http://localhost:5173

### Шаг 3: Запуск в production режиме

```bash
docker-compose up --build
```

Frontend будет доступен на http://localhost (порт 80)

## Остановка

```bash
docker-compose -f docker-compose.dev.yml down
```

или для production:

```bash
docker-compose down
```

## Переменные окружения

Основные переменные в `.env`:
- `POSTGRES_USER` - пользователь PostgreSQL (по умолчанию: postgres)
- `POSTGRES_PASSWORD` - пароль PostgreSQL (по умолчанию: postgres)
- `POSTGRES_DB` - имя базы данных (по умолчанию: hackaton)
- `BACKEND_PORT` - порт backend (по умолчанию: 3000)
- `FRONTEND_PORT` - порт frontend в dev режиме (по умолчанию: 5173)

## Использование

1. Откройте http://localhost:5173 (dev) или http://localhost (production)
2. Нажмите "Create Workflow"
3. Перетащите ноды из палитры на canvas
4. Соедините ноды (drag от output handle к input handle)
5. Настройте конфигурацию нод в sidebar
6. Нажмите "Run Workflow" для запуска

## Проверка работы

### Backend Health Check
```bash
curl http://localhost:3000/health
```

### Создание тестового workflow
```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Workflow", "status": "active"}'
```

## Troubleshooting

### Проблема: Контейнеры не запускаются
- Убедитесь, что порты 3000, 5173 (dev) или 80 (prod) не заняты
- Проверьте логи: `docker-compose logs`

### Проблема: Frontend не подключается к Backend
- Убедитесь, что все контейнеры запущены: `docker ps`
- Проверьте логи frontend: `docker-compose logs frontend`
- Проверьте логи backend: `docker-compose logs backend`

### Проблема: WebSocket не работает
- Убедитесь, что backend запущен
- Проверьте консоль браузера на ошибки
- В production режиме nginx проксирует WebSocket автоматически

### Проблема: Изменения не применяются (dev режим)
- Убедитесь, что volumes правильно смонтированы
- Перезапустите контейнеры: `docker-compose restart`

## Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Пересборка образов

```bash
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```
