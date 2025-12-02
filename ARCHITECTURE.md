# Архитектура системы автоматизации workflow

## Обзор

Система представляет собой упрощенную версию n8n-like workflow automation платформы, где пользователи могут создавать workflows из нод, соединять их и запускать последовательно.

## Backend архитектура (NestJS)

### Структура модулей

```
src/
├── database/
│   └── entities/          # TypeORM entities
│       ├── workflow.entity.ts
│       ├── node.entity.ts
│       ├── edge.entity.ts
│       ├── execution.entity.ts
│       └── execution-node.entity.ts
├── workflows/            # Модуль управления workflows
│   ├── workflows.module.ts
│   ├── workflows.service.ts
│   └── workflows.controller.ts
├── nodes/                # Модуль управления нодами
│   ├── nodes.module.ts
│   ├── nodes.service.ts
│   └── nodes.controller.ts
├── execution/            # Модуль выполнения workflows
│   ├── execution.module.ts
│   ├── execution.service.ts
│   ├── execution.controller.ts
│   └── engine/           # Execution engine
│       ├── executor.ts
│       ├── trigger.service.ts
│       ├── http.service.ts
│       ├── transform.service.ts
│       └── agent.service.ts
└── websocket/            # WebSocket для real-time обновлений
    ├── websocket.module.ts
    └── workflow.gateway.ts
```

### Основные компоненты

#### 1. Database Entities

**Workflow** - основной объект workflow
- id, name, description, status
- Связи: nodes, edges, executions

**Node** - нода в workflow
- id, type, subtype, workflowId, position
- config (JSON) для хранения конфигурации
- Специфичные поля для разных типов нод

**Edge** - связь между нодами
- id, workflowId, sourceNodeId, targetNodeId

**Execution** - выполнение workflow
- id, workflowId, status, input, output, error
- Связь с executionNodes

**ExecutionNode** - выполнение отдельной ноды
- id, executionId, nodeId, status, input, output, error, duration

#### 2. Execution Engine

**Executor** - основной класс выполнения
- `executeWorkflow()` - запускает выполнение workflow
- Топологическая сортировка нод
- Последовательное выполнение с передачей данных
- Обработка ошибок и остановка при сбое

**Node Services**:
- **TriggerService** - обработка trigger нод (manual, webhook, cron)
- **HttpService** - выполнение HTTP запросов с интерполяцией шаблонов
- **TransformService** - трансформация данных по шаблону
- **AgentService** - placeholder для AI интеграции

#### 3. WebSocket Gateway

**WorkflowGateway** - real-time обновления
- Namespace: `/ws/workflows/:workflowId`
- События:
  - `node_status_changed` - изменение статуса ноды
  - `execution_started` - начало выполнения
  - `execution_finished` - завершение выполнения
  - `execution_error` - ошибка выполнения

### API Endpoints

#### Workflows
- `GET /workflows` - список всех workflows
- `GET /workflows/:id` - получить workflow
- `POST /workflows` - создать workflow
- `PATCH /workflows/:id` - обновить workflow
- `DELETE /workflows/:id` - удалить workflow

#### Nodes
- `GET /nodes/workflow/:workflowId` - получить все ноды workflow
- `GET /nodes/:id` - получить ноду
- `POST /nodes` - создать ноду
- `PATCH /nodes/:id` - обновить ноду
- `DELETE /nodes/:id` - удалить ноду

#### Edges
- `GET /nodes/edges/workflow/:workflowId` - получить все связи
- `POST /nodes/edges` - создать связь
- `DELETE /nodes/edges/:id` - удалить связь

#### Executions
- `POST /executions/workflow/:workflowId` - запустить выполнение
- `GET /executions` - список выполнений
- `GET /executions/:id` - получить выполнение
- `GET /executions/:id/nodes` - получить выполнение нод

## Frontend архитектура (Vue 3)

### Структура

```
frontend/
├── src/
│   ├── api/              # API клиент
│   │   └── workflows.ts
│   ├── composables/      # Composables
│   │   └── useWorkflowSocket.ts
│   ├── components/       # Vue компоненты
│   │   └── NodeConfigForm.vue
│   ├── views/            # Страницы
│   │   ├── WorkflowList.vue
│   │   └── WorkflowBuilder.vue
│   ├── router/           # Vue Router
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
```

### Основные компоненты

#### 1. WorkflowBuilder
- Drag-and-drop интерфейс для создания workflows
- Визуализация нод и связей
- Редактирование конфигурации нод
- Real-time обновления статусов через WebSocket

#### 2. useWorkflowSocket
- Composable для подключения к WebSocket
- Управление статусами нод
- Обработка событий выполнения

#### 3. NodeConfigForm
- Форма редактирования конфигурации нод
- Поддержка разных типов нод
- Валидация JSON шаблонов

### Типы нод

1. **Trigger Node**
   - Manual - запуск по кнопке
   - Webhook - запуск по HTTP запросу
   - Cron - запуск по расписанию

2. **HTTP Node**
   - Выполнение HTTP запросов
   - Поддержка GET, POST, PUT, DELETE
   - Интерполяция шаблонов в URL, headers, body

3. **Transform Node**
   - Трансформация JSON данных
   - Поддержка выражений ({{age > 18}})
   - Шаблонизация полей

4. **Agent Node**
   - Placeholder для AI интеграции
   - Хранение конфигурации

## Поток выполнения

1. Пользователь создает workflow с нодами и связями
2. При запуске:
   - Загружается workflow и все ноды
   - Выполняется топологическая сортировка
   - Начинается последовательное выполнение
3. Для каждой ноды:
   - Статус: idle → progress → passed/error
   - Обновления отправляются через WebSocket
   - Результат сохраняется в БД
4. При ошибке - выполнение останавливается
5. Все логи сохраняются в PostgreSQL

## Расширяемость

Система спроектирована для легкого расширения:

1. **Новые типы нод**: добавить новый service в `execution/engine/`
2. **Новые trigger типы**: расширить `TriggerService`
3. **Новые трансформации**: расширить `TransformService`
4. **Webhook endpoints**: динамическая регистрация в `ExecutionService`
5. **Cron scheduling**: интеграция с библиотекой cron в `TriggerService`

## Безопасность

- Валидация входных данных через class-validator
- Защита от SQL инъекций через TypeORM
- CORS настройки для frontend
- WebSocket namespace изоляция

## Производительность

- Индексы на внешние ключи в БД
- Ленивая загрузка связей
- Кэширование workflow структуры
- Асинхронное выполнение нод (готово к расширению)

