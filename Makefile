# PhotoShare — convenience commands

.PHONY: help up down logs build clean restart status test reset

help:
	@echo "PhotoShare commands:"
	@echo "  make up         — start everything (build if needed)"
	@echo "  make down       — stop everything"
	@echo "  make logs       — tail logs from all services"
	@echo "  make build      — rebuild all images"
	@echo "  make restart    — restart everything"
	@echo "  make status     — show running containers + health"
	@echo "  make test       — smoke-test endpoints"
	@echo "  make clean      — stop & remove containers + volumes (DATA LOSS)"
	@echo "  make reset      — clean + up (fresh start)"

up:
	docker-compose up --build -d
	@echo ""
	@echo "✓ PhotoShare is starting up..."
	@echo "  Frontend:                 http://localhost:3000"
	@echo "  Auth/Image API:           http://localhost:8001"
	@echo "  Interaction/Search API:   http://localhost:8002"
	@echo ""
	@echo "Login with:  admin / admin123  (creator)"
	@echo "          or user1 / user123   (consumer)"
	@echo ""
	@echo "Run 'make logs' to follow logs."

down:
	docker-compose down

logs:
	docker-compose logs -f --tail=80

build:
	docker-compose build

restart:
	docker-compose restart

status:
	@docker-compose ps

test:
	@echo "Health checks:"
	@curl -s http://localhost:8001/health || echo "auth-image-service NOT responding"
	@echo ""
	@curl -s http://localhost:8002/health || echo "interaction-search-service NOT responding"
	@echo ""

clean:
	docker-compose down -v
	@echo "Cleaned: containers + volumes removed"

reset: clean up
