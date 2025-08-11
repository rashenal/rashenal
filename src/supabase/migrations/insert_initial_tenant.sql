
-- insert_initial_tenant.sql

insert into tenants (name) values ('Default Tenant') returning id;
