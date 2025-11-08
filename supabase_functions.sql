create or replace function get_staffing_requests_with_candidate_count()
returns table (
    id integer,
    created_at timestamp with time zone,
    hotel_id uuid,
    request_type text,
    num_of_people integer,
    role text,
    start_date date,
    status text,
    completed_at timestamp with time zone,
    notes text,
    is_archived boolean,
    hotel_name text,
    candidate_count bigint
) as $$
begin
    return query
    select
        sr.id,
        sr.created_at,
        sr.hotel_id,
        sr.request_type,
        sr.num_of_people,
        sr.role,
        sr.start_date,
        sr.status,
        sr.completed_at,
        sr.notes,
        sr.is_archived,
        h.name as hotel_name,
        count(rc.id) as candidate_count
    from
        staffing_requests sr
    left join
        hotels h on sr.hotel_id = h.id
    left join
        request_candidates rc on sr.id = rc.request_id
    group by
        sr.id, h.name
    order by
        sr.created_at desc;
end;
$$ language plpgsql;
