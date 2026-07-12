.PHONY: dev destroy

dev:
	docker compose --env-file .env.dev up --build

destroy:
	docker compose --env-file .env.dev down --rmi all -v --remove-orphans
