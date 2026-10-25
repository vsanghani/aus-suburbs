.PHONY: install dev api lint test build e2e openapi compose

install:
	npm install
	python3 -m venv backend/.venv
	backend/.venv/bin/pip install -e "./backend[dev]"

dev:
	npm run dev

api:
	@set -a; [ -f .env ] && . ./.env; set +a; \
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

lint:
	npm run lint
	cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check .

test:
	npm test
	cd backend && .venv/bin/pytest

build:
	npm run build

e2e:
	npm run test:e2e

openapi:
	cd backend && .venv/bin/python -m app.export_openapi > ../contracts/openapi.json
	npx openapi-typescript contracts/openapi.json -o src/api/schema.d.ts

compose:
	docker compose up --build
