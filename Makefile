.PHONY: run stop clean build rebuild logs

# Default compose file for development
COMPOSE_FILE = docker-compose.dev.yml

# Run application: build images without cache and start containers
run:
	@echo "Stopping existing containers..."
	docker-compose -f $(COMPOSE_FILE) down || true
	@echo "Building Docker images without cache..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "Starting containers..."
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Installing frontend dependencies in container..."
	docker-compose -f $(COMPOSE_FILE) exec -T frontend npm install || true
	@echo "Application is running!"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo "PostgreSQL: localhost:5432"
	@echo ""
	@echo "To view logs, run: make logs"
	@echo "To stop, run: make stop"

# Stop containers
stop:
	@echo "Stopping containers..."
	docker-compose -f $(COMPOSE_FILE) down
	@echo "Containers stopped."

# Stop containers and remove volumes
clean:
	@echo "Stopping containers and removing volumes..."
	docker-compose -f $(COMPOSE_FILE) down -v
	@echo "Cleanup complete."

# Build images without cache (without starting)
build:
	@echo "Building Docker images without cache..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "Build complete."

# Rebuild and restart
rebuild: stop build
	@echo "Starting containers..."
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Application rebuilt and restarted!"

# View logs
logs:
	docker-compose -f $(COMPOSE_FILE) logs -f

# View logs for specific service
logs-backend:
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend:
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-postgres:
	docker-compose -f $(COMPOSE_FILE) logs -f postgres

# Run production build
run-prod:
	@echo "Building production images without cache..."
	docker-compose -f docker-compose.yml build --no-cache
	@echo "Starting production containers..."
	docker-compose -f docker-compose.yml up -d
	@echo "Production application is running!"

# Stop production
stop-prod:
	@echo "Stopping production containers..."
	docker-compose -f docker-compose.yml down
	@echo "Production containers stopped."

