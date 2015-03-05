prjs
====
Show GitHub pull requests

# Demo
[You can try it (Go to Heroku)](https://prjs.herokuapp.com/).

# Required environment
- node.js
- redis
- mongodb

# Development
Install npm, gulp and tsd.
```sh
npm install -g npm gulp tsd
```

Install packages and typescript definition files.

```sh
npm install
tsd reinstall -so
```

Finally, you can run.

```sh
npm start
```
