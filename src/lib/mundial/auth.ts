import { supabase } from '$lib/supabase';

export interface MundialUser {
	id: string;
	username: string;
	full_name: string;
	is_admin: boolean;
	avatar_url: string | null;
	points_total: number;
	ranking_position: number | null;
}

const SESSION_KEY = 'mundial_user';

export async function login(
	username: string,
	access_code: string
): Promise<{ success: boolean; user?: MundialUser; error?: string }> {
	const { data, error } = await supabase
		.from('users')
		.select('id, username, full_name, is_admin, avatar_url, points_total, ranking_position')
		.eq('username', username.toLowerCase().trim())
		.eq('access_code', access_code.toUpperCase().trim())
		.eq('is_active', true)
		.single();

	if (error || !data) {
		return { success: false, error: 'Usuario o código incorrecto' };
	}

	const user: MundialUser = data as MundialUser;
	localStorage.setItem(SESSION_KEY, JSON.stringify(user));

	// Actualizar last_active_at
	await supabase
		.from('users')
		.update({ last_active_at: new Date().toISOString() })
		.eq('id', user.id);

	return { success: true, user };
}

export function getSession(): MundialUser | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(SESSION_KEY);
	return raw ? (JSON.parse(raw) as MundialUser) : null;
}

export function updateSessionPoints(points_total: number, ranking_position: number | null) {
	const session = getSession();
	if (!session) return;
	const updated = { ...session, points_total, ranking_position };
	localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
}

export function logout() {
	localStorage.removeItem(SESSION_KEY);
	window.location.href = '/';
}

/** Refresca los datos del usuario desde Supabase y actualiza la sesión */
export async function refreshSession(): Promise<MundialUser | null> {
	const session = getSession();
	if (!session) return null;

	const { data } = await supabase
		.from('users')
		.select('id, username, full_name, is_admin, avatar_url, points_total, ranking_position')
		.eq('id', session.id)
		.single();

	if (!data) return session;
	const updated = data as MundialUser;
	localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
	return updated;
}
