# EazyTool ResellerClub connector

The connector runs on the allowlisted Droplet and is the only component that holds ResellerClub credentials. Vercel signs every request with `RESELLERCLUB_CONNECTOR_SECRET`.

`RESELLERCLUB_REGISTRATION_ENABLED=false` is an independent kill switch. Keep it false while testing. Availability, price, status and nameserver reads remain available; buyer creation and registration return `REGISTRATION_DISABLED`.

Never expose this service as a general ResellerClub proxy. Nginx must allow only the explicit `/v1/domains/*` routes implemented by `server.py`.
