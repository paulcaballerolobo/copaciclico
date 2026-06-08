import type { Country, Match, Variable, VariableCategory, Group, StatCard } from './types';

export const COUNTRIES: Record<string, Country> = {
	ARG: {
		flag: '🇦🇷', name: 'Argentina', group: 'J', govt: 'Democracia liberal', leader: 'Milei', autocracy: false,
		economia: 'En ajuste fiscal. Inflación ~50% anual (bajando). Pobreza 40%.',
		relacion: '— (es Argentina)',
		politico: 'Primer gobierno libertario de América Latina. Reforma estructural del Estado en curso.',
		pobreza: 40.1, gini: 42.0, pisa: 401, aprobacion: 35.5, prensa: 26, pib: 13000, cerveza: 44, feriados: 19
	},
	DZA: {
		flag: '🇩🇿', name: 'Argelia', group: 'J', govt: 'Autocracia', leader: 'Tebboune', autocracy: true,
		economia: 'Dependiente del petróleo. Pobreza oficial 5.5% (metodología cuestionada).',
		relacion: 'Neutral. Lazos históricos con el Movimiento No Alineado.',
		politico: 'Sin elecciones libres verificables. Tebboune fue reelecto con el 94% de los votos en 2024.',
		pobreza: 5.5, gini: 27.6, pisa: 330, aprobacion: 78, prensa: 139, pib: 4500, cerveza: 1, feriados: 11
	},
	AUT: {
		flag: '🇦🇹', name: 'Austria', group: 'J', govt: 'Democracia', leader: 'Kickl (FPÖ)', autocracy: false,
		economia: 'Estable. PIB $57.000 p/c. Baja inflación.',
		relacion: 'Buenas relaciones diplomáticas. Comunidad austríaca en Argentina.',
		politico: 'El partido ultraderechista FPÖ ganó las elecciones 2024. Kickl fue vetado por varios países antes de asumir.',
		pobreza: 13.0, gini: 29.7, pisa: 487, aprobacion: 43, prensa: 31, pib: 57000, cerveza: 107, feriados: 13
	},
	JOR: {
		flag: '🇯🇴', name: 'Jordania', group: 'J', govt: 'Monarquía constitucional', leader: 'Rey Abdullah II', autocracy: true,
		economia: 'Economía de servicios y turismo. Alta desocupación juvenil.',
		relacion: 'Neutral. Comunidad árabe significativa en Argentina.',
		politico: 'Frontera con Israel y Gaza. Recibe millones de refugiados sirios. El Rey mantiene equilibrio entre Occidente y mundo árabe.',
		pobreza: 15.7, gini: 33.7, pisa: 381, aprobacion: 55, prensa: 96, pib: 4400, cerveza: 2, feriados: 11
	},
	MEX: {
		flag: '🇲🇽', name: 'México', group: 'A', govt: 'Democracia', leader: 'Sheinbaum', autocracy: false,
		economia: '$11.000 PIB p/c. Beneficiada por nearshoring post-Trump.',
		relacion: 'Tensión desde el asilo de funcionarios K en embajada mexicana en BUE (2024).',
		politico: 'Primera presidenta mujer en la historia de México. Sheinbaum continuó el proyecto de AMLO con perfil más técnico.',
		pobreza: 36.3, gini: 45.4, pisa: 410, aprobacion: 68, prensa: 82, pib: 11000, cerveza: 48, feriados: 7
	},
	KOR: {
		flag: '🇰🇷', name: 'Corea del Sur', group: 'A', govt: 'Democracia', leader: 'Lee Jae-myung', autocracy: false,
		economia: '$33.000 PIB p/c. Potencia tecnológica global.',
		relacion: 'Buenas relaciones. Inversión coreana en litio argentino.',
		politico: 'Yoon Suk-yeol intentó un autogolpe en dic 2024. El Congreso lo destituyó.',
		pobreza: 14.4, gini: 31.4, pisa: 527, aprobacion: 55, prensa: 62, pib: 33000, cerveza: 77, feriados: 16
	},
	ZAF: {
		flag: '🇿🇦', name: 'Sudáfrica', group: 'A', govt: 'Democracia (coalición)', leader: 'Ramaphosa', autocracy: false,
		economia: 'La más desigual del mundo (Gini 63). 55% de pobreza. Alta criminalidad.',
		relacion: 'Neutral. Cooperación Sur-Sur.',
		politico: 'El ANC perdió la mayoría absoluta por primera vez en 2024 y gobierna en coalición. País fundador del BRICS.',
		pobreza: 55.5, gini: 63.0, pisa: 288, aprobacion: 40, prensa: 28, pib: 6200, cerveza: 58, feriados: 12
	},
	CZE: {
		flag: '🇨🇿', name: 'Rep. Checa', group: 'A', govt: 'Democracia', leader: 'Fiala', autocracy: false,
		economia: '$28.000 PIB p/c. Una de las más igualitarias de Europa.',
		relacion: 'Neutral. Comunidad checa en Argentina.',
		politico: 'Integración total a la UE y OTAN. Fuerte apoyo a Ucrania. Mayor consumidor de cerveza per cápita del planeta.',
		pobreza: 10.2, gini: 25.3, pisa: 493, aprobacion: 48, prensa: 24, pib: 28000, cerveza: 181, feriados: 13
	},
	CAN: {
		flag: '🇨🇦', name: 'Canadá', group: 'B', govt: 'Democracia', leader: 'Carney', autocracy: false,
		economia: '$53.000 PIB p/c. Presionada por tarifas Trump.',
		relacion: 'Buenas relaciones. Inversión canadiense en minería.',
		politico: 'Carney ganó las elecciones abr 2025 con un discurso anti-Trump. Es economista y ex gobernador de bancos centrales.',
		pobreza: 12.1, gini: 31.7, pisa: 519, aprobacion: 49, prensa: 14, pib: 53000, cerveza: 68, feriados: 10
	},
	BIH: {
		flag: '🇧🇦', name: 'Bosnia Herz.', group: 'B', govt: 'Democracia compleja', leader: 'Consejo tripartito', autocracy: false,
		economia: '$7.500 PIB p/c. Alta emigración de jóvenes.',
		relacion: 'Neutral. Comunidad bosnia en Argentina tras la guerra.',
		politico: 'País dividido en dos entidades desde los Acuerdos de Dayton (1995). La República Srpska sigue amenazando con la secesión.',
		pobreza: 16.9, gini: 33.0, pisa: 406, aprobacion: 35, prensa: 69, pib: 7500, cerveza: 40, feriados: 11
	},
	QAT: {
		flag: '🇶🇦', name: 'Qatar', group: 'B', govt: 'Monarquía absoluta', leader: 'Emir Al-Thani', autocracy: true,
		economia: '$84.000 PIB p/c. Gas natural. Sin pobreza oficial.',
		relacion: 'Inversión qatarí en Argentina. Qatar fue sede del Mundial 2022 donde Argentina salió campeona.',
		politico: 'Sin partidos políticos ni sindicatos. 2 millones de trabajadores migrantes construyeron los estadios del Mundial 2022.',
		pobreza: 2.0, gini: 41.1, pisa: 414, aprobacion: 80, prensa: 153, pib: 84000, cerveza: 0, feriados: 11
	},
	SUI: {
		flag: '🇨🇭', name: 'Suiza', group: 'B', govt: 'Democracia directa', leader: 'Consejo Federal (7)', autocracy: false,
		economia: '$92.000 PIB p/c. El más rico del torneo.',
		relacion: 'Neutral. Suiza alberga organismos internacionales y bancos.',
		politico: 'Neutralidad desde 1815. No pertenece a la UE. Sede de la ONU, Cruz Roja y Foro Económico Mundial.',
		pobreza: 8.7, gini: 32.7, pisa: 508, aprobacion: 58, prensa: 10, pib: 92000, cerveza: 56, feriados: 9
	},
	BRA: {
		flag: '🇧🇷', name: 'Brasil', group: 'C', govt: 'Democracia', leader: 'Lula', autocracy: false,
		economia: '$11.000 PIB p/c. La más grande de América Latina. Potencia agrícola y minera.',
		relacion: 'Buenas relaciones históricas. Brasil es el rival continental de Argentina en todo.',
		politico: 'Lula (PT) ganó las elecciones 2022. Gobierna con un Congreso fragmentado y bajo presión judicial.',
		pobreza: 33.0, gini: 48.9, pisa: 359, aprobacion: 45, prensa: 77, pib: 11000, cerveza: 65, feriados: 10
	},
	MAR: {
		flag: '🇲🇦', name: 'Marruecos', group: 'C', govt: 'Monarquía constitucional', leader: 'Rey Mohammed VI', autocracy: true,
		economia: '$4.500 PIB p/c. Agricultura, turismo y fosfatos. Puerta de entrada a Europa.',
		relacion: 'Neutral. Marruecos reconoce a Argentina como nación hermana del mundo árabe-latino.',
		politico: 'El Rey Mohammed VI concentra el poder real. Las elecciones 2021 confirmaron al Partido de la Justicia y el Desarrollo.',
		pobreza: 15.0, gini: 39.9, pisa: 367, aprobacion: 75, prensa: 138, pib: 4500, cerveza: 10, feriados: 12
	},
	HAI: {
		flag: '🇭🇹', name: 'Haití', group: 'C', govt: 'Estado frágil', leader: 'Consejo de Transición', autocracy: true,
		economia: '$1.800 PIB p/c. El país más pobre de Occidente. Pandillas armadas controlan el 80% del territorio.',
		relacion: 'Neutral. Comunidad haitiana en Argentina. Lazos históricos con América Latina.',
		politico: 'Sin gobierno funcional desde 2021. Terremoto de 2021 mató a 22.000. Consejo de Transición asumió en 2024.',
		pobreza: 60.0, gini: 41.9, pisa: 320, aprobacion: 25, prensa: 115, pib: 1800, cerveza: 5, feriados: 11
	},
	SCO: {
		flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Escocia', group: 'C', govt: 'Democracia (UK)', leader: 'Yousaf (SNP)', autocracy: false,
		economia: '$40.000 PIB p/c. Economía petrolera del North Sea + servicios financieros.',
		relacion: 'Buenas relaciones. Comunidad escocesa en Argentina. Independiente del Reino Unido en política exterior.',
		politico: 'El SNP busca la independencia. Humza Yousaf lidera el gobierno devuelto de Edimburgo.',
		pobreza: 13.0, gini: 29.4, pisa: 504, aprobacion: 55, prensa: 20, pib: 40000, cerveza: 82, feriados: 9
	}
};

