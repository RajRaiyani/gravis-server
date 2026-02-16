\restrict LgbMPkmMFiwhZ4WKl25BJbNDSfZ8UElpHHk3dVRio7elerhdAOcijdakNMTOXKI

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT uuidv7() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id uuid DEFAULT uuidv7() NOT NULL,
    customer_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    guest_id uuid
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT uuidv7() NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    full_name character varying(255) GENERATED ALWAYS AS ((((first_name)::text || ' '::text) || (last_name)::text)) STORED,
    email character varying(255) NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    phone_number character varying(15),
    is_phone_number_verified boolean DEFAULT false NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT uuidv7() NOT NULL,
    key text NOT NULL,
    size bigint,
    _status character varying(100) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    mimetype character varying(150)
);


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id uuid DEFAULT uuidv7() NOT NULL,
    type character varying(100) DEFAULT 'general'::character varying NOT NULL,
    message text,
    product_id uuid,
    status character varying(100) DEFAULT 'pending'::character varying NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb CONSTRAINT inquiries_metadata_not_null NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid,
    updated_at timestamp with time zone
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT uuidv7() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    product_id uuid NOT NULL,
    image_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT uuidv7() NOT NULL,
    category_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    points text[] DEFAULT '{}'::text[] NOT NULL,
    technical_details jsonb[] DEFAULT '{}'::jsonb[] NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    sale_price_in_paisa integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    sale_price_in_rupee numeric(12,2) GENERATED ALWAYS AS (round(((sale_price_in_paisa)::numeric / 100.00), 2)) STORED,
    sale_price numeric(12,2) GENERATED ALWAYS AS (round(((sale_price_in_paisa)::numeric / 100.00), 2)) STORED,
    can_purchase boolean DEFAULT true NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    token text NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT uuidv7() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(15) NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: cart_items pk_cart_items; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT pk_cart_items PRIMARY KEY (id);


--
-- Name: carts pk_customer_carts; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT pk_customer_carts PRIMARY KEY (id);


--
-- Name: customers pk_customers; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT pk_customers PRIMARY KEY (id);


--
-- Name: files pk_files; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT pk_files PRIMARY KEY (id);


--
-- Name: inquiries pk_inquiries; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT pk_inquiries PRIMARY KEY (id);


--
-- Name: product_categories pk_product_categories; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT pk_product_categories PRIMARY KEY (id);


--
-- Name: product_images pk_product_images; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT pk_product_images PRIMARY KEY (product_id, image_id);


--
-- Name: products pk_products; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT pk_products PRIMARY KEY (id);


--
-- Name: tokens pk_tokens; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT pk_tokens PRIMARY KEY (token);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: cart_items uk_cart_id_product_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT uk_cart_id_product_id UNIQUE (cart_id, product_id);


--
-- Name: customers uk_customers_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uk_customers_email UNIQUE (email);


--
-- Name: files uk_files_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT uk_files_key UNIQUE (key);


--
-- Name: product_categories uk_product_categories_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT uk_product_categories_name UNIQUE (name);


--
-- Name: products uk_products_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uk_products_name UNIQUE (name);


--
-- Name: users uk_users_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_users_email UNIQUE (email);


--
-- Name: users uk_users_phone_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_users_phone_number UNIQUE (phone_number);


--
-- Name: cart_items fk_cart_items_cart_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT fk_cart_items_cart_id FOREIGN KEY (cart_id) REFERENCES public.carts(id);


--
-- Name: cart_items fk_cart_items_product_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT fk_cart_items_product_id FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: carts fk_customer_carts_customer_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT fk_customer_carts_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: inquiries fk_inquiries_customer_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT fk_inquiries_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: inquiries fk_inquiries_product_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT fk_inquiries_product_id FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_categories fk_product_categories_image_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT fk_product_categories_image_id FOREIGN KEY (image_id) REFERENCES public.files(id);


--
-- Name: product_images fk_product_images_image_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT fk_product_images_image_id FOREIGN KEY (image_id) REFERENCES public.files(id);


--
-- Name: product_images fk_product_images_product_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: products fk_products_category_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict LgbMPkmMFiwhZ4WKl25BJbNDSfZ8UElpHHk3dVRio7elerhdAOcijdakNMTOXKI


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20251222074521'),
    ('20251222111056'),
    ('20260201065509'),
    ('20260201191416'),
    ('20260202051143'),
    ('20260203051605'),
    ('20260205084732'),
    ('20260205135203'),
    ('20260206184727');
