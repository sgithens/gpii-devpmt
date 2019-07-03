#!/bin/bash

until $(curl --output /dev/null --silent --fail http://localhost:8081/ready); do
    printf '.'
    sleep 5
done
npm test