export const GROUPS: Record<string, Group> = {
	A: { name: 'Grupo A', countries: ['MEX', 'KOR', 'ZAF', 'CZE'] },
	B: { name: 'Grupo B', countries: ['CAN', 'BIH', 'QAT', 'SUI'] },
	C: { name: 'Grupo C', countries: ['BRA', 'MAR', 'HAI', 'SCO'] },
	J: { name: 'Grupo J', countries: ['ARG', 'DZA', 'AUT', 'JOR'] }
};

export const VARIABLES: { cats: VariableCategory[] } = {
	cats: [
		{
			label: 'Categoría 1 — Política y economía',
			vars: [
				{ id: 'pobreza', label: 'Pobreza %', dir: 'asc', unit: '%', desc: 'menor = mejor' },
				{ id: 'gini', label: 'Desigualdad (Gini)', dir: 'asc', unit: '', desc: 'menor = mejor' },
				{ id: 'pisa', label: 'Educación (PISA)', dir: 'desc', unit: 'pts', desc: 'mayor = mejor' },
				{ id: 'aprobacion', label: 'Aprobación presidencial', dir: 'desc', unit: '%', desc: 'mayor = mejor' },
				{ id: 'prensa', label: 'Libertad de prensa (puesto)', dir: 'asc', unit: '°', desc: 'menor puesto = mejor' },
				{ id: 'pib', label: 'PIB per cápita', dir: 'desc', unit: 'USD', desc: 'mayor = mejor' }
			]
		},
		{
			label: 'Categoría 2 — Bienestar',
			vars: [
				{ id: 'cerveza', label: 'Consumo cerveza (L/año)', dir: 'desc', unit: 'L', desc: 'mayor = mejor (según este bracket)' },
				{ id: 'feriados', label: 'Feriados públicos', dir: 'desc', unit: 'días', desc: 'más descanso = más feliz' }
			]
		},
		{
			label: 'Categoría 3 — Las picantes 🌶 (se desbloquean en cuartos)',
			vars: [
				{ id: 'locked1', label: 'Frecuencia sexual', dir: 'desc', unit: '', desc: '', locked: true },
				{ id: 'locked2', label: 'Duración promedio del beso', dir: 'desc', unit: '', desc: '', locked: true },
				{ id: 'locked3', label: 'Touch index', dir: 'desc', unit: '', desc: '', locked: true }
			]
		}
	]
};

