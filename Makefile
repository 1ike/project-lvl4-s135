prepare:
	touch .bash_history
	touch .env

compose:
	docker-compose up

install:
	docker-compose start web yarn

setup: prepare compose-build compose install db-setup
	npm run flow-typed install

db-setup:
	docker-compose start web npm run sequelize db:migrate

compose-kill:
	docker-compose kill

compose-build:
	docker-compose build

test:
	docker-compose start web npm run test

compose-bash:
	docker-compose start web bash

gulp-console:
	npm run gulp console

lint:
	docker-compose start web npm run eslint src

start:
	DEBUG="application:*" npm run nodemon -- --watch .  --ext '.js' --exec npm run gulp -- server

compose-check-types:
	docker-compose start web npm run flow

build:
	rm -rf dist
	docker-compose start web npm run build

publish: build
	docker-compose start web npm publish

.PHONY: test
