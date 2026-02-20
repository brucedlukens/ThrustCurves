#!/bin/bash
git -C /home/bruce/workspace/ThrustCurves pull
docker compose -f /ssd/docker/docker-compose.yaml up -d --build thrustcurves
