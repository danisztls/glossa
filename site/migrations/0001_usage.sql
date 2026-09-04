-- Usage measurement. See site/docs/usage.md.
--
-- Three tables, and the separation between the first and the third is the
-- whole privacy design rather than normalisation:
--
--   session      one row per reading session, ~18 coarse buckets, NO country
--   session_tag  the set-valued fields, keyed back to a session
--   geo_lang     country x language counts, with NO key back to a session
--
-- Country is deliberately absent from `session`. Eighteen bucketed fields in
-- one row is already a weak quasi-identifier; adding the country makes an
-- unusual reader (a tablet in a small country reading a rare edition) unique
-- in the table. Counting it separately answers "which languages does each
-- country read in" — which is what it was wanted for — while leaving nothing
-- to join it back to the rest of that reader's session.

create table if not exists session (
	id             integer primary key autoincrement,
	-- UTC date, assigned by the worker. The only time value stored: it is what
	-- lets a poisoned window be dropped by day, and what the retention prune
	-- reads.
	day            text not null,
	days28         text not null,
	visits         text not null,
	age            text not null,
	mode           text not null,
	device         text not null,
	minutes        text not null,
	entry          text not null,
	ui             text not null,
	compare        integer not null,
	offline        integer not null,
	refs           text not null,
	jump           text not null,
	miss_kind      text,
	miss_book      text,
	library        text not null,
	sw_fail        text,
	behind         text not null,
	install_prompt text
);

create index if not exists session_day on session (day);

create table if not exists session_tag (
	session_id integer not null,
	-- 'work' | 'content' | 'section' | 'refKind'
	kind       text not null,
	value      text not null
);

create index if not exists session_tag_lookup on session_tag (kind, value);
create index if not exists session_tag_session on session_tag (session_id);

-- Upserted, not appended: bounded at countries x languages x days, which is a
-- few dozen rows a day rather than one per session.
create table if not exists geo_lang (
	day     text not null,
	country text not null,
	ui      text not null,
	content text not null,
	n       integer not null default 1,
	primary key (day, country, ui, content)
);
