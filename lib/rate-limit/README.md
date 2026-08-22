# Rate-limit sources

Policies were checked against the current official provider documentation on
2026-08-22:

- [IGDB API docs](https://api-docs.igdb.com/): 4 requests per second, at most
  8 open requests, and at most 10 queries per `/multiquery` request.
- [Twitch API guide](https://dev.twitch.tv/docs/api/guide): token buckets expose
  `Ratelimit-Limit`, `Ratelimit-Remaining`, and `Ratelimit-Reset`; HTTP 429 uses
  the reset time.
- [Steamworks Web API overview](https://partner.steamgames.com/doc/webapi_overview):
  no general numeric public limit is documented. The Steam defaults here are
  conservative local settings, remain configurable, and yield to headers/429.

Credentials and request URLs are never part of rate-limit diagnostics.
