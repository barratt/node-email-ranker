# node-email-ranker

A simple nodejs webserver app that you can pass an email and it will validate and send a simulated email
to check if its a real inbox (not all mail servers support this and can return invalid responses)

To use:

- clone the repo
- run ```npm i``` to install dependencies
- run ```node index.js```
- Send a get request to localhost:3005/?e=<EMAIL ADDRESS>

Environment variables:

- PORT:   the port that the web server will listen on
- SENDER: the email address to use when sending a dummy email
