# Отдельный запуск Backend и Frontend

Проект теперь поддерживает независимый запуск backend и frontend сервисов.

## Структура файлов

- `backend/docker-compose.yml` - Backend (production) - в папке backend/
- `backend/docker-compose.dev.yml` - Backend (development) - в папке backend/
- `frontend/docker-compose.yml` - Frontend (production) - в папке frontend/
- `frontend/docker-compose.dev.yml` - Frontend (development) - в папке frontend/
- `docker-compose.yml` - Полный стек (production) - в корне проекта
- `docker-compose.dev.yml` - Полный стек (development) - в корне проекта

## Запуск Backend отдельно

### Development

```bash
# Используя Makefile
make run-backend

# Или напрямую (из папки backend/)
cd backend
docker-compose -f docker-compose.dev.yml up -d
```

Backend будет доступен на `http://localhost:3000`

### Production

```bash
# Используя Makefile
make run-backend-prod

# Или напрямую (из папки backend/)
cd backend
docker-compose -f docker-compose.yml up -d
```

## Запуск Frontend отдельно

### Development

```bash
# Используя Makefile
make run-frontend

# Или напрямую (из папки frontend/)
cd frontend
docker-compose -f docker-compose.dev.yml up -d
```

Frontend будет доступен на `http://localhost:5173`

**Важно:** Убедитесь, что переменная окружения `VITE_API_URL` указывает на адрес backend:
```bash
cd frontend
VITE_API_URL=http://localhost:3000 docker-compose -f docker-compose.dev.yml up -d
```

### Production

```bash
# Используя Makefile
make run-frontend-prod

# Или напрямую с указанием BACKEND_URL (из папки frontend/)
cd frontend
BACKEND_URL=http://localhost:3000 docker-compose -f docker-compose.yml up -d
```

Frontend будет доступен на `http://localhost:80` (или порт, указанный в `FRONTEND_PORT`)

**Важно:** Обязательно установите переменную окружения `BACKEND_URL` для production:
```bash
cd frontend
export BACKEND_URL=http://localhost:3000
docker-compose -f docker-compose.yml up -d
```

## Переменные окружения

### Backend

- `NODE_ENV` - Режим работы (development/production)
- `DATABASE_PATH` - Путь к файлу базы данных SQLite (по умолчанию: `database.sqlite`)
- `BACKEND_PORT` - Порт для backend (по умолчанию: `3000`)

### Frontend

- `VITE_API_URL` - URL backend API для development (по умолчанию: `http://localhost:3000`)
- `BACKEND_URL` - URL backend для production nginx прокси (по умолчанию: `http://localhost:3000`)
- `FRONTEND_PORT` - Порт для frontend (по умолчанию: `5173` для dev, `80` для prod)

## Просмотр логов

```bash
# Backend отдельно
make logs-backend-only

# Frontend отдельно
make logs-frontend-only

# Или напрямую
cd backend && docker-compose -f docker-compose.dev.yml logs -f
cd frontend && docker-compose -f docker-compose.dev.yml logs -f
```

## Остановка сервисов

```bash
# Backend
make stop-backend
# или
cd backend && docker-compose -f docker-compose.dev.yml down

# Frontend
make stop-frontend
# или
cd frontend && docker-compose -f docker-compose.dev.yml down
```

## Примеры использования

### Разработка: Backend на локальной машине, Frontend в Docker

1. Запустите backend локально:
```bash
cd backend
npm install
npm run start:dev
```

2. Запустите frontend в Docker:
```bash
cd frontend
VITE_API_URL=http://host.docker.internal:3000 docker-compose -f docker-compose.dev.yml up -d
```

### Production: Backend и Frontend на разных серверах

1. На сервере backend:
```bash
cd backend
docker-compose -f docker-compose.yml up -d
```

2. На сервере frontend:
```bash
cd frontend
BACKEND_URL=http://backend-server:3000 docker-compose -f docker-compose.yml up -d
```

## Полный стек (как раньше)

Для запуска всего стека вместе используйте:

```bash
# Development
make run
# или
docker-compose -f docker-compose.dev.yml up -d

# Production
make run-prod
# или
docker-compose -f docker-compose.yml up -d
```

