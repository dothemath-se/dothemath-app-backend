# dothemath.app backend ![ ](https://github.com/dothemath-se/dothemath-app-backend/workflows/Deploy%20to%20Azure/badge.svg)

## Installation

`git clone ...`

`npm install`

## Köra lokalt

Följande miljövariabler behöver sättas

- SLACK_BOT_TOKEN = värdet finns i slack-chatten
- SLACK_SIGNING_SECRET = värdet finns i slack-chatten
- PORT = 80 (eller ska det vara 443?)

Kör sedan

`npm run watch-debug`

## API documentation

[API documentation](API.md)