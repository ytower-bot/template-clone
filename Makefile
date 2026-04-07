dev:
	docker compose -f compose.development.yaml up --build

lint:
	bun run lint

test:
	bun run test

build-prod:
	docker compose -f compose.production.yaml build
