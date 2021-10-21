docker build --pull --rm -f "Dockerfile" \
--build-arg REMIX_TOKEN=${REMIX_TOKEN} \
-t remixtypeormexample:latest \
"."