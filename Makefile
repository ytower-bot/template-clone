dev:
	docker compose -f compose.development.yaml up --build

lint:
	bun run lint

test:
	bun run test

build-front:
	docker compose -f compose.development.yaml build front

build-back:
	docker compose -f compose.development.yaml build back

build-prod:
	docker compose -f compose.production.yaml build
