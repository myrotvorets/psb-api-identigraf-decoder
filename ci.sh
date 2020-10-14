#!/bin/sh

mkdir -p coverage
touch test-report.xml
chmod -R a+w test-report.xml coverage
docker-compose -f docker-compose-ci.yml up --build --abort-on-container-exit --renew-anon-volumes
