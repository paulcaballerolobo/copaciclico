import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED_ORIGINS = [
	'https://somosciclico.com',
	'https://www.somosciclico.com',
	'https://mundial.somosciclico.com'
];

export const GET: RequestHandler = async ({ url, request }) => {
	const origin = request.headers.get('origin') ?? '';
	const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

	const limit = Math.min(Number(url.searchParams.get('limit') ?? '3'), 10);

	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const now = new Date().toISOString();

	const [{ data: matchData }, { data: teamData }] = await Promise.all([
		supabase
			.from('matches')
			.select('id, match_number, match_label, phase, group_name, kickoff_time, team_home, team_away, venue, status')
			.gte('kickoff_time', now)
			.order('kickoff_time')
			.limit(limit),
		supabase
			.from('teams')
			.select('code, name, flag')
	]);

	const teams: Record<string, { name: string; flag: string }> = {};
	for (const t of teamData ?? []) {
		teams[t.code] = { name: t.name, flag: t.flag };
	}

	const matches = (matchData ?? []).map((m) => ({
		id: m.id,
		matchLabel: m.match_label,
		phase: m.phase,
		group: m.group_name,
		kickoff: m.kickoff_time,
		venue: m.venue,
		status: m.status,
		home: { code: m.team_home, ...( teams[m.team_home] ?? { name: m.team_home, flag: '🏳' }) },
		away: { code: m.team_away, ...( teams[m.team_away] ?? { name: m.team_away, flag: '🏳' }) }
	}));

	return json(
		{ matches, micrositeUrl: 'https://mundial.somosciclico.com' },
		{
			headers: {
				'Access-Control-Allow-Origin': corsOrigin,
				'Access-Control-Allow-Methods': 'GET',
				'Cache-Control': 'public, max-age=60'
			}
		}
	);
};

export const OPTIONS: RequestHandler = async ({ request }) => {
	const origin = request.headers.get('origin') ?? '';
	const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': corsOrigin,
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
