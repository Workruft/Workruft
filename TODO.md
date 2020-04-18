# TODO

- Send and check for pings server<->client both, to ensure livelihood of connection in silent disconnection cases. (Check on both ends, but only send a ping on receiving a ping - except for the very first, of course.)
- Establish some kind of protocol for the messages. Put the common parts in /Common/ and the rest in /Client/ and /Server/ individually.