# TODO

- Facade class to clean up overlapping responsibilities between Workruft and other classes?

- Level editor?

- Buildings and other units need to be factored in.

  - Add in buildings and other units...

- Give PathFinder class so many "attempts"/calculations per X time period.

- Ensure that path finding and traveling are perfectly synchronized for all clients.

- Send and check for pings server<->client both, to ensure livelihood of connection in silent disconnection cases.
  (Check on both ends, but only send a ping on receiving a ping - except for the very first, of course.)

- Establish some kind of protocol for the messages. Put the common parts in /Common/ and the rest in /Client/ and
  /Server/ individually.

- "A client WebSocket broadcasting to every other connected WebSocket clients, excluding itself":
```js
        const wss = new WebSocket.Server({ port: 8080 });

        wss.on('connection', function connection(ws) {
          ws.on('message', function incoming(data) {
            wss.clients.forEach(function each(client) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
              }
            });
          });
        });
```

- More mouse and keyboard controls.

- Improve path-finding

  - Improve heuristic with wall-hugging factor. Relatively penalize path finding in open space.

  - End-to-start path-finding as well?

- TODO's in code.