<<<<<<< HEAD
--
-- PostgreSQL database dump
--

\restrict F3gD3tCzORKg29vF0f7SQy3L1ltD1roICsNX2FT3bTdyqdtiAg71qxGso90OUUv

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
--SET idle_in_transaction_session_timeout = 0;
--SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    asset_type character varying(50) NOT NULL,
    owner_id uuid,
    location character varying(255),
    status character varying(50) NOT NULL,
    confidentiality integer NOT NULL,
    integrity integer NOT NULL,
    availability integer NOT NULL,
    criticality_score double precision NOT NULL,
    criticality_level character varying(20) NOT NULL,
    clause_ref character varying(50),
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    plan_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    trial_ends_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    resource character varying(127) NOT NULL,
    action character varying(64) NOT NULL,
    description character varying(255),
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    max_users integer NOT NULL,
    max_documents integer NOT NULL,
    has_ai_features boolean NOT NULL,
    has_audit_room boolean NOT NULL,
    has_integrations boolean NOT NULL,
    has_capa_tracker boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    id uuid NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    is_system_role boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    organization_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    is_active boolean NOT NULL,
    is_superadmin boolean NOT NULL,
    last_login_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
af8da8d134ad
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (organization_id, name, description, asset_type, owner_id, location, status, confidentiality, integrity, availability, criticality_score, criticality_level, clause_ref, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (plan_id, name, slug, status, trial_ends_at, id, created_at, updated_at) FROM stdin;
199a5618-c9ef-48d0-bdb6-15f64514e85b	Pipi org	pipi-org	active	\N	666563eb-dc34-4e9c-a26e-df5c5503cdd3	2026-04-22 14:34:36.523902-04	2026-04-22 14:34:36.523902-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	Pipidos org	pipidos-org	active	\N	dfbdd1cf-0a9d-45c7-92c6-091d40089822	2026-04-22 14:35:27.131621-04	2026-04-22 14:35:27.131621-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	Pipi dos	pipi-dos	active	\N	95c8377d-a0c8-4deb-a045-bccb31b63310	2026-04-22 21:00:17.776432-04	2026-04-22 21:00:17.776432-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	pepe sa	pepe-sa	active	\N	56547497-dadb-4f47-a0d1-ae88bf7483d4	2026-04-22 22:20:10.198106-04	2026-04-22 22:20:10.198106-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	carlos sa	carlos-sa	active	\N	93ca62e6-46bc-4e09-bc39-6ff903a13e40	2026-04-22 22:26:22.912409-04	2026-04-22 22:26:22.912409-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	js spa	js-spa-	active	\N	d3e11097-a7fa-4811-b0ce-0e42fd3fae64	2026-04-22 22:28:53.112247-04	2026-04-22 22:28:53.112247-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	jeta	jeta	active	\N	76fa649a-bcd8-4f0f-a502-cbdcd9a17739	2026-04-22 22:31:48.689335-04	2026-04-22 22:31:48.689335-04
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (resource, action, description, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (name, slug, max_users, max_documents, has_ai_features, has_audit_room, has_integrations, has_capa_tracker, id, created_at, updated_at) FROM stdin;
Starter	starter	5	20	f	f	f	f	199a5618-c9ef-48d0-bdb6-15f64514e85b	2026-04-22 14:33:52.230909-04	2026-04-22 14:33:52.230909-04
Professional	professional	20	200	t	t	f	t	66e25735-7e27-40eb-b7c1-9d42022b4e3c	2026-04-22 14:33:52.230909-04	2026-04-22 14:33:52.230909-04
Enterprise	enterprise	999	9999	t	t	t	t	2f57a2a4-3c00-4a6d-81cb-909d4c167833	2026-04-22 14:33:52.230909-04	2026-04-22 14:33:52.230909-04
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (user_id, token_hash, expires_at, is_revoked, created_at, id, updated_at) FROM stdin;
f64897a3-83a4-495d-9b4c-421ee93f79ba	852009a389655c8759ba01851e9e667ad73405f3eadaab159df0aac7e8b48db9	2026-04-29 14:34:37.061088-04	f	2026-04-22 14:34:37.061088-04	753f958c-b5d8-4f3d-b4bc-815a3dcd15f4	2026-04-22 14:34:37.067334-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	c43f15036f808ece83b29cf74464308d9067482ec600a9d5cf3f2b236b421768	2026-04-29 14:35:27.620636-04	f	2026-04-22 14:35:27.620636-04	087f11e9-60c6-454b-bc0e-795b5b67e745	2026-04-22 14:35:27.620636-04
f64897a3-83a4-495d-9b4c-421ee93f79ba	a738a196838d7d66f279a82f0c9b382a4a7ca98593e72f48c4d06465d7183e69	2026-04-29 14:36:01.469159-04	f	2026-04-22 14:36:01.469159-04	4a728ff3-fdb4-46dc-a169-5a7e28c02b67	2026-04-22 14:36:01.475721-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	a969a0e8f810394261e9c24aba9deab7d29c48ce90f11b15500a0ae9f5a55c28	2026-04-29 14:36:28.469577-04	t	2026-04-22 14:36:28.469577-04	db578a84-35b0-482c-893d-484806a1d2d0	2026-04-22 14:37:22.974685-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	c9eb8a809a0fe5c0529abeea602286846f59254556a758f8f9feaab2e599b683	2026-04-29 14:37:22.978213-04	f	2026-04-22 14:37:22.978213-04	e405eb93-0654-4850-a3bb-9f945eb1bb3a	2026-04-22 14:37:22.978213-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	70c914517364a19fe0d06106851c8135b04c242245561b693561927004de7422	2026-04-29 14:38:47.984489-04	f	2026-04-22 14:38:47.984489-04	e0515baa-3ecf-473a-b67e-333312217c56	2026-04-22 14:38:47.986391-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	ba1489cd3f65c72caed34f8bd851fc88ede92aadbc54bb52400d4e6d1d579713	2026-04-29 15:36:12.258761-04	f	2026-04-22 15:36:12.258761-04	a4fbdbbc-b9d1-48fa-8120-374686371141	2026-04-22 15:36:12.273747-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	a5350402e7c409f15152d1e7db9678dc7ebaf21e8d064ae6c32d60845339c859	2026-04-29 20:58:24.168132-04	f	2026-04-22 20:58:24.168132-04	b7a849cd-6037-4e11-8db2-ed62b8e6de81	2026-04-22 20:58:24.185364-04
c89e0cc7-ffc4-459e-b445-e7485d093224	2c3c7d92072f2e5b6e8a32ed840b5f009c1a2fe43fd5cac3a31f1081a07f4141	2026-04-29 21:00:18.320226-04	f	2026-04-22 21:00:18.320226-04	938f5605-8114-423d-a2d3-392c83d7d5be	2026-04-22 21:00:18.320226-04
1d8388f2-2a46-4534-92fe-7ec6c3da24b8	5abd8675163036ef2327a58d369f07c8852f40796007079131fea897dd816ff0	2026-04-29 21:02:32.494033-04	f	2026-04-22 21:02:32.494033-04	f597a8f3-eb53-4f22-b75f-5291dff085ba	2026-04-22 21:02:32.498226-04
f64897a3-83a4-495d-9b4c-421ee93f79ba	ff2c5620846f8c6995b292250f87c3624babfa1cc642943546be2c16bf8bbe4a	2026-04-29 21:58:51.856852-04	t	2026-04-22 21:58:51.856852-04	5fa61b88-0acd-440d-ad90-cf6baa982047	2026-04-22 22:09:55.355785-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	e496367772d221d19236aeb8362de58e16595b6348a4afda332e866524d10c8f	2026-04-29 22:15:56.878262-04	t	2026-04-22 22:15:56.878262-04	51c04d1d-7f4d-4dfe-8787-a3def123deef	2026-04-22 22:17:36.18364-04
33d7710e-3562-4582-9ca6-27d65919bc7b	6f09ceb16e71c5b7e4aa89c6b63621773a590323f56da7bc1a15794d4a69a8a4	2026-04-29 22:20:10.673854-04	t	2026-04-22 22:20:10.673854-04	46bb1cff-e1cd-41e6-935a-f99c35973c12	2026-04-22 22:25:24.394521-04
08abbe3a-5706-49a2-9d4e-a1436e041880	ee9f95fddea8363ab250504d0de75cbdf808b678c6c42f84358c0b719da8acbf	2026-04-29 22:26:23.46118-04	t	2026-04-22 22:26:23.46118-04	e0ea1566-9b68-4b3b-867f-7d4956a4b927	2026-04-22 22:26:59.505419-04
7982cdc3-dd93-4748-95b3-1f73d9ab604a	db77ee23e5b4d717b0e55b499311c1ef0f45ebdb7dfc937714940984f01eb715	2026-04-29 22:28:53.653022-04	t	2026-04-22 22:28:53.653022-04	5dd4651b-5635-4b97-ad53-e238d4b49955	2026-04-22 22:29:35.964716-04
b73b4ae7-3fca-4bd4-ad4c-6c1825ac933e	5aaa3d41b6b19b713d9a7b5b9773e022c53e4d4a142bcdae53e2e03f8bf44138	2026-04-29 22:31:49.19134-04	t	2026-04-22 22:31:49.19134-04	02b1968c-c15e-48ed-9af0-5a710ec4b97d	2026-04-22 22:31:53.116134-04
7982cdc3-dd93-4748-95b3-1f73d9ab604a	97a3c5714ac64a4865b007e38ecb65793a030c220268d7148223ee500e74026c	2026-04-29 22:33:36.32293-04	t	2026-04-22 22:33:36.32293-04	ac8fb2bc-35c9-4b51-bce2-f05145936a4f	2026-04-23 09:48:16.317046-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	19a3aa3fd94f6d14bef92bf7b45774507c2666f4da330382be6f3194376345b5	2026-04-30 09:56:20.396719-04	t	2026-04-23 09:56:20.396719-04	706e27be-a53b-4d03-9472-1b3788c3496c	2026-04-23 09:56:35.792269-04
f64897a3-83a4-495d-9b4c-421ee93f79ba	ed7ca98d7cf94b07f85a44f3f5c817252da9ded6f3a5fa2463eb082e2f54186e	2026-04-30 10:23:07.967714-04	f	2026-04-23 10:23:07.967714-04	bd67cb96-9f6c-4bd2-b27b-22d01dbd74dc	2026-04-23 10:23:07.976305-04
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (organization_id, name, description, is_system_role, id, created_at, updated_at) FROM stdin;
666563eb-dc34-4e9c-a26e-df5c5503cdd3	owner	System rol: owner	t	f3ed53fd-497f-493c-bfc2-185b3057d5ad	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	admin	System rol: admin	t	4e58e1ec-0283-4959-bad0-ab7236e7b988	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	auditor	System rol: auditor	t	b76ba6df-ddba-4637-be96-156c7d54c472	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	viewer	System rol: viewer	t	d7182513-6010-4918-a03b-830b254e4a3a	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	employee	System rol: employee	t	2090e574-8ae9-47e2-ad2e-5031caed74ba	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	owner	System rol: owner	t	9d445bd7-4502-411d-83dc-66104e45118a	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	admin	System rol: admin	t	d8eeae05-e405-4d21-9c22-8d432275de51	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	auditor	System rol: auditor	t	026baf6e-dc20-46e1-8ab4-83254af5920b	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	viewer	System rol: viewer	t	75a03798-fcfb-4a07-a64c-c3a7d914642a	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	employee	System rol: employee	t	f0efbd54-374b-42b7-a8ee-32fa7ffc850e	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
95c8377d-a0c8-4deb-a045-bccb31b63310	owner	System rol: owner	t	7beb479a-69d2-4ca1-b6fd-5c9d624b6fe2	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	admin	System rol: admin	t	8276861d-4c1e-49d8-b0d1-2839dbdc156a	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	auditor	System rol: auditor	t	b93e9388-e4ac-4fb3-bbb4-fd252d6a0b82	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	viewer	System rol: viewer	t	50db501f-acab-4470-a75f-c590276b6e98	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	employee	System rol: employee	t	6900f9d2-bf05-4512-b089-8ec81c2cb7ba	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	owner	System rol: owner	t	bf449026-77fb-431c-b654-d4e10b7d13a2	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	admin	System rol: admin	t	ffb36938-acf8-4891-9cc2-2728e99a69f5	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	auditor	System rol: auditor	t	cbd0e44d-c2fc-4aff-83d3-290a373fcbd1	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	viewer	System rol: viewer	t	5125756a-ed2f-43ae-9cdb-b791c7bf377a	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	employee	System rol: employee	t	e49fc021-359f-42e2-b02b-363948968859	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	owner	System rol: owner	t	dcee2b97-a4a2-417d-9d11-510770ef8ef7	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	admin	System rol: admin	t	b83be822-91de-4795-a70a-02d0311c3d7a	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	auditor	System rol: auditor	t	f91c30a0-b247-492e-be98-238a9234b6f4	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	viewer	System rol: viewer	t	bfb33c74-fb55-4230-9254-baaab9ee69aa	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	employee	System rol: employee	t	4fc73a77-15c9-44fc-b3f5-f50a32a7f777	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	owner	System rol: owner	t	40a5a3f1-1ed9-4532-b5c7-2177b43ac92f	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	admin	System rol: admin	t	9c0300c6-eb6c-4236-8b82-34f6481ae8df	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	auditor	System rol: auditor	t	69e96fa7-a671-4f85-9473-7196dc44b212	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	viewer	System rol: viewer	t	565e620b-1e39-4920-9304-9f2e31d416c6	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	employee	System rol: employee	t	bdaf7810-af2a-473e-8fdf-1bf0232f2f95	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	owner	System rol: owner	t	7f56a40c-6812-4311-9b2b-d42a7fceb9ea	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	admin	System rol: admin	t	95b1c58c-77db-4eb1-9ebb-6ac18775b05e	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	auditor	System rol: auditor	t	7df49a05-56f6-4c98-beef-636d860e5c7f	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	viewer	System rol: viewer	t	f1694ea1-7a02-45ac-bd84-527fd70224cd	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	employee	System rol: employee	t	bd32f4d3-02dd-4a4d-9145-d3fc3788d1bf	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id, assigned_at) FROM stdin;
f64897a3-83a4-495d-9b4c-421ee93f79ba	f3ed53fd-497f-493c-bfc2-185b3057d5ad	2026-04-22 14:34:37.072077-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	9d445bd7-4502-411d-83dc-66104e45118a	2026-04-22 14:35:27.625156-04
c89e0cc7-ffc4-459e-b445-e7485d093224	7beb479a-69d2-4ca1-b6fd-5c9d624b6fe2	2026-04-22 21:00:18.325066-04
1d8388f2-2a46-4534-92fe-7ec6c3da24b8	026baf6e-dc20-46e1-8ab4-83254af5920b	2026-04-22 21:01:59.326097-04
1d8388f2-2a46-4534-92fe-7ec6c3da24b8	75a03798-fcfb-4a07-a64c-c3a7d914642a	2026-04-22 21:04:26.062043-04
33d7710e-3562-4582-9ca6-27d65919bc7b	bf449026-77fb-431c-b654-d4e10b7d13a2	2026-04-22 22:20:10.678393-04
08abbe3a-5706-49a2-9d4e-a1436e041880	dcee2b97-a4a2-417d-9d11-510770ef8ef7	2026-04-22 22:26:23.46118-04
7982cdc3-dd93-4748-95b3-1f73d9ab604a	40a5a3f1-1ed9-4532-b5c7-2177b43ac92f	2026-04-22 22:28:53.655811-04
b73b4ae7-3fca-4bd4-ad4c-6c1825ac933e	7f56a40c-6812-4311-9b2b-d42a7fceb9ea	2026-04-22 22:31:49.199833-04
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (organization_id, email, hashed_password, full_name, is_active, is_superadmin, last_login_at, id, created_at, updated_at) FROM stdin;
95c8377d-a0c8-4deb-a045-bccb31b63310	felipe@gmail.com	$2b$12$v06hb9tUPVoVdJfm2XqsjOyK1dNP/JkS3xdIS0QuaovszCFUt95ki	Felipe	t	f	\N	c89e0cc7-ffc4-459e-b445-e7485d093224	2026-04-22 21:00:18.311768-04	2026-04-22 21:00:18.311768-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	camilo@gmail.com	$2b$12$Dzp.YPzd6N2k2eq2m.zw1eUDTQMsnz1HuHtEA1AOanbpFg2iAW/Uy	Camilo	t	f	2026-04-22 21:02:32.494033-04	1d8388f2-2a46-4534-92fe-7ec6c3da24b8	2026-04-22 21:01:59.32285-04	2026-04-22 21:02:32.498226-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	pepe@gmail.com	$2b$12$iWw1OD2T1WHfioV046jWseB8HxOABDvCroCMEkl6xQoPZqYbiYatu	Pepe Pelon	t	f	\N	33d7710e-3562-4582-9ca6-27d65919bc7b	2026-04-22 22:20:10.669472-04	2026-04-22 22:20:10.669472-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	carlos@gmail.com	$2b$12$sIQLoafa7eUz4LJc.wQXueuOprN9kPA/sRsaZK8RK5x35LyAdDnJK	Carlos pe	t	f	\N	08abbe3a-5706-49a2-9d4e-a1436e041880	2026-04-22 22:26:23.46118-04	2026-04-22 22:26:23.46118-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	jeraldystolzenbach@gmail.com	$2b$12$WcNBswWoyqmuWCHcqOissONMkqJLGOVaKecvado0K2Q4edErImw0W	Jeraldy Stolzenbach	t	f	\N	b73b4ae7-3fca-4bd4-ad4c-6c1825ac933e	2026-04-22 22:31:49.19134-04	2026-04-22 22:31:49.19134-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	jeraldystoolzenbach@gmail.com	$2b$12$X9TrDAAf9Nnd35EBW7u0q.b5Q/RE/QdJRJYyIaef4jDQ6Ff/zDTQG	Jeraldy Stolzenbach	t	f	2026-04-22 22:33:36.32293-04	7982cdc3-dd93-4748-95b3-1f73d9ab604a	2026-04-22 22:28:53.644973-04	2026-04-22 22:33:36.32293-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	andresdos@gmail.com	$2b$12$vh9EdI1.6KpnxEZHr8Gux.WMbmUnA2pqi9QkRtgHjsgDY4q2QBhOG	Andres Felipe dos	t	f	2026-04-23 09:56:20.345514-04	5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	2026-04-22 14:35:27.620636-04	2026-04-23 09:56:20.402049-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	andres@gmail.com	$2b$12$KtIjiWX1VO6TB3qh6Ll8Ze6jK01j9HZCkJEdlbt5DBRdfXM0BrdTm	Andres Felipe	t	f	2026-04-23 10:23:07.967714-04	f64897a3-83a4-495d-9b4c-421ee93f79ba	2026-04-22 14:34:37.036203-04	2026-04-23 10:23:07.976305-04
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_slug_key UNIQUE (slug);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: permissions uq_permission_resource_action; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT uq_permission_resource_action UNIQUE (resource, action);


--
-- Name: roles uq_role_name_org; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uq_role_name_org UNIQUE (name, organization_id);


--
-- Name: role_permissions uq_role_permission; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_permission PRIMARY KEY (role_id, permission_id);


--
-- Name: user_roles uq_user_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uq_user_role PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_assets_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assets_organization_id ON public.assets USING btree (organization_id);


--
-- Name: ix_permissions_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_action ON public.permissions USING btree (action);


--
-- Name: ix_permissions_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_resource ON public.permissions USING btree (resource);


--
-- Name: ix_refresh_tokens_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_refresh_tokens_token_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: ix_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: ix_roles_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_roles_organization_id ON public.roles USING btree (organization_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_organization_id ON public.users USING btree (organization_id);


--
-- Name: assets assets_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: assets assets_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organizations organizations_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict F3gD3tCzORKg29vF0f7SQy3L1ltD1roICsNX2FT3bTdyqdtiAg71qxGso90OUUv

=======
--
-- PostgreSQL database dump
--

\restrict F3gD3tCzORKg29vF0f7SQy3L1ltD1roICsNX2FT3bTdyqdtiAg71qxGso90OUUv

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
--SET idle_in_transaction_session_timeout = 0;
--SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    asset_type character varying(50) NOT NULL,
    owner_id uuid,
    location character varying(255),
    status character varying(50) NOT NULL,
    confidentiality integer NOT NULL,
    integrity integer NOT NULL,
    availability integer NOT NULL,
    criticality_score double precision NOT NULL,
    criticality_level character varying(20) NOT NULL,
    clause_ref character varying(50),
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    plan_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    trial_ends_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    resource character varying(127) NOT NULL,
    action character varying(64) NOT NULL,
    description character varying(255),
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    max_users integer NOT NULL,
    max_documents integer NOT NULL,
    has_ai_features boolean NOT NULL,
    has_audit_room boolean NOT NULL,
    has_integrations boolean NOT NULL,
    has_capa_tracker boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    id uuid NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    is_system_role boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    organization_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    is_active boolean NOT NULL,
    is_superadmin boolean NOT NULL,
    last_login_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
af8da8d134ad
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (organization_id, name, description, asset_type, owner_id, location, status, confidentiality, integrity, availability, criticality_score, criticality_level, clause_ref, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (plan_id, name, slug, status, trial_ends_at, id, created_at, updated_at) FROM stdin;
199a5618-c9ef-48d0-bdb6-15f64514e85b	Pipi org	pipi-org	active	\N	666563eb-dc34-4e9c-a26e-df5c5503cdd3	2026-04-22 14:34:36.523902-04	2026-04-22 14:34:36.523902-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	Pipidos org	pipidos-org	active	\N	dfbdd1cf-0a9d-45c7-92c6-091d40089822	2026-04-22 14:35:27.131621-04	2026-04-22 14:35:27.131621-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	Pipi dos	pipi-dos	active	\N	95c8377d-a0c8-4deb-a045-bccb31b63310	2026-04-22 21:00:17.776432-04	2026-04-22 21:00:17.776432-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	pepe sa	pepe-sa	active	\N	56547497-dadb-4f47-a0d1-ae88bf7483d4	2026-04-22 22:20:10.198106-04	2026-04-22 22:20:10.198106-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	carlos sa	carlos-sa	active	\N	93ca62e6-46bc-4e09-bc39-6ff903a13e40	2026-04-22 22:26:22.912409-04	2026-04-22 22:26:22.912409-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	js spa	js-spa-	active	\N	d3e11097-a7fa-4811-b0ce-0e42fd3fae64	2026-04-22 22:28:53.112247-04	2026-04-22 22:28:53.112247-04
199a5618-c9ef-48d0-bdb6-15f64514e85b	jeta	jeta	active	\N	76fa649a-bcd8-4f0f-a502-cbdcd9a17739	2026-04-22 22:31:48.689335-04	2026-04-22 22:31:48.689335-04
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (resource, action, description, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (name, slug, max_users, max_documents, has_ai_features, has_audit_room, has_integrations, has_capa_tracker, id, created_at, updated_at) FROM stdin;
Starter	starter	5	20	f	f	f	f	199a5618-c9ef-48d0-bdb6-15f64514e85b	2026-04-22 14:33:52.230909-04	2026-04-22 14:33:52.230909-04
Professional	professional	20	200	t	t	f	t	66e25735-7e27-40eb-b7c1-9d42022b4e3c	2026-04-22 14:33:52.230909-04	2026-04-22 14:33:52.230909-04
Enterprise	enterprise	999	9999	t	t	t	t	2f57a2a4-3c00-4a6d-81cb-909d4c167833	2026-04-22 14:33:52.230909-04	2026-04-22 14:33:52.230909-04
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (user_id, token_hash, expires_at, is_revoked, created_at, id, updated_at) FROM stdin;
f64897a3-83a4-495d-9b4c-421ee93f79ba	852009a389655c8759ba01851e9e667ad73405f3eadaab159df0aac7e8b48db9	2026-04-29 14:34:37.061088-04	f	2026-04-22 14:34:37.061088-04	753f958c-b5d8-4f3d-b4bc-815a3dcd15f4	2026-04-22 14:34:37.067334-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	c43f15036f808ece83b29cf74464308d9067482ec600a9d5cf3f2b236b421768	2026-04-29 14:35:27.620636-04	f	2026-04-22 14:35:27.620636-04	087f11e9-60c6-454b-bc0e-795b5b67e745	2026-04-22 14:35:27.620636-04
f64897a3-83a4-495d-9b4c-421ee93f79ba	a738a196838d7d66f279a82f0c9b382a4a7ca98593e72f48c4d06465d7183e69	2026-04-29 14:36:01.469159-04	f	2026-04-22 14:36:01.469159-04	4a728ff3-fdb4-46dc-a169-5a7e28c02b67	2026-04-22 14:36:01.475721-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	a969a0e8f810394261e9c24aba9deab7d29c48ce90f11b15500a0ae9f5a55c28	2026-04-29 14:36:28.469577-04	t	2026-04-22 14:36:28.469577-04	db578a84-35b0-482c-893d-484806a1d2d0	2026-04-22 14:37:22.974685-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	c9eb8a809a0fe5c0529abeea602286846f59254556a758f8f9feaab2e599b683	2026-04-29 14:37:22.978213-04	f	2026-04-22 14:37:22.978213-04	e405eb93-0654-4850-a3bb-9f945eb1bb3a	2026-04-22 14:37:22.978213-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	70c914517364a19fe0d06106851c8135b04c242245561b693561927004de7422	2026-04-29 14:38:47.984489-04	f	2026-04-22 14:38:47.984489-04	e0515baa-3ecf-473a-b67e-333312217c56	2026-04-22 14:38:47.986391-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	ba1489cd3f65c72caed34f8bd851fc88ede92aadbc54bb52400d4e6d1d579713	2026-04-29 15:36:12.258761-04	f	2026-04-22 15:36:12.258761-04	a4fbdbbc-b9d1-48fa-8120-374686371141	2026-04-22 15:36:12.273747-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	a5350402e7c409f15152d1e7db9678dc7ebaf21e8d064ae6c32d60845339c859	2026-04-29 20:58:24.168132-04	f	2026-04-22 20:58:24.168132-04	b7a849cd-6037-4e11-8db2-ed62b8e6de81	2026-04-22 20:58:24.185364-04
c89e0cc7-ffc4-459e-b445-e7485d093224	2c3c7d92072f2e5b6e8a32ed840b5f009c1a2fe43fd5cac3a31f1081a07f4141	2026-04-29 21:00:18.320226-04	f	2026-04-22 21:00:18.320226-04	938f5605-8114-423d-a2d3-392c83d7d5be	2026-04-22 21:00:18.320226-04
1d8388f2-2a46-4534-92fe-7ec6c3da24b8	5abd8675163036ef2327a58d369f07c8852f40796007079131fea897dd816ff0	2026-04-29 21:02:32.494033-04	f	2026-04-22 21:02:32.494033-04	f597a8f3-eb53-4f22-b75f-5291dff085ba	2026-04-22 21:02:32.498226-04
f64897a3-83a4-495d-9b4c-421ee93f79ba	ff2c5620846f8c6995b292250f87c3624babfa1cc642943546be2c16bf8bbe4a	2026-04-29 21:58:51.856852-04	t	2026-04-22 21:58:51.856852-04	5fa61b88-0acd-440d-ad90-cf6baa982047	2026-04-22 22:09:55.355785-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	e496367772d221d19236aeb8362de58e16595b6348a4afda332e866524d10c8f	2026-04-29 22:15:56.878262-04	t	2026-04-22 22:15:56.878262-04	51c04d1d-7f4d-4dfe-8787-a3def123deef	2026-04-22 22:17:36.18364-04
33d7710e-3562-4582-9ca6-27d65919bc7b	6f09ceb16e71c5b7e4aa89c6b63621773a590323f56da7bc1a15794d4a69a8a4	2026-04-29 22:20:10.673854-04	t	2026-04-22 22:20:10.673854-04	46bb1cff-e1cd-41e6-935a-f99c35973c12	2026-04-22 22:25:24.394521-04
08abbe3a-5706-49a2-9d4e-a1436e041880	ee9f95fddea8363ab250504d0de75cbdf808b678c6c42f84358c0b719da8acbf	2026-04-29 22:26:23.46118-04	t	2026-04-22 22:26:23.46118-04	e0ea1566-9b68-4b3b-867f-7d4956a4b927	2026-04-22 22:26:59.505419-04
7982cdc3-dd93-4748-95b3-1f73d9ab604a	db77ee23e5b4d717b0e55b499311c1ef0f45ebdb7dfc937714940984f01eb715	2026-04-29 22:28:53.653022-04	t	2026-04-22 22:28:53.653022-04	5dd4651b-5635-4b97-ad53-e238d4b49955	2026-04-22 22:29:35.964716-04
b73b4ae7-3fca-4bd4-ad4c-6c1825ac933e	5aaa3d41b6b19b713d9a7b5b9773e022c53e4d4a142bcdae53e2e03f8bf44138	2026-04-29 22:31:49.19134-04	t	2026-04-22 22:31:49.19134-04	02b1968c-c15e-48ed-9af0-5a710ec4b97d	2026-04-22 22:31:53.116134-04
7982cdc3-dd93-4748-95b3-1f73d9ab604a	97a3c5714ac64a4865b007e38ecb65793a030c220268d7148223ee500e74026c	2026-04-29 22:33:36.32293-04	t	2026-04-22 22:33:36.32293-04	ac8fb2bc-35c9-4b51-bce2-f05145936a4f	2026-04-23 09:48:16.317046-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	19a3aa3fd94f6d14bef92bf7b45774507c2666f4da330382be6f3194376345b5	2026-04-30 09:56:20.396719-04	t	2026-04-23 09:56:20.396719-04	706e27be-a53b-4d03-9472-1b3788c3496c	2026-04-23 09:56:35.792269-04
f64897a3-83a4-495d-9b4c-421ee93f79ba	ed7ca98d7cf94b07f85a44f3f5c817252da9ded6f3a5fa2463eb082e2f54186e	2026-04-30 10:23:07.967714-04	f	2026-04-23 10:23:07.967714-04	bd67cb96-9f6c-4bd2-b27b-22d01dbd74dc	2026-04-23 10:23:07.976305-04
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (organization_id, name, description, is_system_role, id, created_at, updated_at) FROM stdin;
666563eb-dc34-4e9c-a26e-df5c5503cdd3	owner	System rol: owner	t	f3ed53fd-497f-493c-bfc2-185b3057d5ad	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	admin	System rol: admin	t	4e58e1ec-0283-4959-bad0-ab7236e7b988	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	auditor	System rol: auditor	t	b76ba6df-ddba-4637-be96-156c7d54c472	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	viewer	System rol: viewer	t	d7182513-6010-4918-a03b-830b254e4a3a	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	employee	System rol: employee	t	2090e574-8ae9-47e2-ad2e-5031caed74ba	2026-04-22 14:34:36.530011-04	2026-04-22 14:34:36.530011-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	owner	System rol: owner	t	9d445bd7-4502-411d-83dc-66104e45118a	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	admin	System rol: admin	t	d8eeae05-e405-4d21-9c22-8d432275de51	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	auditor	System rol: auditor	t	026baf6e-dc20-46e1-8ab4-83254af5920b	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	viewer	System rol: viewer	t	75a03798-fcfb-4a07-a64c-c3a7d914642a	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	employee	System rol: employee	t	f0efbd54-374b-42b7-a8ee-32fa7ffc850e	2026-04-22 14:35:27.133667-04	2026-04-22 14:35:27.133667-04
95c8377d-a0c8-4deb-a045-bccb31b63310	owner	System rol: owner	t	7beb479a-69d2-4ca1-b6fd-5c9d624b6fe2	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	admin	System rol: admin	t	8276861d-4c1e-49d8-b0d1-2839dbdc156a	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	auditor	System rol: auditor	t	b93e9388-e4ac-4fb3-bbb4-fd252d6a0b82	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	viewer	System rol: viewer	t	50db501f-acab-4470-a75f-c590276b6e98	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
95c8377d-a0c8-4deb-a045-bccb31b63310	employee	System rol: employee	t	6900f9d2-bf05-4512-b089-8ec81c2cb7ba	2026-04-22 21:00:17.779974-04	2026-04-22 21:00:17.779974-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	owner	System rol: owner	t	bf449026-77fb-431c-b654-d4e10b7d13a2	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	admin	System rol: admin	t	ffb36938-acf8-4891-9cc2-2728e99a69f5	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	auditor	System rol: auditor	t	cbd0e44d-c2fc-4aff-83d3-290a373fcbd1	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	viewer	System rol: viewer	t	5125756a-ed2f-43ae-9cdb-b791c7bf377a	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	employee	System rol: employee	t	e49fc021-359f-42e2-b02b-363948968859	2026-04-22 22:20:10.202133-04	2026-04-22 22:20:10.202133-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	owner	System rol: owner	t	dcee2b97-a4a2-417d-9d11-510770ef8ef7	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	admin	System rol: admin	t	b83be822-91de-4795-a70a-02d0311c3d7a	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	auditor	System rol: auditor	t	f91c30a0-b247-492e-be98-238a9234b6f4	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	viewer	System rol: viewer	t	bfb33c74-fb55-4230-9254-baaab9ee69aa	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	employee	System rol: employee	t	4fc73a77-15c9-44fc-b3f5-f50a32a7f777	2026-04-22 22:26:22.916434-04	2026-04-22 22:26:22.916434-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	owner	System rol: owner	t	40a5a3f1-1ed9-4532-b5c7-2177b43ac92f	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	admin	System rol: admin	t	9c0300c6-eb6c-4236-8b82-34f6481ae8df	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	auditor	System rol: auditor	t	69e96fa7-a671-4f85-9473-7196dc44b212	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	viewer	System rol: viewer	t	565e620b-1e39-4920-9304-9f2e31d416c6	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	employee	System rol: employee	t	bdaf7810-af2a-473e-8fdf-1bf0232f2f95	2026-04-22 22:28:53.116203-04	2026-04-22 22:28:53.116203-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	owner	System rol: owner	t	7f56a40c-6812-4311-9b2b-d42a7fceb9ea	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	admin	System rol: admin	t	95b1c58c-77db-4eb1-9ebb-6ac18775b05e	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	auditor	System rol: auditor	t	7df49a05-56f6-4c98-beef-636d860e5c7f	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	viewer	System rol: viewer	t	f1694ea1-7a02-45ac-bd84-527fd70224cd	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	employee	System rol: employee	t	bd32f4d3-02dd-4a4d-9145-d3fc3788d1bf	2026-04-22 22:31:48.691537-04	2026-04-22 22:31:48.691537-04
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id, assigned_at) FROM stdin;
f64897a3-83a4-495d-9b4c-421ee93f79ba	f3ed53fd-497f-493c-bfc2-185b3057d5ad	2026-04-22 14:34:37.072077-04
5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	9d445bd7-4502-411d-83dc-66104e45118a	2026-04-22 14:35:27.625156-04
c89e0cc7-ffc4-459e-b445-e7485d093224	7beb479a-69d2-4ca1-b6fd-5c9d624b6fe2	2026-04-22 21:00:18.325066-04
1d8388f2-2a46-4534-92fe-7ec6c3da24b8	026baf6e-dc20-46e1-8ab4-83254af5920b	2026-04-22 21:01:59.326097-04
1d8388f2-2a46-4534-92fe-7ec6c3da24b8	75a03798-fcfb-4a07-a64c-c3a7d914642a	2026-04-22 21:04:26.062043-04
33d7710e-3562-4582-9ca6-27d65919bc7b	bf449026-77fb-431c-b654-d4e10b7d13a2	2026-04-22 22:20:10.678393-04
08abbe3a-5706-49a2-9d4e-a1436e041880	dcee2b97-a4a2-417d-9d11-510770ef8ef7	2026-04-22 22:26:23.46118-04
7982cdc3-dd93-4748-95b3-1f73d9ab604a	40a5a3f1-1ed9-4532-b5c7-2177b43ac92f	2026-04-22 22:28:53.655811-04
b73b4ae7-3fca-4bd4-ad4c-6c1825ac933e	7f56a40c-6812-4311-9b2b-d42a7fceb9ea	2026-04-22 22:31:49.199833-04
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (organization_id, email, hashed_password, full_name, is_active, is_superadmin, last_login_at, id, created_at, updated_at) FROM stdin;
95c8377d-a0c8-4deb-a045-bccb31b63310	felipe@gmail.com	$2b$12$v06hb9tUPVoVdJfm2XqsjOyK1dNP/JkS3xdIS0QuaovszCFUt95ki	Felipe	t	f	\N	c89e0cc7-ffc4-459e-b445-e7485d093224	2026-04-22 21:00:18.311768-04	2026-04-22 21:00:18.311768-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	camilo@gmail.com	$2b$12$Dzp.YPzd6N2k2eq2m.zw1eUDTQMsnz1HuHtEA1AOanbpFg2iAW/Uy	Camilo	t	f	2026-04-22 21:02:32.494033-04	1d8388f2-2a46-4534-92fe-7ec6c3da24b8	2026-04-22 21:01:59.32285-04	2026-04-22 21:02:32.498226-04
56547497-dadb-4f47-a0d1-ae88bf7483d4	pepe@gmail.com	$2b$12$iWw1OD2T1WHfioV046jWseB8HxOABDvCroCMEkl6xQoPZqYbiYatu	Pepe Pelon	t	f	\N	33d7710e-3562-4582-9ca6-27d65919bc7b	2026-04-22 22:20:10.669472-04	2026-04-22 22:20:10.669472-04
93ca62e6-46bc-4e09-bc39-6ff903a13e40	carlos@gmail.com	$2b$12$sIQLoafa7eUz4LJc.wQXueuOprN9kPA/sRsaZK8RK5x35LyAdDnJK	Carlos pe	t	f	\N	08abbe3a-5706-49a2-9d4e-a1436e041880	2026-04-22 22:26:23.46118-04	2026-04-22 22:26:23.46118-04
76fa649a-bcd8-4f0f-a502-cbdcd9a17739	jeraldystolzenbach@gmail.com	$2b$12$WcNBswWoyqmuWCHcqOissONMkqJLGOVaKecvado0K2Q4edErImw0W	Jeraldy Stolzenbach	t	f	\N	b73b4ae7-3fca-4bd4-ad4c-6c1825ac933e	2026-04-22 22:31:49.19134-04	2026-04-22 22:31:49.19134-04
d3e11097-a7fa-4811-b0ce-0e42fd3fae64	jeraldystoolzenbach@gmail.com	$2b$12$X9TrDAAf9Nnd35EBW7u0q.b5Q/RE/QdJRJYyIaef4jDQ6Ff/zDTQG	Jeraldy Stolzenbach	t	f	2026-04-22 22:33:36.32293-04	7982cdc3-dd93-4748-95b3-1f73d9ab604a	2026-04-22 22:28:53.644973-04	2026-04-22 22:33:36.32293-04
dfbdd1cf-0a9d-45c7-92c6-091d40089822	andresdos@gmail.com	$2b$12$vh9EdI1.6KpnxEZHr8Gux.WMbmUnA2pqi9QkRtgHjsgDY4q2QBhOG	Andres Felipe dos	t	f	2026-04-23 09:56:20.345514-04	5c6ecf67-b4d3-4df5-8f42-0b202db9a6b6	2026-04-22 14:35:27.620636-04	2026-04-23 09:56:20.402049-04
666563eb-dc34-4e9c-a26e-df5c5503cdd3	andres@gmail.com	$2b$12$KtIjiWX1VO6TB3qh6Ll8Ze6jK01j9HZCkJEdlbt5DBRdfXM0BrdTm	Andres Felipe	t	f	2026-04-23 10:23:07.967714-04	f64897a3-83a4-495d-9b4c-421ee93f79ba	2026-04-22 14:34:37.036203-04	2026-04-23 10:23:07.976305-04
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_slug_key UNIQUE (slug);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: permissions uq_permission_resource_action; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT uq_permission_resource_action UNIQUE (resource, action);


--
-- Name: roles uq_role_name_org; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uq_role_name_org UNIQUE (name, organization_id);


--
-- Name: role_permissions uq_role_permission; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_permission PRIMARY KEY (role_id, permission_id);


--
-- Name: user_roles uq_user_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uq_user_role PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_assets_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assets_organization_id ON public.assets USING btree (organization_id);


--
-- Name: ix_permissions_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_action ON public.permissions USING btree (action);


--
-- Name: ix_permissions_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_resource ON public.permissions USING btree (resource);


--
-- Name: ix_refresh_tokens_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_refresh_tokens_token_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: ix_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: ix_roles_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_roles_organization_id ON public.roles USING btree (organization_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_organization_id ON public.users USING btree (organization_id);


--
-- Name: assets assets_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: assets assets_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organizations organizations_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict F3gD3tCzORKg29vF0f7SQy3L1ltD1roICsNX2FT3bTdyqdtiAg71qxGso90OUUv

>>>>>>> Chat-bot
