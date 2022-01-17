#!/bin/sh
curl --request POST \
  --header 'content-type: application/json' \
  --url 'http://localhost:4000/api' \
  --data '{"query":"query { notes { author {username} } }"}'
