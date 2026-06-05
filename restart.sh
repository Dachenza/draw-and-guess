#!/usr/bin/env bash
cd "$(dirname "$0")"
bash stop.sh
sleep 2
bash start.sh
