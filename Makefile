.PHONY: run logs

# Run application: build images without cache and start containers
run:
	@echo "Stopping existing containers..."
	cd backend && docker-compose -f docker-compose.dev.yml down || true
	cd frontend && docker-compose -f docker-compose.dev.yml down || true
	@echo "Building Docker images without cache..."
	cd backend && docker-compose -f docker-compose.dev.yml build --no-cache
	cd frontend && docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "Starting containers..."
	cd backend && docker-compose -f docker-compose.dev.yml up -d
	cd frontend && docker-compose -f docker-compose.dev.yml up -d
	@echo "Application is running!"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "To view logs, run: make logs"
	make logs

# View logs (all services)
logs:
	@if docker ps --format "{{.Names}}" | grep -q "^hackaton-backend-dev$$\|^hackaton-frontend-dev$$"; then \
		echo "=== Showing logs for running services ==="; \
		if docker ps --format "{{.Names}}" | grep -q "^hackaton-backend-dev$$"; then \
			docker logs -f hackaton-backend-dev 2>&1 & \
		fi; \
		if docker ps --format "{{.Names}}" | grep -q "^hackaton-frontend-dev$$"; then \
			docker logs -f hackaton-frontend-dev 2>&1 & \
		fi; \
		wait; \
	else \
		echo "No containers running. Use 'make run' to start."; \
	fi
