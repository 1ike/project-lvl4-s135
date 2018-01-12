prepare:
	touch .bash_history
	touch .env

compose:
	docker-compose up

install:
	docker-compose run --rm web yarn

setup: prepare compose-build compose install db-setup
	npm run flow-typed install

db-setup:
	docker-compose run --rm web npm run sequelize db:migrate

compose-kill:
	docker-compose kill

compose-build:
	docker-compose build

test:
	docker-compose run --rm web npm run test

compose-bash:
	docker-compose run --rm web bash

gulp-console:
	npm run gulp console

lint:
	docker-compose run --rm web npm run eslint src

server:
	DEBUG="application:*" npm run nodemon -- --watch .  --ext '.js' --exec npm run gulp -- server

compose-check-types:
	docker-compose run --rm web npm run flow

build:
	rm -rf dist
	docker-compose run --rm web npm run build

publish: build
	docker-compose run --rm web npm publish

.PHONY: test
