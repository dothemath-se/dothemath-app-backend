# dothemath.app backend

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=dothemath-se_dothemath-app-backend&metric=alert_status)](https://sonarcloud.io/dashboard?id=dothemath-se_dothemath-app-backend)
[![Deploy to Azure status](https://github.com/dothemath-se/dothemath-app-backend/workflows/Deploy%20to%20Azure/badge.svg)](https://github.com/dothemath-se/dothemath-app-backend/actions?query=workflow%3A%22Deploy+to+Azure%22)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Slack app permissions](#slack-app-permissions)
  - [Bot token scopes](#bot-token-scopes)
  - [User token scopes](#user-token-scopes)
- [Running locally](#running-locally)
- [Building for production](#building-for-production)
- [API documentation](#api-documentation)

## Prerequisites

- Node.js 14.x
- Yarn >=1.22.4 <2

## Installation

Clone the repo  
`git clone https://github.com/dothemath-se/dothemath-app-backend.git`

Install dependencies  
`yarn`

## Running locally

Compile, start the local web server on port 3000, and recompile on changes  
`yarn dev`

## Building for production

Compile TypeScript files into dist/ folder  
`yarn build`

## Configuration

These environment variables need to be set for the user running the code. (This applies on a server as well as locally.)

- SLACK_SIGNING_SECRET
- SLACK_BOT_TOKEN
- SLACK_USER_TOKEN

The values can be found on the config pages for the slack app.

## Slack app permissions

These permissions need to be enabled on your Slack app:

### Bot token scopes

- channels:history
- chat:write
- chat:write.customize
- users:read

### User token scopes

- files:write

## API documentation

[API documentation](API.md)
