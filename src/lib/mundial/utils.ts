/** Pausa asíncrona */
export function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/** Animar un número de `from` a `to` en `duration` ms */
export function animateCountUp(
	el: HTMLElement,
	from: number,
	to: number,
	duration = 800
): void {
	const start = performance.now();
	const diff = to - from;
	function update(time: number) {
		const elapsed = time - start;
		const progress = Math.min(elapsed / duration, 1);
		el.textContent = String(Math.round(from + diff * easeOut(progress)));
		if (progress < 1) requestAnimationFrame(update);
	}
	requestAnimationFrame(update);
}

function easeOut(t: number): number {
	return 1 - Math.pow(1 - t, 3);
}

/** Cuenta regresiva hacia una fecha. Devuelve { days, hours, mins, secs } */
export function countdownTo(target: Date): { days: number; hours: number; mins: number; secs: number } {
	const diff = target.getTime() - Date.now();
	if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
	return {
		days: Math.floor(diff / 86400000),
		hours: Math.floor((diff % 86400000) / 3600000),
		mins: Math.floor((diff % 3600000) / 60000),
		secs: Math.floor((diff % 60000) / 1000)
	};
}

/** Pad número a 2 dígitos */
export function pad(n: number): string {
	return String(n).padStart(2, '0');
}

/** Formatea fecha a hora argentina legible */
export function formatDateAR(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleString('es-AR', {
		timeZone: 'America/Argentina/Buenos_Aires',
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/** Formatea solo la hora en hora argentina */
export function formatTimeAR(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleString('es-AR', {
		timeZone: 'America/Argentina/Buenos_Aires',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/** Nombre corto de equipo para mostrar en la UI */
export function shortName(name: string): string {
	const MAP: Record<string, string> = {
		'United States': 'EE.UU.',
		'Korea Republic': 'Corea del Sur',
		'Saudi Arabia': 'Arabia Saudita',
		'Czech Republic': 'Rep. Checa',
		'Costa Rica': 'Costa Rica'
	};
	return MAP[name] ?? name;
}

/** Bandera emoji por nombre de país (español e inglés) */
const FLAG_MAP: Record<string, string> = {
	// ── Español ──
	Argentina: '🇦🇷', Brasil: '🇧🇷', Francia: '🇫🇷', Alemania: '🇩🇪',
	España: '🇪🇸', Inglaterra: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Portugal: '🇵🇹', Italia: '🇮🇹',
	'Países Bajos': '🇳🇱', Bélgica: '🇧🇪', Uruguay: '🇺🇾', México: '🇲🇽',
	'Estados Unidos': '🇺🇸', Canadá: '🇨🇦', Japón: '🇯🇵', Marruecos: '🇲🇦',
	Senegal: '🇸🇳', Ecuador: '🇪🇨', Colombia: '🇨🇴', Chile: '🇨🇱',
	Suiza: '🇨🇭', Dinamarca: '🇩🇰', Croacia: '🇭🇷', Serbia: '🇷🇸',
	Polonia: '🇵🇱', Australia: '🇦🇺', 'Arabia Saudita': '🇸🇦', Irán: '🇮🇷',
	'Corea del Sur': '🇰🇷', Ghana: '🇬🇭', Camerún: '🇨🇲', Argelia: '🇩🇿',
	'República Checa': '🇨🇿', 'Costa Rica': '🇨🇷', Paraguay: '🇵🇾',
	Venezuela: '🇻🇪', Perú: '🇵🇪', Bolivia: '🇧🇴', Panamá: '🇵🇦',
	Honduras: '🇭🇳', Jamaica: '🇯🇲', Turquía: '🇹🇷', Ucrania: '🇺🇦',
	Austria: '🇦🇹', Hungría: '🇭🇺', Rumanía: '🇷🇴', Escocia: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
	Gales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', Grecia: '🇬🇷', Eslovaquia: '🇸🇰', Eslovenia: '🇸🇮',
	Sudáfrica: '🇿🇦', Nigeria: '🇳🇬', Egipto: '🇪🇬', Túnez: '🇹🇳',
	Malí: '🇲🇱', 'RD Congo': '🇨🇩', Zimbabue: '🇿🇼', Sudán: '🇸🇩',
	'Costa de Marfil': '🇨🇮', Zambia: '🇿🇲', Tanzania: '🇹🇿',
	'Nueva Zelanda': '🇳🇿', Indonesia: '🇮🇩', Catar: '🇶🇦', Irak: '🇮🇶',
	Jordania: '🇯🇴', Omán: '🇴🇲', Baréin: '🇧🇭', Kuwait: '🇰🇼',
	'Emiratos Árabes Unidos': '🇦🇪', China: '🇨🇳', Uzbekistán: '🇺🇿',
	India: '🇮🇳', Tailandia: '🇹🇭', Vietnam: '🇻🇳', Filipinas: '🇵🇭',
	Noruega: '🇳🇴', Suecia: '🇸🇪', Haití: '🇭🇹', 'Bosnia y Herzegovina': '🇧🇦',
	Curazao: '🇨🇼', 'Cabo Verde': '🇨🇻',
	// ── Inglés (retrocompatibilidad) ──
	Brazil: '🇧🇷', France: '🇫🇷', Germany: '🇩🇪', Spain: '🇪🇸',
	England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Netherlands: '🇳🇱', Belgium: '🇧🇪', Mexico: '🇲🇽',
	'United States': '🇺🇸', Canada: '🇨🇦', Japan: '🇯🇵', Morocco: '🇲🇦',
	Switzerland: '🇨🇭', Denmark: '🇩🇰', Croatia: '🇭🇷', Poland: '🇵🇱',
	'Saudi Arabia': '🇸🇦', Iran: '🇮🇷', 'Korea Republic': '🇰🇷', Algeria: '🇩🇿',
	'Czech Republic': '🇨🇿', Turkey: '🇹🇷', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
	'South Africa': '🇿🇦', Egypt: '🇪🇬', Tunisia: '🇹🇳', 'New Zealand': '🇳🇿',
	Qatar: '🇶🇦', Iraq: '🇮🇶', Jordan: '🇯🇴', Uzbekistan: '🇺🇿',
	Norway: '🇳🇴', Sweden: '🇸🇪', Haiti: '🇭🇹', 'Cape Verde': '🇨🇻',
	'Ivory Coast': '🇨🇮', Romania: '🇷🇴',
};

export function flag(name: string): string {
	return FLAG_MAP[name] ?? '🏳️';
}

/** Genera código alfanumérico aleatorio */
export function generateCode(length = 8): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
