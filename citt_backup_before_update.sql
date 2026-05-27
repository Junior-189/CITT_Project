--
-- PostgreSQL database dump
--

\restrict iUu18z7rsfy20J5bclUVv19x1H2jEKDgmc56iLi9CbTS7R1uaBAM9cEX0e6l5LV

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_project_milestone_count(); Type: FUNCTION; Schema: public; Owner: citt_users
--

CREATE FUNCTION public.update_project_milestone_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE projects SET
    completed_milestones = (SELECT COUNT(*) FROM project_milestones WHERE project_id = NEW.project_id AND status = 'completed'),
    current_milestone = COALESCE((SELECT MIN(stage_number) FROM project_milestones WHERE project_id = NEW.project_id AND status NOT IN ('completed')), 9)
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_project_milestone_count() OWNER TO citt_users;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_notifications; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.assignment_notifications (
    id integer NOT NULL,
    project_id integer,
    assigned_to integer,
    assigned_by integer,
    role_type character varying(50),
    message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignment_notifications OWNER TO citt_users;

--
-- Name: assignment_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.assignment_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_notifications_id_seq OWNER TO citt_users;

--
-- Name: assignment_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.assignment_notifications_id_seq OWNED BY public.assignment_notifications.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    user_email character varying(255),
    user_role character varying(50),
    action character varying(100) NOT NULL,
    resource character varying(100),
    resource_id integer,
    details jsonb,
    ip_address character varying(45),
    user_agent text,
    status character varying(20) DEFAULT 'success'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Activity log for tracking all system actions';


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: business_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_records (
    id integer NOT NULL,
    project_id integer NOT NULL,
    department_id integer NOT NULL,
    business_name text,
    business_plan text,
    market_status text,
    investment_amount numeric(15,2),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.business_records OWNER TO postgres;

--
-- Name: business_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_records_id_seq OWNER TO postgres;

--
-- Name: business_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_records_id_seq OWNED BY public.business_records.id;


--
-- Name: department_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_activity (
    id integer NOT NULL,
    department_id integer NOT NULL,
    user_id integer,
    action text NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.department_activity OWNER TO postgres;

--
-- Name: department_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_activity_id_seq OWNER TO postgres;

--
-- Name: department_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_activity_id_seq OWNED BY public.department_activity.id;


--
-- Name: department_complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_complaints (
    id integer NOT NULL,
    department_id integer NOT NULL,
    submitted_by integer,
    assigned_to integer,
    subject text NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    resolution text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT department_complaints_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_review'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.department_complaints OWNER TO postgres;

--
-- Name: department_complaints_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_complaints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_complaints_id_seq OWNER TO postgres;

--
-- Name: department_complaints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_complaints_id_seq OWNED BY public.department_complaints.id;


--
-- Name: department_functions; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.department_functions (
    id integer NOT NULL,
    department_id integer NOT NULL,
    order_num integer NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.department_functions OWNER TO citt_users;

--
-- Name: department_functions_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.department_functions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_functions_id_seq OWNER TO citt_users;

--
-- Name: department_functions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.department_functions_id_seq OWNED BY public.department_functions.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    short_name character varying(50) NOT NULL,
    description text,
    color character varying(50) DEFAULT 'teal'::character varying,
    icon character varying(100),
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.departments OWNER TO citt_users;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO citt_users;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: director_profiles; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.director_profiles (
    id integer NOT NULL,
    department_code character varying(20) NOT NULL,
    director_name character varying(200),
    photo_url character varying(500),
    bio text,
    updated_by integer,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.director_profiles OWNER TO citt_users;

--
-- Name: director_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.director_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.director_profiles_id_seq OWNER TO citt_users;

--
-- Name: director_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.director_profiles_id_seq OWNED BY public.director_profiles.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    location character varying(255),
    category character varying(50),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    updated_by integer
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: COLUMN events.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.events.created_by IS 'User who created the event (typically admin or superAdmin)';


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: funding; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.funding (
    id integer NOT NULL,
    user_id integer NOT NULL,
    project_id integer,
    title character varying(255) NOT NULL,
    description text,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'TZS'::character varying,
    status character varying(50) DEFAULT 'applied'::character varying,
    approval_status character varying(50) DEFAULT 'pending'::character varying,
    funding_status character varying(50) DEFAULT 'applied'::character varying,
    created_by integer,
    updated_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    rejection_reason text,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    grant_type character varying(100),
    CONSTRAINT funding_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT funding_funding_status_check CHECK (((funding_status)::text = ANY ((ARRAY['applied'::character varying, 'on_progress'::character varying, 'approved'::character varying, 'disbursed'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.funding OWNER TO citt_users;

--
-- Name: funding_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.funding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funding_id_seq OWNER TO citt_users;

--
-- Name: funding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.funding_id_seq OWNED BY public.funding.id;


--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.gallery_images (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    image_url character varying(500) NOT NULL,
    event_name character varying(255),
    uploaded_by integer,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.gallery_images OWNER TO citt_users;

--
-- Name: gallery_images_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.gallery_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gallery_images_id_seq OWNER TO citt_users;

--
-- Name: gallery_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.gallery_images_id_seq OWNED BY public.gallery_images.id;


--
-- Name: ip_management; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.ip_management (
    id integer NOT NULL,
    user_id integer NOT NULL,
    ip_address character varying(45) DEFAULT NULL::character varying,
    ip_title character varying(255),
    description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    approval_status character varying(50) DEFAULT 'pending'::character varying,
    created_by integer,
    updated_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    rejection_reason text,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title character varying(255),
    ip_type character varying(100),
    inventors text,
    field character varying(255),
    abstract text,
    trl character varying(50),
    patent_number character varying(255),
    prior_art text,
    CONSTRAINT ip_management_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.ip_management OWNER TO citt_users;

--
-- Name: ip_management_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.ip_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ip_management_id_seq OWNER TO citt_users;

--
-- Name: ip_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.ip_management_id_seq OWNED BY public.ip_management.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.migrations (
    name text NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.migrations OWNER TO citt_users;

--
-- Name: milestone_comments; Type: TABLE; Schema: public; Owner: citt_users
--

CREATE TABLE public.milestone_comments (
    id integer NOT NULL,
    project_id integer NOT NULL,
    milestone_id integer,
    stage_number integer NOT NULL,
    commented_by integer NOT NULL,
    comment text NOT NULL,
    comment_type character varying(50) DEFAULT 'feedback'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT milestone_comments_comment_type_check CHECK (((comment_type)::text = ANY ((ARRAY['feedback'::character varying, 'guidance'::character varying, 'approval'::character varying, 'rejection'::character varying, 'general'::character varying])::text[])))
);


ALTER TABLE public.milestone_comments OWNER TO citt_users;

--
-- Name: milestone_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: citt_users
--

CREATE SEQUENCE public.milestone_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.milestone_comments_id_seq OWNER TO citt_users;

--
-- Name: milestone_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: citt_users
--

ALTER SEQUENCE public.milestone_comments_id_seq OWNED BY public.milestone_comments.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    message text,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: project_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_assignments (
    id integer NOT NULL,
    project_id integer NOT NULL,
    assigned_user_id integer NOT NULL,
    assigned_by integer,
    assignment_type character varying(50) NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    active boolean DEFAULT true,
    notes text,
    CONSTRAINT project_assignments_assignment_type_check CHECK (((assignment_type)::text = ANY ((ARRAY['mentor'::character varying, 'technical_committee'::character varying, 'coordinator'::character varying])::text[])))
);


ALTER TABLE public.project_assignments OWNER TO postgres;

--
-- Name: project_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_assignments_id_seq OWNER TO postgres;

--
-- Name: project_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_assignments_id_seq OWNED BY public.project_assignments.id;


--
-- Name: project_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_milestones (
    id integer NOT NULL,
    project_id integer NOT NULL,
    stage_number integer NOT NULL,
    stage_name character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    submitted_by integer,
    approved_by integer,
    submission_notes text,
    approval_notes text,
    rejection_reason text,
    file_url character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    CONSTRAINT project_milestones_stage_number_check CHECK (((stage_number >= 1) AND (stage_number <= 9))),
    CONSTRAINT project_milestones_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'submitted'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.project_milestones OWNER TO postgres;

--
-- Name: project_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_milestones_id_seq OWNER TO postgres;

--
-- Name: project_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_milestones_id_seq OWNED BY public.project_milestones.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    status character varying(50) DEFAULT 'draft'::character varying,
    approval_status character varying(50) DEFAULT 'pending'::character varying,
    project_status character varying(50) DEFAULT 'submitted'::character varying,
    created_by integer,
    updated_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    rejection_reason text,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_milestone integer DEFAULT 1,
    completed_milestones integer DEFAULT 0,
    CONSTRAINT projects_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT projects_project_status_check CHECK (((project_status)::text = ANY ((ARRAY['submitted'::character varying, 'on_progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role character varying(50) NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.role_permissions IS 'Permission matrix for role-based access control';


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: training_programmes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_programmes (
    id integer NOT NULL,
    department_id integer NOT NULL,
    title text NOT NULL,
    description text,
    target_audience text,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    start_date date,
    end_date date,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT training_programmes_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.training_programmes OWNER TO postgres;

--
-- Name: training_programmes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_programmes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_programmes_id_seq OWNER TO postgres;

--
-- Name: training_programmes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_programmes_id_seq OWNED BY public.training_programmes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    firestore_id character varying(255),
    name character varying(255),
    email character varying(255),
    phone character varying(20),
    password character varying(255),
    university character varying(255),
    college character varying(255),
    category character varying(50),
    year_of_study character varying(50),
    role character varying(50) DEFAULT 'innovator'::character varying,
    profile_complete boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    deleted_by integer,
    CONSTRAINT check_role CHECK (((role)::text = ANY ((ARRAY['superAdmin'::character varying, 'admin'::character varying, 'ipManager'::character varying, 'innovator'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['superAdmin'::character varying, 'admin'::character varying, 'transferTechnologyOfficer'::character varying, 'ipManager'::character varying, 'diiDirector'::character varying, 'debmDirector'::character varying, 'rtpDirector'::character varying, 'mentor'::character varying, 'technicalCommittee'::character varying, 'coordinator'::character varying, 'innovator'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.role IS 'User role: superAdmin, admin, ipManager, or innovator';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: assignment_notifications id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.assignment_notifications ALTER COLUMN id SET DEFAULT nextval('public.assignment_notifications_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: business_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_records ALTER COLUMN id SET DEFAULT nextval('public.business_records_id_seq'::regclass);


--
-- Name: department_activity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_activity ALTER COLUMN id SET DEFAULT nextval('public.department_activity_id_seq'::regclass);


--
-- Name: department_complaints id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_complaints ALTER COLUMN id SET DEFAULT nextval('public.department_complaints_id_seq'::regclass);


--
-- Name: department_functions id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.department_functions ALTER COLUMN id SET DEFAULT nextval('public.department_functions_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: director_profiles id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.director_profiles ALTER COLUMN id SET DEFAULT nextval('public.director_profiles_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: funding id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding ALTER COLUMN id SET DEFAULT nextval('public.funding_id_seq'::regclass);


--
-- Name: gallery_images id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.gallery_images ALTER COLUMN id SET DEFAULT nextval('public.gallery_images_id_seq'::regclass);


--
-- Name: ip_management id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.ip_management ALTER COLUMN id SET DEFAULT nextval('public.ip_management_id_seq'::regclass);


--
-- Name: milestone_comments id; Type: DEFAULT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.milestone_comments ALTER COLUMN id SET DEFAULT nextval('public.milestone_comments_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: project_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments ALTER COLUMN id SET DEFAULT nextval('public.project_assignments_id_seq'::regclass);


--
-- Name: project_milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_milestones ALTER COLUMN id SET DEFAULT nextval('public.project_milestones_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: training_programmes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_programmes ALTER COLUMN id SET DEFAULT nextval('public.training_programmes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: assignment_notifications; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.assignment_notifications (id, project_id, assigned_to, assigned_by, role_type, message, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_email, user_role, action, resource, resource_id, details, ip_address, user_agent, status, created_at) FROM stdin;
1	9	admin@citt.ac.tz	admin	PUT /projects/2/approve	projects	2	{"body": {"comments": "Check the Title and change it"}, "path": "/projects/2/approve", "query": {}, "method": "PUT", "params": {"id": "2"}, "statusCode": 200}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	success	2026-02-04 16:07:25.643138+03
2	9	admin@citt.ac.tz	admin	PUT /projects/1/reject	projects	1	{"body": {"reason": "no full details "}, "path": "/projects/1/reject", "query": {}, "method": "PUT", "params": {"id": "1"}, "statusCode": 200}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	success	2026-02-07 19:28:52.912859+03
3	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	success	2026-02-09 12:35:37.120307+03
4	10	ipmanager@citt.ac.tz	ipManager	LOGIN	users	10	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	success	2026-02-09 18:31:33.86483+03
5	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	success	2026-02-09 18:32:44.987828+03
6	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	success	2026-03-30 12:35:12.65972+03
7	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-17 13:53:47.513097+03
8	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-18 17:24:50.304337+03
9	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-18 19:46:17.3702+03
10	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-18 20:50:36.884407+03
11	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-18 21:16:34.392656+03
12	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-19 14:35:24.97381+03
13	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-19 14:40:47.295728+03
14	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-21 13:06:52.425901+03
15	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-23 12:26:03.174132+03
16	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-25 18:35:37.041412+03
17	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-25 18:51:25.67477+03
18	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 15:24:53.405975+03
19	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 15:58:16.461294+03
20	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 16:04:00.925841+03
21	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 16:23:29.304921+03
22	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 21:29:39.05117+03
23	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 21:30:19.180176+03
24	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-04-28 21:30:58.403286+03
25	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-05-02 15:38:04.836612+03
26	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-05-02 20:47:37.643251+03
27	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-05-02 20:58:58.153026+03
28	2	lyx.jr443@gmail.com	innovator	LOGIN	users	2	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-05-02 20:59:16.055908+03
29	9	admin@citt.ac.tz	admin	LOGIN	users	9	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-05-02 21:23:09.596976+03
30	8	superadmin@citt.ac.tz	superAdmin	LOGIN	users	8	{"path": "/api/auth/login", "method": "POST"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	success	2026-05-02 21:24:08.588185+03
\.


--
-- Data for Name: business_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_records (id, project_id, department_id, business_name, business_plan, market_status, investment_amount, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: department_activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_activity (id, department_id, user_id, action, entity_type, entity_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: department_complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_complaints (id, department_id, submitted_by, assigned_to, subject, description, status, resolution, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: department_functions; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.department_functions (id, department_id, order_num, description, created_at) FROM stdin;
1	1	1	Conduct training and mentoring of inventors and innovators	2026-04-18 20:29:39.796141+03
2	1	2	Handle innovators complaints related to innovations and incubation	2026-04-18 20:29:39.796141+03
3	1	3	Establish and run Innovations and incubation in liaise with other partners	2026-04-18 20:29:39.796141+03
4	1	4	Coordinate all matters related to Technology Transfer	2026-04-18 20:29:39.796141+03
5	1	5	Maintain database of Innovators and track project progress	2026-04-18 20:29:39.796141+03
6	1	6	Handle all matters related to registration and assessment of student Innovation programmes	2026-04-18 20:29:39.796141+03
7	1	7	Coordinate evaluation of performance programs and keep periodic implementation reports	2026-04-18 20:29:39.796141+03
8	2	1	Conduct training and mentoring of Entrepreneurship and Business Management programmes	2026-04-18 20:29:39.798091+03
9	2	2	Develop a business plan of innovations	2026-04-18 20:29:39.798091+03
10	2	3	Advertising and marketing of innovative products	2026-04-18 20:29:39.798091+03
11	2	4	Management and financial advisory	2026-04-18 20:29:39.798091+03
12	2	5	Liaise with various experts in innovation and technology transfer worldwide	2026-04-18 20:29:39.798091+03
13	2	6	Promote Intellectual Property Rights (IPR) awareness at the university and beyond	2026-04-18 20:29:39.798091+03
14	2	7	Maintain a database of Entrepreneur and Business activities after completing all milestone stages	2026-04-18 20:29:39.798091+03
15	2	8	Design mechanisms to convert research outputs and business ideas to commercial companies	2026-04-18 20:29:39.798091+03
16	2	9	Handle all matters related to student Entrepreneurship and Business Management	2026-04-18 20:29:39.798091+03
17	2	10	Attract investment in innovation and commercialization of research results by creating funding mechanisms	2026-04-18 20:29:39.798091+03
18	2	11	Handle student and academic staff complaints related to DEBM programmes	2026-04-18 20:29:39.798091+03
19	3	1	Support in bringing technology to rural communities	2026-04-18 20:29:39.799002+03
20	3	2	Commercialize innovation results in technologies with strongest impact to rural community	2026-04-18 20:29:39.799002+03
21	3	3	Look for new spin-off and start-up companies to generate rural economic activity and create jobs	2026-04-18 20:29:39.799002+03
22	3	4	Act as a driver of Public/Private Partnerships (PPP)	2026-04-18 20:29:39.799002+03
23	3	5	Complement the mission of the University in enhancing outreach services	2026-04-18 20:29:39.799002+03
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.departments (id, code, name, short_name, description, color, icon, active, created_at, updated_at) FROM stdin;
1	DII	Department of Innovations and Incubation	DII	Responsible for training and mentoring of inventors and innovators, handling complaints, coordinating technology transfer, and maintaining database of innovators.	teal	\N	t	2026-04-18 20:29:39.78841+03	2026-04-18 20:29:39.78841+03
2	DEBM	Department of Entrepreneurship and Business Management	DEBM	Responsible for entrepreneurship training, business plan development, marketing of innovative products, financial advisory, and commercialization of innovations.	blue	\N	t	2026-04-18 20:29:39.78841+03	2026-04-18 20:29:39.78841+03
3	RTP	Rural Technology Park	RTP	Located at MUST Rukwa Campus College. Brings technology to rural communities, commercializes innovations for rural impact, and supports spin-offs and start-ups.	green	\N	t	2026-04-18 20:29:39.78841+03	2026-04-18 20:29:39.78841+03
\.


--
-- Data for Name: director_profiles; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.director_profiles (id, department_code, director_name, photo_url, bio, updated_by, updated_at) FROM stdin;
1	DII	\N	\N	\N	\N	2026-04-21 14:28:29.211676+03
2	DEBM	\N	\N	\N	\N	2026-04-21 14:28:29.211676+03
3	RTP	\N	\N	\N	\N	2026-04-21 14:28:29.211676+03
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, start_date, end_date, location, category, created_by, created_at, updated_at, deleted_at, updated_by) FROM stdin;
\.


--
-- Data for Name: funding; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.funding (id, user_id, project_id, title, description, amount, currency, status, approval_status, funding_status, created_by, updated_by, approved_by, approved_at, rejection_reason, deleted_at, created_at, updated_at, grant_type) FROM stdin;
1	2	4	Innovation AI	Innovation for all	1005000.00	TZS	applied	pending	applied	\N	\N	\N	\N	\N	\N	2026-02-04 18:56:06.948744	2026-02-04 18:56:06.948744	startup
\.


--
-- Data for Name: gallery_images; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.gallery_images (id, title, description, image_url, event_name, uploaded_by, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ip_management; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.ip_management (id, user_id, ip_address, ip_title, description, status, approval_status, created_by, updated_by, approved_by, approved_at, rejection_reason, deleted_at, created_at, updated_at, title, ip_type, inventors, field, abstract, trl, patent_number, prior_art) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.migrations (name, applied_at) FROM stdin;
\.


--
-- Data for Name: milestone_comments; Type: TABLE DATA; Schema: public; Owner: citt_users
--

COPY public.milestone_comments (id, project_id, milestone_id, stage_number, commented_by, comment, comment_type, created_at) FROM stdin;
1	2	1	1	9	We are good from here	feedback	2026-04-28 16:10:03.650018+03
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, read, created_at) FROM stdin;
\.


--
-- Data for Name: project_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_assignments (id, project_id, assigned_user_id, assigned_by, assignment_type, assigned_at, active, notes) FROM stdin;
\.


--
-- Data for Name: project_milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_milestones (id, project_id, stage_number, stage_name, status, submitted_by, approved_by, submission_notes, approval_notes, rejection_reason, file_url, created_at, updated_at, submitted_at, approved_at) FROM stdin;
1	2	1	Idea Generation	completed	2	9	What problem does your innovation solve?\r\nAI for Chicken\r\n\r\n\r\n---\r\n\r\nDescribe your innovation idea in simple terms.\r\nI helped Chicken to know AI\r\n\r\n---\r\n\r\nWho are the target beneficiaries of this innovation?\r\nChicken	great. he should continue	\N	/uploads/milestones/1777381561386-605660797.docx	2026-04-28 16:06:01.400479+03	2026-04-28 16:10:15.722119+03	2026-04-28 16:06:01.400479+03	2026-04-28 16:10:15.722119+03
2	2	2	Concept Development	in_progress	\N	\N	\N	\N	\N	\N	2026-04-28 16:10:15.728947+03	2026-04-28 16:10:15.728947+03	\N	\N
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, user_id, title, description, category, status, approval_status, project_status, created_by, updated_by, approved_by, approved_at, rejection_reason, deleted_at, created_at, updated_at, current_milestone, completed_milestones) FROM stdin;
3	2	AI for Chicken 	Chicken AI 	Artificial Intelligence & Data Science	draft	pending	submitted	\N	\N	\N	\N	\N	\N	2026-02-02 18:59:54.130041	2026-02-02 19:01:12.167459	1	0
4	2	Innovation AI	AI for Innovations	Artificial Intelligence & Data Science	draft	pending	submitted	\N	\N	\N	\N	\N	\N	2026-02-04 15:45:44.101053	2026-02-04 15:45:44.101053	1	0
1	11	Test Project from Script 2	This is a test project submission.	research	draft	rejected	submitted	\N	\N	9	2026-02-07 19:28:52.89247	no full details 	\N	2026-01-31 19:17:26.060768	2026-02-07 19:28:52.89247	1	0
2	2	AI for chicken	Chicken AI	Artificial Intelligence & Data Science	draft	approved	submitted	\N	\N	9	2026-02-04 16:07:25.631723	\N	\N	2026-02-02 18:56:09.72453	2026-02-04 16:07:25.631723	2	1
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role, resource, action, description, created_at) FROM stdin;
1	superAdmin	*	*	Full system access to all resources	2026-01-29 21:26:21.204365+03
2	superAdmin	users	promote	Promote users to different roles	2026-01-29 21:26:21.204365+03
3	superAdmin	users	demote	Demote users from their roles	2026-01-29 21:26:21.204365+03
4	superAdmin	users	delete	Delete user accounts	2026-01-29 21:26:21.204365+03
5	superAdmin	system	settings	Manage system-wide settings	2026-01-29 21:26:21.204365+03
6	superAdmin	audit	view	View all audit logs	2026-01-29 21:26:21.204365+03
7	superAdmin	roles	manage	Manage role permissions	2026-01-29 21:26:21.204365+03
8	admin	users	read	View all users	2026-01-29 21:26:21.205675+03
9	admin	users	update	Update user information	2026-01-29 21:26:21.205675+03
10	admin	projects	read	View all projects	2026-01-29 21:26:21.205675+03
11	admin	projects	approve	Approve project submissions	2026-01-29 21:26:21.205675+03
12	admin	projects	reject	Reject project submissions	2026-01-29 21:26:21.205675+03
13	admin	projects	delete	Delete projects	2026-01-29 21:26:21.205675+03
14	admin	funding	read	View all funding applications	2026-01-29 21:26:21.205675+03
15	admin	funding	approve	Approve funding applications	2026-01-29 21:26:21.205675+03
16	admin	funding	reject	Reject funding applications	2026-01-29 21:26:21.205675+03
17	admin	funding	delete	Delete funding applications	2026-01-29 21:26:21.205675+03
18	admin	events	create	Create new events	2026-01-29 21:26:21.205675+03
19	admin	events	read	View all events	2026-01-29 21:26:21.205675+03
20	admin	events	update	Update event details	2026-01-29 21:26:21.205675+03
21	admin	events	delete	Delete events	2026-01-29 21:26:21.205675+03
22	admin	ip_management	read	View all IP records	2026-01-29 21:26:21.205675+03
23	admin	analytics	view	View system analytics and charts	2026-01-29 21:26:21.205675+03
24	admin	reports	generate	Generate system reports	2026-01-29 21:26:21.205675+03
25	admin	audit	view	View audit logs	2026-01-29 21:26:21.205675+03
26	ipManager	ip_management	read	View all IP records	2026-01-29 21:26:21.206592+03
27	ipManager	ip_management	create	Create IP records	2026-01-29 21:26:21.206592+03
28	ipManager	ip_management	update	Update IP records	2026-01-29 21:26:21.206592+03
29	ipManager	ip_management	approve	Approve IP applications	2026-01-29 21:26:21.206592+03
30	ipManager	ip_management	reject	Reject IP applications	2026-01-29 21:26:21.206592+03
31	ipManager	ip_management	delete	Delete IP records	2026-01-29 21:26:21.206592+03
32	ipManager	projects	read	View projects related to IP	2026-01-29 21:26:21.206592+03
33	ipManager	analytics	view	View IP-related analytics	2026-01-29 21:26:21.206592+03
34	ipManager	reports	generate	Generate IP reports	2026-01-29 21:26:21.206592+03
35	innovator	projects	create	Create own projects	2026-01-29 21:26:21.20724+03
36	innovator	projects	read_own	View own projects	2026-01-29 21:26:21.20724+03
37	innovator	projects	update_own	Update own projects	2026-01-29 21:26:21.20724+03
38	innovator	projects	delete_own	Delete own projects	2026-01-29 21:26:21.20724+03
39	innovator	funding	create	Apply for funding	2026-01-29 21:26:21.20724+03
40	innovator	funding	read_own	View own funding applications	2026-01-29 21:26:21.20724+03
41	innovator	funding	update_own	Update own funding applications	2026-01-29 21:26:21.20724+03
42	innovator	funding	delete_own	Delete own funding applications	2026-01-29 21:26:21.20724+03
43	innovator	ip_management	create	Submit IP applications	2026-01-29 21:26:21.20724+03
44	innovator	ip_management	read_own	View own IP records	2026-01-29 21:26:21.20724+03
45	innovator	ip_management	update_own	Update own IP records	2026-01-29 21:26:21.20724+03
46	innovator	events	read	View all events	2026-01-29 21:26:21.20724+03
47	innovator	profile	update_own	Update own profile	2026-01-29 21:26:21.20724+03
\.


--
-- Data for Name: training_programmes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_programmes (id, department_id, title, description, target_audience, status, start_date, end_date, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, firestore_id, name, email, phone, password, university, college, category, year_of_study, role, profile_complete, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
1	test-firebase-uid-12345	Test User	testuser@example.com	+1234567890	firebase_auth	\N	\N	\N	\N	innovator	f	2026-01-27 18:45:54.574856	2026-01-27 18:45:54.574856	\N	\N
3	\N	testa	testa2@gmail.com	\N	$2b$10$3HP0CCICSLUdieadcHNQOOmyyTVhiISG23WjyB6kBbuq7372.BYXe	\N	\N	\N	\N	innovator	f	2026-01-27 18:52:06.231329	2026-01-27 18:52:06.231329	\N	\N
4	\N	Testa1	Testa1@gmail.com	\N	$2b$10$3Op6lAS.vtaRaikcVoOe8us7hYVgSY7MLmE8GGoKJThJUifwLCGRy	\N	\N	\N	\N	innovator	f	2026-01-29 15:33:17.691229	2026-01-29 15:33:17.691229	\N	\N
5	\N	Testa2	ttesta2@gmail.com	\N	$2b$10$4SaxdOYKAlAtu3dHqkLxeOWKdMahMtXXXEyDBs2keRCLJowAM6A6W	\N	\N	\N	\N	innovator	f	2026-01-29 16:02:47.187238	2026-01-29 16:02:47.187238	\N	\N
6	\N	Testa3	Testa3@gmail.com	\N	$2b$10$CcbtidY8noRdfC8sHaRtUOseAR4O3hxilGZQEnVuWmoAPO1MKG3cW	\N	\N	\N	\N	innovator	f	2026-01-29 16:19:13.801781	2026-01-29 16:19:13.801781	\N	\N
7	\N	Testa3	testa3@gmail.com	\N	$2b$10$62aAAMAGMDGkTTVBavOUyeNyQwoXvBgliGeGXBKoKyMqDPDQFCnse	\N	\N	\N	\N	innovator	f	2026-01-29 16:20:30.824482	2026-01-29 16:20:30.824482	\N	\N
8	\N	CITT Super Administrator	superadmin@citt.ac.tz	+255700000001	$2b$10$KX8mwS5Qq2TXEZlfSZUw8eo5R9Ilp3QjTbFwiYNsagEqoS4CtguNe	CITT	Administration	\N	\N	superAdmin	t	2026-01-29 16:46:55.805668	2026-01-29 16:46:55.805668	\N	\N
9	\N	John Admin	admin@citt.ac.tz	+255700000002	$2b$10$8..dr2gR2kdh15id/RypqeW6E6S5fYnGNgJLIuxHp4AqA8fT0YL32	CITT	Innovation Department	\N	\N	admin	t	2026-01-29 16:46:55.857917	2026-01-29 16:46:55.857917	\N	\N
10	\N	Mary IP Manager	ipmanager@citt.ac.tz	+255700000003	$2b$10$O8HUR2kEeJMuqvRh52m.mOIyU.NNnrFOz4F/cREuloXBpt5BXeUCy	CITT	IP Management Department	\N	\N	ipManager	t	2026-01-29 16:46:55.915079	2026-01-29 16:46:55.915079	\N	\N
11	\N	Alice Innovator	innovator@citt.ac.tz	+255700000004	$2b$10$FhcKR3FtRqsIywt4ZWYGpu6zvPZn0TVfAHuWCBZVYmksCL4Qn/EtO	University of Dar es Salaam	College of Engineering	\N	3	innovator	t	2026-01-29 16:46:55.971413	2026-01-29 16:46:55.971413	\N	\N
12	hHhKxeUS27hEMVXDuutDR2A2MPD3	Jux lyx	lyx.jr127@gmail.com	\N	\N	\N	\N	\N	\N	innovator	f	2026-03-30 12:30:27.712386	2026-03-30 12:30:27.712386	\N	\N
2	Ubikv3AJ89XHA3NhEVM80LURhT52	Junior Jackson	lyx.jr443@gmail.com	0745488710	$2b$10$O51owtCxap4jcgxgggc98OeNfhuI3H4T2HPSbr.CGA54qGC/YUtB.	\N	\N	\N	\N	innovator	f	2026-01-27 18:48:50.075766	2026-04-18 19:44:29.020363	\N	\N
\.


--
-- Name: assignment_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.assignment_notifications_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 30, true);


--
-- Name: business_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_records_id_seq', 1, false);


--
-- Name: department_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_activity_id_seq', 1, false);


--
-- Name: department_complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_complaints_id_seq', 1, false);


--
-- Name: department_functions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.department_functions_id_seq', 23, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.departments_id_seq', 3, true);


--
-- Name: director_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.director_profiles_id_seq', 3, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 1, false);


--
-- Name: funding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.funding_id_seq', 1, true);


--
-- Name: gallery_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.gallery_images_id_seq', 1, false);


--
-- Name: ip_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.ip_management_id_seq', 1, false);


--
-- Name: milestone_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: citt_users
--

SELECT pg_catalog.setval('public.milestone_comments_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: project_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_assignments_id_seq', 1, false);


--
-- Name: project_milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_milestones_id_seq', 2, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 4, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 47, true);


--
-- Name: training_programmes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_programmes_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: assignment_notifications assignment_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.assignment_notifications
    ADD CONSTRAINT assignment_notifications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: business_records business_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_records
    ADD CONSTRAINT business_records_pkey PRIMARY KEY (id);


--
-- Name: department_activity department_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_activity
    ADD CONSTRAINT department_activity_pkey PRIMARY KEY (id);


--
-- Name: department_complaints department_complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_complaints
    ADD CONSTRAINT department_complaints_pkey PRIMARY KEY (id);


--
-- Name: department_functions department_functions_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.department_functions
    ADD CONSTRAINT department_functions_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: director_profiles director_profiles_department_code_key; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.director_profiles
    ADD CONSTRAINT director_profiles_department_code_key UNIQUE (department_code);


--
-- Name: director_profiles director_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.director_profiles
    ADD CONSTRAINT director_profiles_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: funding funding_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding
    ADD CONSTRAINT funding_pkey PRIMARY KEY (id);


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);


--
-- Name: ip_management ip_management_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.ip_management
    ADD CONSTRAINT ip_management_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- Name: milestone_comments milestone_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.milestone_comments
    ADD CONSTRAINT milestone_comments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: project_assignments project_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_pkey PRIMARY KEY (id);


--
-- Name: project_assignments project_assignments_project_id_assigned_user_id_assignment__key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_project_id_assigned_user_id_assignment__key UNIQUE (project_id, assigned_user_id, assignment_type);


--
-- Name: project_milestones project_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_pkey PRIMARY KEY (id);


--
-- Name: project_milestones project_milestones_project_id_stage_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_project_id_stage_number_key UNIQUE (project_id, stage_number);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_resource_action_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_resource_action_key UNIQUE (role, resource, action);


--
-- Name: training_programmes training_programmes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_programmes
    ADD CONSTRAINT training_programmes_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_firestore_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firestore_id_key UNIQUE (firestore_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource);


--
-- Name: idx_audit_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_status ON public.audit_logs USING btree (status);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- Name: idx_funding_approval_status; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_funding_approval_status ON public.funding USING btree (approval_status);


--
-- Name: idx_funding_deleted_at; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_funding_deleted_at ON public.funding USING btree (deleted_at);


--
-- Name: idx_funding_project_id; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_funding_project_id ON public.funding USING btree (project_id);


--
-- Name: idx_funding_user_id; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_funding_user_id ON public.funding USING btree (user_id);


--
-- Name: idx_gallery_images_created_at; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_gallery_images_created_at ON public.gallery_images USING btree (created_at DESC);


--
-- Name: idx_gallery_images_deleted_at; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_gallery_images_deleted_at ON public.gallery_images USING btree (deleted_at);


--
-- Name: idx_ip_management_approval_status; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_ip_management_approval_status ON public.ip_management USING btree (approval_status);


--
-- Name: idx_ip_management_deleted_at; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_ip_management_deleted_at ON public.ip_management USING btree (deleted_at);


--
-- Name: idx_ip_management_ip_type; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_ip_management_ip_type ON public.ip_management USING btree (ip_type);


--
-- Name: idx_ip_management_user_id; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_ip_management_user_id ON public.ip_management USING btree (user_id);


--
-- Name: idx_milestone_comments_project; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_milestone_comments_project ON public.milestone_comments USING btree (project_id);


--
-- Name: idx_milestone_comments_stage; Type: INDEX; Schema: public; Owner: citt_users
--

CREATE INDEX idx_milestone_comments_stage ON public.milestone_comments USING btree (stage_number);


--
-- Name: idx_projects_approval_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_approval_status ON public.projects USING btree (approval_status);


--
-- Name: idx_projects_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_deleted_at ON public.projects USING btree (deleted_at);


--
-- Name: idx_projects_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);


--
-- Name: idx_role_permissions_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_resource ON public.role_permissions USING btree (resource);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: project_milestones trg_update_milestone_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_milestone_count AFTER INSERT OR UPDATE ON public.project_milestones FOR EACH ROW EXECUTE FUNCTION public.update_project_milestone_count();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: business_records business_records_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_records
    ADD CONSTRAINT business_records_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: business_records business_records_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_records
    ADD CONSTRAINT business_records_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: business_records business_records_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_records
    ADD CONSTRAINT business_records_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: department_activity department_activity_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_activity
    ADD CONSTRAINT department_activity_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: department_activity department_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_activity
    ADD CONSTRAINT department_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: department_complaints department_complaints_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_complaints
    ADD CONSTRAINT department_complaints_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: department_complaints department_complaints_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_complaints
    ADD CONSTRAINT department_complaints_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: department_complaints department_complaints_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_complaints
    ADD CONSTRAINT department_complaints_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: department_functions department_functions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.department_functions
    ADD CONSTRAINT department_functions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: events events_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_deleted_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: funding funding_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding
    ADD CONSTRAINT funding_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: funding funding_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding
    ADD CONSTRAINT funding_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: funding funding_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding
    ADD CONSTRAINT funding_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: funding funding_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding
    ADD CONSTRAINT funding_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: funding funding_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.funding
    ADD CONSTRAINT funding_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ip_management ip_management_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.ip_management
    ADD CONSTRAINT ip_management_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ip_management ip_management_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.ip_management
    ADD CONSTRAINT ip_management_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ip_management ip_management_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.ip_management
    ADD CONSTRAINT ip_management_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ip_management ip_management_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: citt_users
--

ALTER TABLE ONLY public.ip_management
    ADD CONSTRAINT ip_management_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_assignments project_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: project_assignments project_assignments_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id);


--
-- Name: project_assignments project_assignments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_milestones project_milestones_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: project_milestones project_milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_milestones project_milestones_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: projects projects_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: projects projects_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: training_programmes training_programmes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_programmes
    ADD CONSTRAINT training_programmes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: training_programmes training_programmes_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_programmes
    ADD CONSTRAINT training_programmes_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO citt_users;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_logs TO citt_users;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.audit_logs_id_seq TO citt_users;


--
-- Name: TABLE business_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.business_records TO citt_users;


--
-- Name: SEQUENCE business_records_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.business_records_id_seq TO citt_users;


--
-- Name: TABLE department_activity; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.department_activity TO citt_users;


--
-- Name: SEQUENCE department_activity_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.department_activity_id_seq TO citt_users;


--
-- Name: TABLE department_complaints; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.department_complaints TO citt_users;


--
-- Name: SEQUENCE department_complaints_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.department_complaints_id_seq TO citt_users;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO citt_users;


--
-- Name: SEQUENCE events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.events_id_seq TO citt_users;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notifications TO citt_users;


--
-- Name: SEQUENCE notifications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.notifications_id_seq TO citt_users;


--
-- Name: TABLE project_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_assignments TO citt_users;


--
-- Name: SEQUENCE project_assignments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.project_assignments_id_seq TO citt_users;


--
-- Name: TABLE project_milestones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_milestones TO citt_users;


--
-- Name: SEQUENCE project_milestones_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.project_milestones_id_seq TO citt_users;


--
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.projects TO citt_users;


--
-- Name: SEQUENCE projects_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.projects_id_seq TO citt_users;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO citt_users;


--
-- Name: SEQUENCE role_permissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.role_permissions_id_seq TO citt_users;


--
-- Name: TABLE training_programmes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.training_programmes TO citt_users;


--
-- Name: SEQUENCE training_programmes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.training_programmes_id_seq TO citt_users;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO citt_users;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.users_id_seq TO citt_users;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO citt_users;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO citt_users;


--
-- PostgreSQL database dump complete
--

\unrestrict iUu18z7rsfy20J5bclUVv19x1H2jEKDgmc56iLi9CbTS7R1uaBAM9cEX0e6l5LV

