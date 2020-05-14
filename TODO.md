# TODO

- Create a PathFinder class that will be allotted so many "attempts"/calculations per X time period.

- Align the starting position to the *nearest* floor/ceil combo that's open; if none, stop path finding immediately.

- Align the end position to the *nearest* target cells that can contain the unit, using a gridded-Archimedian spiral;
  consider having a maximum check distance.

- Implement A* with cardinal direction path testing, aligned to the grid (AlignToCell) the whole way.

- Once the path is finally found, cleanup and begin execution of the path immediately.

  - Ensure that PathFinder cleans up every time an order is executed, finished, and/or replaced.

  - Ensure that path finding and traveling are perfectly synchronized for all clients.

- Buildings and other units need to be factored in.

  - Add in buildings and other units...

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

- Update THREE.MeshLine.js to fork.

- Properly cleanup the game on close and consider replacing F5 or Ctrl+F5.

- TODO's in code.