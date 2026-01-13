FROM hashicorp/terraform:1.7

# Install bash and curl for scripts
RUN apk add --no-cache bash curl

# Set bash as the default shell
SHELL ["/bin/bash", "-c"]

ENTRYPOINT ["/bin/bash"]
