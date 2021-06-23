# florida-scrapers
### tools to extract documents from the circuit courts in Florida

## General Stack

The functionality is written in Typescript. 

The program uses Puppeteer (with Plugins) to generate a headless browser instance that traverses the Circuit court pages.

## Getting started
0. Install yarn if you haven't already.
1. Clone repository.
2. run yarn install
3. run yarn start

## Hot Reloading (Warning!)

If you don't want to have to restart the scraper everytime you make a change, you can start the program by using `yarn dev` instead of `yarn start`.

What this does is enable nodemon to watch the /src directory for any changes in the *.ts files and restarts the index.ts module.

WARNING: If you are not careful about closing the automated browsers after making changes, you may end up with dozens of chromium app instances running.

## Pre-Deployment

Before running the program in a cloud production environment, change the headless option to false in the initBrowser.ts file. Otherwise the cloud instance will try to run the browser gui and crash.
