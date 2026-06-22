#!/bin/bash
set -e

# Creates the Strapi application user on fresh database initialization.
# POSTGRES_USER (postgres admin) is set in docker-compose; DATABASE_* vars are
# passed through so this script can create the lower-privilege app role.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DATABASE_USERNAME}') THEN
            EXECUTE format(
                'CREATE USER %I WITH LOGIN PASSWORD %L',
                '${DATABASE_USERNAME}',
                '${DATABASE_PASSWORD}'
            );
        END IF;
    END
    \$\$;

    GRANT ALL PRIVILEGES ON DATABASE "${DATABASE_NAME}" TO "${DATABASE_USERNAME}";
EOSQL