export const EDITORIAL: Record<string, Record<string, string>> = {
	pobreza: {
		A: 'Sudáfrica (55.5%) queda última. Rep. Checa (10.2%) clasifica primera. Una diferencia de 45 puntos porcentuales dentro del mismo grupo.',
		B: 'Qatar "gana" con 2% de pobreza oficial. Pero el dato excluye a los 2 millones de migrantes que construyeron sus estadios del Mundial 2022.',
		C: 'Haití (60%) es el país más pobre de Occidente. Brasil (33%) también queda mal. Escocia (13%) lidera el grupo con facilidad.',
		J: 'Argentina lidera el grupo en pobreza con 40.1%. Argelia sorprende con 5.5% oficial, pero su metodología es cuestionada por organismos internacionales.'
	},
	gini: {
		A: 'Sudáfrica (Gini 63.0) es el país más desigual del mundo entre los 48 clasificados al Mundial 2026.',
		B: 'Suiza (32.7) es la más igualitaria del grupo. Qatar (41.1) tiene una distribución desigual que se profundiza si se incluye la población migrante.',
		C: 'Brasil (Gini 48.9) es el segundo país más desigual del torneo después de Sudáfrica. Escocia (29.4) es la más igualitaria del grupo.',
		J: 'Argelia (27.6) es el más igualitario del grupo, herencia de economía planificada. Argentina (42.0) queda última.'
	},
	pisa: {
		A: 'Corea del Sur (527) domina con el mejor puntaje del torneo. Sudáfrica (288) tiene el peor resultado educativo de los 48 países clasificados.',
		B: 'Canadá (519) lidera. Qatar (414) invierte enormes recursos en educación pero aún no se refleja en resultados PISA.',
		C: 'Escocia (504) domina el grupo con facilidad. Brasil (359) y Marruecos (367) tienen sistemas educativos en crisis. Haití (320) tiene el peor puntaje del torneo.',
		J: 'Austria (487) vs Argentina (401): 86 puntos de diferencia. Argelia nunca participó de PISA — el dato es una estimación basada en evaluaciones regionales.'
	},
	aprobacion: {
		A: 'Sheinbaum (68%) aplasta a todos. Es la presidenta más popular entre los 48 países del torneo. Dato de encuestas nacionales, mayo 2026.',
		B: 'Qatar (80%) lidera... pero el Emir es también quien ordena las encuestas. Bosnia queda última (35%).',
		C: 'Marruecos (75%) lidera... pero el Rey Mohammed VI no enfrenta elecciones reales. Haití (25%) tiene la aprobación más baja del torneo — y no tiene gobierno funcional.',
		J: 'Milei (35.5%) termina último del Grupo J. Argelia (78%) lidera, pero en una autocracia nadie verifica si esa encuesta es real. ★ = autocracias.'
	},
	prensa: {
		A: 'México (puesto 82) tiene una prensa formalmente libre pero con periodistas asesinados. Corea (62) mejoró desde el gobierno de Yoon.',
		B: 'Qatar (puesto 153 de 180) es el menos libre de los 48 países clasificados. Suiza (10) está entre los más libres del mundo.',
		C: 'Marruecos (puesto 138) vs Escocia/UK (20): la mayor brecha de libertad de prensa en el grupo. Brasil (77) tiene prensa libre pero con amenazas.',
		J: 'Argelia (puesto 139) vs Argentina (26): la mayor brecha de libertad de prensa en el grupo. Jordania (96) bajo monarquía.'
	},
	pib: {
		A: 'Corea del Sur ($33.000) triplica a México ($11.000). La brecha económica no siempre refleja el resultado futbolístico.',
		B: 'Suiza ($92.000) es el más rico del torneo. Bosnia ($7.500) el más pobre del grupo — 12 veces la diferencia.',
		C: 'Escocia ($40.000) vs Haití ($1.800): 22 veces más rico. Brasil ($11.000) y Marruecos ($4.500) en el medio.',
		J: 'Austria ($57.000) vs Jordania ($4.400): 13 veces más rico. Argentina ($13.000) queda tercera.'
	},
	cerveza: {
		A: 'Rep. Checa (181L) es el mayor consumidor de cerveza del planeta. Sudáfrica (58L) en segundo lugar del grupo.',
		B: 'Qatar (0L) queda último. La cerveza está prohibida en el país sede del Mundial 2022. Bosnia (40L) lidera el grupo.',
		C: 'Escocia (82L) lidera el grupo. Brasil (65L) le sigue de cerca. Haití (5L) y Marruecos (10L) casi no consumen cerveza por razones culturales y religiosas.',
		J: 'Argentina (44L) vs Austria (107L): los austríacos toman el doble. Argelia (1L) y Jordania (2L) casi no consumen cerveza por razones religiosas.'
	},
	feriados: {
		A: 'Corea del Sur (16 feriados) lidera el Grupo A. México tiene solo 7 — el mínimo del torneo entre los primeros.',
		B: 'Qatar y Bosnia empatan con 11 feriados. Canadá (10) tiene menos descanso que todos sus vecinos del grupo.',
		C: 'Marruecos (12 feriados) lidera el grupo. Escocia (9) tiene los menos. Brasil (10) y Haití (11) en el medio.',
		J: 'Argentina tiene 19 feriados anuales — el más alto de los 48 países clasificados. ¿Será por eso que juegan bien al fútbol?'
	}
};

