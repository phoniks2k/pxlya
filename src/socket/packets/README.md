# Binary Websocket Packages

Note that the node Server receives in [Buffer](https://nodejs.org/api/buffer.html), while the client receives [DataViews](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView) and sends ArrayBuffers.
Therefor the server can't share the same code with the client for hydrate / dehydrate.
Most packages are unidirectional so hydrate is for either client or server and dehydrate for the other one.
Bidrectional packages have two files, one for Client, another one for Server.
