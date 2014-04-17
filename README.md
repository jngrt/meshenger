meshenger
=========

Meshenger is a Forban-inspired messaging software used for a speculative broadcast communication project. The starting point is an electronic messaging system running on a wireless mesh network, composed of both fixed and moving nodes. The messages propagate through the network when devices that come in contact with each other synchronize their content. That means it has a non-hierarchical structure, where every node receives, relays and broadcasts messages.

Using Meshenger, each node in the network will synchronize all the messages on the device. Devices detect each other by continously broadcasting an identifier packet while listening to those of other nodes. As soon as two (or more) nodes detect each other they will try to synchronize the messages on each node.

The users of the network can interface with the nodes to send or receive messages by using the webbrowser of their smartphone or computer. The messages can be received and sent at any time, but they are only synchronized in the network when other nodes are encountered. Users make contact lists by exchanging public GPG keys that are used both as an address and a way to encode messages for a specific person. Public messages can be sent in plain text. These messages get synchronized across the network untill they expire after a given time or if they have travelled across a certain number of nodes, to prevent messages from traversing the network indefinately.

Meshenger is supposed to run on an Open-WRT router that has been configured to work in mesh networks (for details how to configure see the project wiki).
