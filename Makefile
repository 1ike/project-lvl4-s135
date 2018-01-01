install:
	npm i

start:
	npm run babel-node -- src/bin/page-loader.js https://ru.hexlet.io/courses

d:
	npm run babel-node -- --inspect-brk src/bin/page-loader.js https://ru.hexlet.io/courses

debug:
	DEBUG="page-loader:*" npm run babel-node --  src/bin/page-loader.js http://ya.ru

build: lint
	npm run build

b:
	npm run build

lint:
	npm run eslint src

fix:
	npm run eslint --fix src

test:
	npm run test

t:
	npm run test-watch

publish:
	npm publish
