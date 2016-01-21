# @pasta/interface

Packet types:
  - Type 1: Does not wait response. Returns void
  - Type 2: Check if server received or not. Returns Promise<void>
  - Type 3: Server sends back result to client. Returns Promise<Result>
