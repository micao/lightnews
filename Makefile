.PHONY: dev destroy dev-frontend dev-frontend-docker

dev:
	docker compose --env-file .env.dev up --build

dev-frontend:
	cd frontend && npm run dev

dev-frontend-docker:
	docker run -it --rm -p 5173:5173 -v $(shell pwd)/frontend:/app -w /app node:20-alpine npm run dev -- --host

destroy:
	docker compose --env-file .env.dev down --rmi all -v --remove-orphans
