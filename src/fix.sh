#!/bin/sh
grep -rli "$1" | xargs -i@ sed -i "s/${1}/s\/${1}/g" @
