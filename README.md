# Workflow Automation Platform

Упрощенная версия n8n-like платформы для автоматизации workflows с drag-and-drop интерфейсом и real-time выполнением.

## Быстрый запуск

Для запуска проекта используйте команду:

```bash
make run
```

Эта команда:
- Остановит существующие контейнеры (если они запущены)
- Соберет Docker образы без кеша для backend и frontend
- Запустит оба сервиса (backend и frontend) в отдельных контейнерах
- Автоматически покажет логи обоих сервисов

После запуска приложение будет доступно:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

Для просмотра логов:
```bash
make logs
```

Эта команда покажет логи обоих контейнеров (backend и frontend) одновременно.

## Архитектура

Проект использует раздельную архитектуру с отдельными Docker Compose файлами для каждого сервиса:

- **Backend**: запускается через `backend/docker-compose.dev.yml`
- **Frontend**: запускается через `frontend/docker-compose.dev.yml`

Каждый сервис работает в своем собственном Docker контейнере и сети, что обеспечивает изоляцию и упрощает разработку.

## Технологии

### Backend
- **NestJS** - прогрессивный Node.js фреймворк
- **SQLite** - легковесная база данных (через better-sqlite3)
- **TypeORM** - ORM для работы с БД
- **Socket.IO** - WebSocket для real-time обновлений
- **Docker** - контейнеризация
- **Hot Reload** - автоматическая перезагрузка при изменениях кода (с polling)

### Frontend
- **Vue 3** - прогрессивный JavaScript фреймворк
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик
- **Vue Router** - маршрутизация
- **Pinia** - управление состоянием
- **Socket.IO Client** - WebSocket клиент
- **VueFlow** - библиотека для создания node-based редакторов

## Структура проекта

```
.
├── backend/                  # Backend (NestJS)
│   ├── src/
│   │   ├── database/
│   │   │   └── entities/    # TypeORM entities
│   │   ├── workflows/       # Модуль workflows
│   │   ├── nodes/           # Модуль нод
│   │   ├── execution/       # Модуль выполнения
│   │   │   └── engine/      # Execution engine
│   │   └── websocket/       # WebSocket gateway
│   ├── docker-compose.dev.yml
│   └── Dockerfile
├── frontend/                # Frontend (Vue 3)
│   ├── src/
│   │   ├── api/             # API клиент
│   │   ├── composables/     # Vue composables
│   │   ├── components/      # Vue компоненты
│   │   └── views/           # Страницы
│   ├── docker-compose.dev.yml
│   └── Dockerfile
├── Makefile                 # Команды для управления проектом
└── README.md
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
- Автоматическое определение ошибок (статус >= 400)

### 3. Transform Node
- Трансформация JSON данных
- Поддержка выражений: `{{age > 18}}`
- Шаблонизация полей

### 4. If Node
- Условное ветвление выполнения
- Поддержка двух условий (condition1 и condition2)
- Три выходных пути: condition1 (зеленый), condition2 (синий), else (красный)
- Выражения: `{{age > 18}}`, `{{status == "active"}}`

### 5. Agent Node
- Placeholder для AI интеграции
- Хранение конфигурации

## Примеры использования

### Создание workflow

1. Откройте приложение: http://localhost:5173
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

### Пример If Node

```json
{
  "condition1": "{{age > 18}}",
  "condition2": "{{status == \"active\"}}"
}
```

- Если `condition1` истинно → выполнение идет по зеленому пути (condition1)
- Если `condition1` ложно, но `condition2` истинно → выполнение идет по синему пути (condition2)
- Если оба условия ложны → выполнение идет по красному пути (else)

## Разработка

### Команды Makefile

```bash
make run   # Запустить backend и frontend
make logs  # Показать логи обоих контейнеров
```

### Backend команды (внутри контейнера)

```bash
npm run build          # Сборка
npm run start:dev      # Development режим
npm run start:debug    # Development режим с debugger (порт 9229)
npm run start:prod     # Production режим
npm run lint           # Линтинг
npm run test           # Тесты
```

### Frontend команды (внутри контейнера)

```bash
npm run dev            # Development сервер
npm run build          # Production сборка
npm run preview        # Preview production сборки
npm run lint           # Линтинг
```

## Переменные окружения

### Backend

- `NODE_ENV` - окружение (development/production)
- `DATABASE_PATH` - путь к SQLite базе данных (по умолчанию: `/usr/src/app/database.sqlite`)
- `BACKEND_PORT` - порт backend (по умолчанию: 3000)
- `CHOKIDAR_USEPOLLING` - использование polling для hot reload (по умолчанию: true)

### Frontend

- `VITE_API_URL` - URL backend API (по умолчанию: `http://localhost:3000`)
- `FRONTEND_PORT` - порт frontend (по умолчанию: 5173)

## Hot Reload

Оба сервиса поддерживают автоматическую перезагрузку при изменениях кода:

- **Backend**: использует `nest start --watch` с polling (CHOKIDAR_USEPOLLING=true)
- **Frontend**: использует Vite HMR (Hot Module Replacement)

Изменения в коде автоматически применяются без перезапуска контейнеров.

## Отладка

Для отладки backend можно подключить debugger:

1. Backend запускается с `--inspect=0.0.0.0:9229`
2. Настройте VS Code launch.json для подключения к `localhost:9229`
3. Установите breakpoints в TypeScript коде
4. Запустите debugger в VS Code

## Лицензия

MIT
