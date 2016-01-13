# Game client

![Game client diagram](/docs/images/game_client_diagram.svg)

**Game client diagram** ([Edit image in draw.io](https://drive.google.com/file/d/0Bxco3LDhyBU3d0ZybGRBQk5ZY0k/view?usp=sharing))

Game client is an implementation of [flux design pattern](https://facebook.github.io/flux/), which requires a unidirectional data flow to simplify many things.

## Types of game client

There are several types of game client, each of which has a special purpose and different working environment. Followings are all the types of game client:

* Main client
* IDE
* Daemon

Main client is where users play game. IDE is where users writes codes. Daemon is where user codes run.

## Client adapter

Client adapter is an adapter in [adapter pattern](https://en.wikipedia.org/wiki/Adapter_pattern), which enables state layer to work in various environment including web worker and [node.js vm](https://nodejs.org/api/vm.html).

## State layer

State layer is a javascript library that provides means to get and set game state in game client.

### Store

`Store` is game state store for game client. `Store` retrieves game state as server-sent messages via socket and provides received data to main game controller with event or getter function.

The true state of game resides in game server, so `Store` in state layer is a kind of cache store, but it does also calculate and estimate state on every frame between server-client synchronization.

`Store` does not provide setter functions. The only way to mutate `Store` state is sending messages from game server to keep the data flow in the unidirectional way.

### RPC module

RPC(Remote Procedure Call) is used in many client-server architecture, and `RPC` module provides javascript functions that sends request to game server and returns `Promise` which is resolved or rejected on server response.

## Controller

Controller receives game state from `Store` and call `RPC` functions for server request. Controller has detailed business logic, and different client type requires different controller.
