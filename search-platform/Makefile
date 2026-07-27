.PHONY: help up down seed test lint build

help:
	@echo "Targets: up, down, seed, test, lint, build"

up:
	docker compose up -d

down:
	docker compose down

seed:
	uv run python -m seed.generate_synthetic --index uitspraken-openbaar --count 100

test:
	uv run pytest tests/ -v --tb=short

lint:
	uv run ruff check app tests
	uv run ruff format --check app tests

build:
	docker compose build
