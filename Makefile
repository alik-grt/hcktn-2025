.PHONY: run stop clean build rebuild logs i

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

# View logs (all services)
logs:
	@if docker ps --format "{{.Names}}" | grep -q "^hackaton-backend-dev$$\|^hackaton-frontend-dev$$"; then \
		echo "=== Showing logs for running services ==="; \
		if docker ps --format "{{.Names}}" | grep -q "^hackaton-backend-dev$$"; then \
			echo "Backend:"; \
			cd backend && docker-compose -f docker-compose.dev.yml logs -f --tail=50; \
		fi; \
		if docker ps --format "{{.Names}}" | grep -q "^hackaton-frontend-dev$$"; then \
			echo "Frontend:"; \
			cd frontend && docker-compose -f docker-compose.dev.yml logs -f --tail=50; \
		fi; \
	else \
		docker-compose -f $(COMPOSE_FILE) logs -f 2>/dev/null || echo "No containers running. Use 'make run' to start."; \
	fi

# View logs for specific service (full stack)
logs-backend:
	@if docker ps --format "{{.Names}}" | grep -q "hackaton-backend-dev"; then \
		cd backend && docker-compose -f docker-compose.dev.yml logs -f; \
	else \
		docker-compose -f $(COMPOSE_FILE) logs -f backend 2>/dev/null || echo "Backend not running"; \
	fi

logs-frontend:
	@if docker ps --format "{{.Names}}" | grep -q "hackaton-frontend-dev"; then \
		cd frontend && docker-compose -f docker-compose.dev.yml logs -f; \
	else \
		docker-compose -f $(COMPOSE_FILE) logs -f frontend 2>/dev/null || echo "Frontend not running"; \
	fi

# Install dependencies in both frontend and backend
i:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Dependencies installed successfully!"

# Run backend only (development)
run-backend:
	@echo "Stopping existing backend containers..."
	cd backend && docker-compose -f docker-compose.dev.yml down || true
	@echo "Building backend Docker image without cache..."
	cd backend && docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "Starting backend container..."
	cd backend && docker-compose -f docker-compose.dev.yml up -d
	@echo "Backend is running!"
	@echo "Backend: http://localhost:3000"
	@echo ""
	@echo "To view logs, run: make logs-backend-only"
	@echo "To stop, run: make stop-backend"

# Stop backend
stop-backend:
	@echo "Stopping backend container..."
	cd backend && docker-compose -f docker-compose.dev.yml down
	@echo "Backend stopped."

# Run backend production
run-backend-prod:
	@echo "Building backend production image without cache..."
	cd backend && docker-compose -f docker-compose.yml build --no-cache
	@echo "Starting backend production container..."
	cd backend && docker-compose -f docker-compose.yml up -d
	@echo "Backend production is running!"
	@echo "Backend: http://localhost:3000"

# Stop backend production
stop-backend-prod:
	@echo "Stopping backend production container..."
	cd backend && docker-compose -f docker-compose.yml down
	@echo "Backend production stopped."

# Run frontend only (development)
run-frontend:
	@echo "Stopping existing frontend containers..."
	cd frontend && docker-compose -f docker-compose.dev.yml down || true
	@echo "Building frontend Docker image without cache..."
	cd frontend && docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "Starting frontend container..."
	cd frontend && docker-compose -f docker-compose.dev.yml up -d
	@echo "Frontend is running!"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "To view logs, run: make logs-frontend-only"
	@echo "To stop, run: make stop-frontend"

# Stop frontend
stop-frontend:
	@echo "Stopping frontend container..."
	cd frontend && docker-compose -f docker-compose.dev.yml down
	@echo "Frontend stopped."

# Run frontend production
run-frontend-prod:
	@echo "Building frontend production image without cache..."
	cd frontend && docker-compose -f docker-compose.yml build --no-cache
	@echo "Starting frontend production container..."
	cd frontend && docker-compose -f docker-compose.yml up -d
	@echo "Frontend production is running!"
	@echo "Frontend: http://localhost:80"
	@echo ""
	@echo "Make sure BACKEND_URL environment variable is set!"

# Stop frontend production
stop-frontend-prod:
	@echo "Stopping frontend production container..."
	cd frontend && docker-compose -f docker-compose.yml down
	@echo "Frontend production stopped."

# View logs for standalone services
logs-backend-only:
	cd backend && docker-compose -f docker-compose.dev.yml logs -f

logs-frontend-only:
	cd frontend && docker-compose -f docker-compose.dev.yml logs -f

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