export const MATCHES: Match[] = [
	// Grupo A
	{ id: 'a1', group: 'A', date: '11 jun', time: '21:00', home: 'MEX', away: 'CZE', venue: 'AT&T Stadium, Dallas' },
	{ id: 'a2', group: 'A', date: '11 jun', time: '18:00', home: 'KOR', away: 'ZAF', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'a3', group: 'A', date: '16 jun', time: '21:00', home: 'MEX', away: 'ZAF', venue: 'AT&T Stadium, Dallas' },
	{ id: 'a4', group: 'A', date: '16 jun', time: '18:00', home: 'KOR', away: 'CZE', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'a5', group: 'A', date: '20 jun', time: '21:00', home: 'MEX', away: 'KOR', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'a6', group: 'A', date: '20 jun', time: '21:00', home: 'ZAF', away: 'CZE', venue: 'AT&T Stadium, Dallas' },
	// Grupo B
	{ id: 'b1', group: 'B', date: '12 jun', time: '18:00', home: 'CAN', away: 'QAT', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'b2', group: 'B', date: '12 jun', time: '21:00', home: 'BIH', away: 'SUI', venue: 'AT&T Stadium, Dallas' },
	{ id: 'b3', group: 'B', date: '17 jun', time: '21:00', home: 'CAN', away: 'BIH', venue: 'AT&T Stadium, Dallas' },
	{ id: 'b4', group: 'B', date: '17 jun', time: '18:00', home: 'QAT', away: 'SUI', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'b5', group: 'B', date: '21 jun', time: '21:00', home: 'CAN', away: 'SUI', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'b6', group: 'B', date: '21 jun', time: '21:00', home: 'BIH', away: 'QAT', venue: 'AT&T Stadium, Dallas' },
	// Grupo C
	{ id: 'c1', group: 'C', date: '13 jun', time: '18:00', home: 'BRA', away: 'SCO', venue: 'MetLife Stadium, Nueva York' },
	{ id: 'c2', group: 'C', date: '13 jun', time: '21:00', home: 'MAR', away: 'HAI', venue: 'MetLife Stadium, Nueva York' },
	{ id: 'c3', group: 'C', date: '17 jun', time: '21:00', home: 'BRA', away: 'MAR', venue: 'MetLife Stadium, Nueva York' },
	{ id: 'c4', group: 'C', date: '18 jun', time: '18:00', home: 'SCO', away: 'HAI', venue: 'MetLife Stadium, Nueva York' },
	{ id: 'c5', group: 'C', date: '22 jun', time: '21:00', home: 'BRA', away: 'HAI', venue: 'MetLife Stadium, Nueva York' },
	{ id: 'c6', group: 'C', date: '22 jun', time: '21:00', home: 'SCO', away: 'MAR', venue: 'MetLife Stadium, Nueva York' },
	// Grupo J — Argentina
	{ id: 'j1', group: 'J', date: '12 jun', time: '21:00', home: 'ARG', away: 'DZA', venue: 'AT&T Stadium, Dallas', arge: true },
	{ id: 'j2', group: 'J', date: '17 jun', time: '18:00', home: 'AUT', away: 'JOR', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'j3', group: 'J', date: '21 jun', time: '21:00', home: 'ARG', away: 'AUT', venue: 'AT&T Stadium, Dallas', arge: true },
	{ id: 'j4', group: 'J', date: '21 jun', time: '21:00', home: 'DZA', away: 'JOR', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'j5', group: 'J', date: '25 jun', time: '21:00', home: 'ARG', away: 'JOR', venue: 'AT&T Stadium, Dallas', arge: true },
	{ id: 'j6', group: 'J', date: '25 jun', time: '21:00', home: 'DZA', away: 'AUT', venue: 'SoFi Stadium, Los Ángeles' }
];

