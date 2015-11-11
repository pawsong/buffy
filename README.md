# pasta

[![Build Status][travis-image]][travis-url]

pasta is a platform where users can write and visualize code.

## Features

- Code editor
- Compiler
- Native modules
- 3D renderer

## Prerequisite

### node.js

node >=4 (Recommend using [nvm](https://github.com/creationix/nvm))

### GraphicsMagick or ImageMagick

```bash
brew install imagemagick
brew install graphicsmagick
```

### MongoDB

## Local Setup

```bash
# Project root
$ npm install

# `modules/compiler`
$ npm install
$ npm start

# `modules/game-srv-zone`
$ npm install
$ npm start

# `modules/console`
$ npm install
$ npm start
```

[travis-image]: https://magnum.travis-ci.com/pawsong/pasta.svg?token=cnHwryX6sPnz5qBN9pnT
[travis-url]: https://magnum.travis-ci.com/pawsong/pasta
