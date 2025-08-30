build-api:
	cd services/api && go run .

build-ui:
	cd services/api/ui && npm run build

local:
	$(eval build ?= false)
	$(if $(filter $(build), true), echo "building..." && $(MAKE) build-ui)
	cd services/api && PROJECT_ID=inshur-dev0-service0 PUBSUB_EMULATOR_HOST=localhost:8681 PORT=7979 go run .

public:
	$(eval build ?= false)
	@if [ -z "$(PROJECT_ID)" ]; then echo "ERROR: PROJECT_ID is required. Usage: make public PROJECT_ID=your-project-id" && exit 1; fi
	$(if $(filter $(build), true), echo "building..." && $(MAKE) build-ui)
	cd services/api && PROJECT_ID=$(PROJECT_ID) PORT=7979 go run .