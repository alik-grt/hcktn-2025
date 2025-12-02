# Workflow Automation Platform

Упрощенная версия n8n-like платформы для автоматизации workflows с drag-and-drop интерфейсом и real-time выполнением.

## Технологии

### Backend
- **NestJS** - прогрессивный Node.js фреймворк
- **PostgreSQL** - реляционная база данных
- **TypeORM** - ORM для работы с БД
- **Socket.IO** - WebSocket для real-time обновлений
- **Docker** - контейнеризация

### Frontend
- **Vue 3** - прогрессивный JavaScript фреймворк
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик
- **Vue Router** - маршрутизация
- **Pinia** - управление состоянием
- **Socket.IO Client** - WebSocket клиент

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)

### Запуск с Docker

1. Клонируйте репозиторий и перейдите в директорию проекта

2. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

3. Запустите backend в режиме разработки:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

4. В отдельном терминале установите зависимости frontend и запустите:
```bash
cd frontend
npm install
npm run dev
```

5. Откройте браузер: http://localhost:5173

### Локальная разработка

#### Backend

1. Установите зависимости:
```bash
npm install
```

2. Запустите PostgreSQL через Docker:
```bash
docker-compose -f docker-compose.dev.yml up postgres -d
```

3. Запустите backend:
```bash
npm run start:dev
```

#### Frontend

1. Перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите dev сервер:
```bash
npm run dev
```

## Структура проекта

```
.
├── src/                    # Backend (NestJS)
│   ├── database/
│   │   └── entities/      # TypeORM entities
│   ├── workflows/         # Модуль workflows
│   ├── nodes/             # Модуль нод
│   ├── execution/         # Модуль выполнения
│   │   └── engine/        # Execution engine
│   └── websocket/         # WebSocket gateway
├── frontend/              # Frontend (Vue 3)
│   ├── src/
│   │   ├── api/           # API клиент
│   │   ├── composables/   # Vue composables
│   │   ├── components/    # Vue компоненты
│   │   └── views/         # Страницы
│   └── package.json
├── docker-compose.yml     # Production конфигурация
├── docker-compose.dev.yml # Development конфигурация
└── Dockerfile             # Docker образ для backend
```

## API Endpoints

### Workflows
- `GET /workflows` - список workflows
- `GET /workflows/:id` - получить workflow
- `POST /workflows` - создать workflow
- `PATCH /workflows/:id` - обновить workflow
- `DELETE /workflows/:id` - удалить workflow

### Nodes
- `GET /nodes/workflow/:workflowId` - получить ноды workflow
- `POST /nodes` - создать ноду
- `PATCH /nodes/:id` - обновить ноду
- `DELETE /nodes/:id` - удалить ноду

### Edges
- `GET /nodes/edges/workflow/:workflowId` - получить связи
- `POST /nodes/edges` - создать связь
- `DELETE /nodes/edges/:id` - удалить связь

### Executions
- `POST /executions/workflow/:workflowId` - запустить выполнение
- `GET /executions` - список выполнений
- `GET /executions/:id` - получить выполнение

## WebSocket Events

Подключение: `ws://localhost:3000/ws/workflows/:workflowId`

### События от сервера:
- `node_status_changed` - изменение статуса ноды
- `execution_started` - начало выполнения
- `execution_finished` - завершение выполнения
- `execution_error` - ошибка выполнения

## Типы нод

### 1. Trigger Node
- **Manual** - запуск по кнопке
- **Webhook** - запуск по HTTP запросу
- **Cron** - запуск по расписанию

### 2. HTTP Node
- Выполнение HTTP запросов (GET, POST, PUT, DELETE)
- Интерполяция шаблонов: `{{variable}}`
- Кастомные headers и body

### 3. Transform Node
- Трансформация JSON данных
- Поддержка выражений: `{{age > 18}}`
- Шаблонизация полей

### 4. Agent Node
- Placeholder для AI интеграции
- Хранение конфигурации

## Примеры использования

### Создание workflow

1. Откройте приложение
2. Нажмите "Create Workflow"
3. Перетащите ноды из палитры на canvas
4. Соедините ноды (drag от output handle к input handle)
5. Настройте конфигурацию нод в sidebar
6. Нажмите "Run Workflow"

### Пример HTTP Node

```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{token}}"
  },
  "bodyTemplate": "{\"name\": \"{{name}}\", \"age\": {{age}}}"
}
```

### Пример Transform Node

```json
{
  "template": {
    "username": "{{name}}",
    "isAdult": "{{age > 18}}",
    "fullName": "{{firstName}} {{lastName}}"
  }
}
```

## Разработка

### Backend команды

```bash
npm run build          # Сборка
npm run start:dev      # Development режим
npm run start:prod     # Production режим
npm run lint           # Линтинг
npm run test           # Тесты
```

### Frontend команды

```bash
npm run dev            # Development сервер
npm run build          # Production сборка
npm run preview        # Preview production сборки
npm run lint           # Линтинг
```

## Переменные окружения

См. `.env.example` для списка переменных окружения.

Основные:
- `POSTGRES_USER` - пользователь PostgreSQL
- `POSTGRES_PASSWORD` - пароль PostgreSQL
- `POSTGRES_DB` - имя базы данных
- `DATABASE_HOST` - хост базы данных
- `BACKEND_PORT` - порт backend (по умолчанию 3000)

## Архитектура

Подробное описание архитектуры см. в [ARCHITECTURE.md](./ARCHITECTURE.md)

## Лицензия

MIT
