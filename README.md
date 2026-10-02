# Nexus-Public-CI

Public runners verify the private AI Collaboration repository without printing private build/test output. Code CI and authenticated live smoke are separate checks; a code pass does not prove NVIDIA answered.

Configure `AI_COLLAB_CI_TOKEN` for resource owner `6076446993`, repository `AI-collaboration-`, with **Contents: read**, **Pull requests: read**, and **Commit statuses: write**, including any required organization approval. A 404 on a private API request can indicate missing authorization; the workflow reports the exact endpoint and relevant permission without logging token values or response content.

Live smoke also requires `AI_COLLABORATION_BEARER_TOKEN` matching the deployed service. Store credentials only in Actions secrets. After correcting access, manually rerun the failed workflow; the schedule deduplicates previously attempted commits to avoid repeatedly spending runner time.

Historical repair evidence and outstanding production/learning boundaries are in [issue #1](https://github.com/6076446993/Nexus-Public-CI/issues/1). Its September verification records do not establish current October token access or live-service health.
