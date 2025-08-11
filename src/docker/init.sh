
#!/bin/bash
set -e

psql -U postgres -h localhost -p 54322 -f /docker/init_multitenant.sql
