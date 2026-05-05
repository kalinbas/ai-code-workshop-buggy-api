.PHONY: check-setup test test-baseline test-extension test-expert test-validation test-pricing test-security run smoke

check-setup:
	npm run check-setup

test:
	npm test

test-baseline:
	npm run test:baseline

test-extension:
	npm run test:extension

test-expert:
	npm run test:expert

test-validation:
	npm run test:validation

test-pricing:
	npm run test:pricing

test-security:
	npm run test:security

run:
	npm start

smoke:
	npm run smoke
