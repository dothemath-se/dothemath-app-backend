# dothemath.app backend ![](https://github.com/dothemath-se/dothemath-app-backend/workflows/Deploy%20to%20Azure/badge.svg)

## Table of Contents

- [dothemath.app backend !](#dothemathapp-backend)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running locally](#running-locally)
  - [Building for production](#building-for-production)
  - [API documentation](#api-documentation)
  - [Slack app permissions](#slack-app-permissions)
    - [Bot Token Scopes](#bot-token-scopes)
    - [User Token Scopes](#user-token-scopes)

## Prerequisites

This application requires Node.js 10 or later.

## Installation

Clone the repo  
`git clone https://github.com/dothemath-se/dothemath-app-backend.git`

Install dependencies  
`npm install`

## Configuration

These environment variables need to be set for the user running the code. (This applies on a server as well as locally.)

- SLACK_SIGNING_SECRET
- SLACK_BOT_TOKEN
- SLACK_USER_TOKEN

The values can be found on the config pages for the slack bot. This assumes a slack workspace has already been set up and a slack bot configured.

## Running locally

Compile, start the local web server on port 3000, and recompile on changes  
`npm run watch-debug`

## Building for production
 
Compile TypeScript files into dist/ folder  
`npm run build-ts`

## API documentation

[API documentation](API.md)

## Slack app permissions

These permissions need to be enabled on your Slack app:

### Bot Token Scopes

- channels:history
- chat:write
- chat:write.customize
- users:read

### User Token Scopes

- files:write
