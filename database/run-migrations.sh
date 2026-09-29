#!/bin/sh
set -eu

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
create table if not exists schema_migrations (
  filename text primary key,
  applied_at timestamp with time zone not null default now()
);
"

for file in /migrations/*.sql; do
  [ -e "$file" ] || continue

  filename="$(basename "$file")"

  already_applied="$(psql "$DATABASE_URL" -At -c "select count(*) from schema_migrations where filename = '$filename';")"

  if [ "$already_applied" = "1" ]; then
    echo "Skipping already applied migration: $filename"
    continue
  fi

  echo "Applying migration: $filename"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "insert into schema_migrations (filename) values ('$filename');"
done

echo "Migrations completed."