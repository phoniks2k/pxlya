# API Websocket

This websocket provides unlimited access to many functions of the site, it is used for Discord Chat Bridge and Minecraft Bridge.

Websocket url:
`https://[old.]pixelplanet.fun/mcws`

Connection just possible with header:

```
Authorization: "Bearer APISOCKETKEY"
```

All requests are made as JSON encoded array.
### Subscribe to chat messages
```["sub", "chat"]```

All chat messages, except the once you send with `chat` or `mcchat`, will be sent to you in the form:

```["msg", name, message, id, country, channelId]```
channelId is an integer, channel 0 is `en` channel 1 is `int` and maybe more to come.
id is the user id
country is the [two-letter country code](https://www.nationsonline.org/oneworld/country_code_list.htm) in lowercase
### Subscribe to online user counter
```["sub", "online"]```

Online counter will be sent to you as typical binary packages all 15s
### Subscribe to pixel packages
```["sub", "pxl"]```

All pixels (including your own) will be sent to you as typical binary packages
### Set Pixel

```[ "setpxl", minecraftid, ip, x, y, clr ]```

(x, y, clr are integers, rest strings)

Sets a pixel with the according cooldown to minecraftid, ip. Minecraftid is optional, but ip is required if it is given. If both minecraftid and ip are null/None, the pixel will get set without cooldown check. No race condition checks are performed.

You will get a reply with:

```["retpxl", id, error, success, waitSeconds, coolDownSeconds]```

(id and error as strings, success as boolean, waitSeconds and coolDownSeconds as float)

ID is minecraftid, if given, else ip. 
error is a message on error, else null.
success... self explanatory 
waitSeconds is the current cooldown. 
coolDownSeconds is the added cooldown (negative if pixel couldn't be set because max cooldown got reached)

### Send Chat Message
```["chat", name, message, country, channelId]```

channelId is an integer, channel 0 is `en` channel 1 is `int` and maybe more to come.
(messages with the name "info" will be displayed as red notifications in the chat window)
