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

/** FIFA code → nombre en español */
export const FIFA_TO_NAME: Record<string, string> = {
	ARG: 'Argentina', BRA: 'Brasil', FRA: 'Francia', GER: 'Alemania', ESP: 'España',
	ENG: 'Inglaterra', POR: 'Portugal', ITA: 'Italia', NED: 'Países Bajos', BEL: 'Bélgica',
	URU: 'Uruguay', MEX: 'México', USA: 'Estados Unidos', CAN: 'Canadá', JPN: 'Japón',
	MAR: 'Marruecos', SEN: 'Senegal', ECU: 'Ecuador', COL: 'Colombia', CHI: 'Chile',
	SUI: 'Suiza', DEN: 'Dinamarca', CRO: 'Croacia', SRB: 'Serbia', POL: 'Polonia',
	AUS: 'Australia', KSA: 'Arabia Saudita', IRN: 'Irán', KOR: 'Corea del Sur',
	GHA: 'Ghana', CMR: 'Camerún', ALG: 'Argelia', CZE: 'Rep. Checa', CRC: 'Costa Rica',
	PAR: 'Paraguay', VEN: 'Venezuela', PER: 'Perú', BOL: 'Bolivia', PAN: 'Panamá',
	HON: 'Honduras', JAM: 'Jamaica', TUR: 'Turquía', UKR: 'Ucrania', AUT: 'Austria',
	HUN: 'Hungría', ROU: 'Rumanía', SCO: 'Escocia', WAL: 'Gales', GRE: 'Grecia',
	SVK: 'Eslovaquia', SVN: 'Eslovenia', RSA: 'Sudáfrica', NGA: 'Nigeria', EGY: 'Egipto',
	TUN: 'Túnez', MLI: 'Malí', COD: 'RD Congo', ZIM: 'Zimbabue', SUD: 'Sudán',
	CIV: 'Costa de Marfil', ZAM: 'Zambia', TAN: 'Tanzania', NZL: 'Nueva Zelanda',
	IDN: 'Indonesia', QAT: 'Catar', IRQ: 'Irak', JOR: 'Jordania', OMA: 'Omán',
	BHR: 'Baréin', KUW: 'Kuwait', UAE: 'Emiratos Árabes', CHN: 'China',
	UZB: 'Uzbekistán', IND: 'India', THA: 'Tailandia', VIE: 'Vietnam',
	PHI: 'Filipinas', NOR: 'Noruega', SWE: 'Suecia', HAI: 'Haití',
	BIH: 'Bosnia y Herz.', CUW: 'Curazao', CPV: 'Cabo Verde',
};

/** Nombre en español a partir del código FIFA */
export function teamName(code: string): string {
	return FIFA_TO_NAME[code] ?? code;
}

/** Formatea fecha para encabezado de partido: "VIERNES. 12 JUN · 16:00hs" */
export function formatMatchDate(iso: string): string {
	const d = new Date(iso);
	const weekday = d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long' });
	const day = d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric' });
	const month = d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', month: 'short' });
	const time = d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });
	return `${weekday.toUpperCase()}. ${day} ${month.toUpperCase()} · ${time}hs`;
}

/** FIFA code → ISO 3166-1 alpha-2 (para flag-icons CSS) */
export const FIFA_TO_ISO: Record<string, string> = {
	ARG: 'ar', BRA: 'br', FRA: 'fr', GER: 'de', ESP: 'es', ENG: 'gb-eng',
	POR: 'pt', ITA: 'it', NED: 'nl', BEL: 'be', URU: 'uy', MEX: 'mx',
	USA: 'us', CAN: 'ca', JPN: 'jp', MAR: 'ma', SEN: 'sn', ECU: 'ec',
	COL: 'co', CHI: 'cl', SUI: 'ch', DEN: 'dk', CRO: 'hr', SRB: 'rs',
	POL: 'pl', AUS: 'au', KSA: 'sa', IRN: 'ir', KOR: 'kr', GHA: 'gh',
	CMR: 'cm', ALG: 'dz', CZE: 'cz', CRC: 'cr', PAR: 'py', VEN: 've',
	PER: 'pe', BOL: 'bo', PAN: 'pa', HON: 'hn', JAM: 'jm', TUR: 'tr',
	UKR: 'ua', AUT: 'at', HUN: 'hu', ROU: 'ro', SCO: 'gb-sct', WAL: 'gb-wls',
	GRE: 'gr', SVK: 'sk', SVN: 'si', RSA: 'za', NGA: 'ng', EGY: 'eg',
	TUN: 'tn', MLI: 'ml', COD: 'cd', ZIM: 'zw', SUD: 'sd', CIV: 'ci',
	ZAM: 'zm', TAN: 'tz', NZL: 'nz', IDN: 'id', QAT: 'qa', IRQ: 'iq',
	JOR: 'jo', OMA: 'om', BHR: 'bh', KUW: 'kw', UAE: 'ae', CHN: 'cn',
	UZB: 'uz', IND: 'in', THA: 'th', VIE: 'vn', PHI: 'ph', NOR: 'no',
	SWE: 'se', HAI: 'ht', BIH: 'ba', CUW: 'cw', CPV: 'cv',
};

/** Devuelve el código ISO para usar con flag-icons: `fi fi-{teamIso(code)}` */
export function teamIso(code: string): string {
	return FIFA_TO_ISO[code] ?? '';
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
