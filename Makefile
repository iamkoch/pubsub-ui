build-api:
	cd services/api && go run .

local:
	cd services/api/ui && npm run build
	cd services/api && PROJECT_ID=inshur-example PUBSUB_EMULATOR_HOST=localhost:8681 go run .