export const STATS_DATA: StatCard[] = [
	{ emoji: '🏆', title: 'Copas del mundo vs democracia', text: 'Brasil (5 copas) tiene un Índice de Democracia de 6.9/10. Argentina (3 copas): 7.4/10. Uruguay (2 copas): 8.5/10. Los campeones históricos son más democráticos que el promedio del torneo.', highlight: '' },
	{ emoji: '✈️', title: 'El viaje más caro', text: 'Para un argentino, volar a Dallas ida y vuelta en junio cuesta ~USD 2.500. Eso equivale a 8 salarios mínimos argentinos.', highlight: 'Para un suizo: 5 días de trabajo.' },
	{ emoji: '⚽', title: 'El jugador más caro vs su país', text: 'Kylian Mbappé vale €180 millones. El PIB per cápita de Francia: $43.000 por año.', highlight: 'Mbappé vale lo mismo que 4.186 franceses trabajando un año entero.' },
	{ emoji: '🌡️', title: 'Temperatura en cancha', text: 'Los partidos del Grupo J en Dallas serán con 38°C promedio. Argelia entrena en el desierto a 45°C.', highlight: 'Ventaja climática para Argelia.' },
	{ emoji: '📺', title: 'Horarios para Argentina', text: 'Los partidos de Argentina arrancan a las 21:00 hs de Argentina. En Tokio, esos mismos partidos son a las 9:00 del día siguiente.', highlight: '' },
	{ emoji: '🍺', title: 'El dato que nadie vio venir', text: 'Rep. Checa toma 181 litros de cerveza per cápita por año — el mayor consumo del planeta. También tiene el Gini más bajo del grupo (25.3) y el mejor PISA.', highlight: 'Correlación ≠ causalidad. Pero igual.' },
	{ emoji: '🗳️', title: 'El mandatario más impopular del torneo', text: 'Milei (35.5%) compite por el puesto con Bosnia (35%). La más popular: Sheinbaum de México con 68%.', highlight: 'Los dos países con presidente más impopular están en el mismo torneo.' },
	{ emoji: '🧱', title: 'El estadio de Qatar costó más que un Mundial entero', text: 'El presupuesto total de Qatar para el Mundial 2022 fue de ~$200.000 millones. El SoFi Stadium de LA costó "solo" $5.500 millones.', highlight: 'El costo por partido en Qatar: ~$5.000 millones.' }
];

// Utility: safely extract a numeric metric from a country
export function getMetric(c: Country, varId: string): number {
	const val = (c as unknown as Record<string, unknown>)[varId];
	return typeof val === 'number' ? val : 0;
}
