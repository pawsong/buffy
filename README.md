# pasta

pasta is a platform where users can write and visualize code.

## Features

- Code editor
- Compiler
- Native modules
- 3D renderer

## Prerequisite

### GraphicsMagick or ImageMagick

```bash
brew install imagemagick
brew install graphicsmagick
```

### MongoDB

## Local Setup

```bash
# Project root
$ git submodule init
$ git submodule update
$ npm install

# In subdirectories under `modules` directory
$ npm install
$ npm run link

# `modules/compiler`
$ npm start

# `modules/game-srv-zone`
$ npm start

# `modules/console`
$ npm start
```
