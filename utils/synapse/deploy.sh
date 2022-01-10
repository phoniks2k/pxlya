#!/bin/bash

scp ./testmodule.py root@pixelplanet:/etc/matrix-synapse/testmodule.py
ssh root@pixelplanet 'systemctl restart matrix-synapse'
