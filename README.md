# dothemath.app backend ![](https://github.com/dothemath-se/dothemath-app-backend/workflows/Deploy%20to%20Azure/badge.svg)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running locally](#running-locally)
- [API documentation](#api-documentation)

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
