import type { Country, Match, Variable, VariableCategory, Group, StatCard } from './types';

export const COUNTRIES: Record<string, Country> = {
	// GRUPO A
	MEX: {
		flag: '🇲🇽', name: 'México', group: 'A', govt: 'Democracia', leader: 'Sheinbaum', autocracy: false,
		economia: '$11.000 PIB p/c. Beneficiada por nearshoring post-Trump.',
		relacion: 'Tensión desde el asilo de funcionarios K en embajada mexicana en BUE (2024).',
		politico: 'Primera presidenta mujer en la historia de México. Sheinbaum continuó el proyecto de AMLO con perfil más técnico.',
		pobreza: 2.5, gini: 45.4, deuda: 49.7, pisa: 410, aprobacion: 68, prensa: 47.0, pib: 13200, gasto: 23.3, mcdonalds: 3.8, cerveza: 83.4, obesidad: 28.9, sueno: 7.1, vacaciones: 12, feriados: 7, felicidad: 6.67, frecuencia: 115, pornhub: 9.28, preservativos: 68
	},
	RSA: {
		flag: '🇿🇦', name: 'Sudáfrica', group: 'A', govt: 'Democracia (coalición)', leader: 'Ramaphosa', autocracy: false,
		economia: 'La más desigual del mundo (Gini 63). Alta criminalidad.',
		relacion: 'Neutral. Cooperación Sur-Sur.',
		politico: 'El ANC perdió la mayoría absoluta por primera vez en 2024 y gobierna en coalición. País fundador del BRICS.',
		pobreza: 18.9, gini: 63.0, deuda: 76.9, pisa: 288, aprobacion: 38, prensa: 75.71, pib: 7500, gasto: 25, mcdonalds: 5.2, cerveza: 75.2, obesidad: 28.3, sueno: 7, vacaciones: 21, feriados: 12, felicidad: 4.7, frecuencia: 77, pornhub: 9.5, preservativos: 54
	},
	KOR: {
		flag: '🇰🇷', name: 'Corea del Sur', group: 'A', govt: 'Democracia', leader: 'Lee Jae-myung', autocracy: false,
		economia: '$33.000 PIB p/c. Potencia tecnológica global.',
		relacion: 'Buenas relaciones. Inversión coreana en litio argentino.',
		politico: 'Yoon Suk-yeol intentó un autogolpe en dic 2024. El Congreso lo destituyó.',
		pobreza: 0.2, gini: 31.4, deuda: 46.8, pisa: 527, aprobacion: 42, prensa: 64.06, pib: 37412, gasto: 13, mcdonalds: 8.4, cerveza: 44.6, obesidad: 6.3, sueno: 6.3, vacaciones: 15, feriados: 16, felicidad: 5.95, frecuencia: 91, pornhub: 9.83, preservativos: 82
	},
	CZE: {
		flag: '🇨🇿', name: 'Rep. Checa', group: 'A', govt: 'Democracia', leader: 'Fiala', autocracy: false,
		economia: '$28.000 PIB p/c. Una de las más igualitarias de Europa.',
		relacion: 'Neutral. Comunidad checa en Argentina.',
		politico: 'Integración total a la UE y OTAN. Fuerte apoyo a Ucrania. Mayor consumidor de cerveza per cápita del planeta.',
		pobreza: 0.5, gini: 26.2, deuda: 44, pisa: 493, aprobacion: 55, prensa: 83.96, pib: 39795, gasto: 18, mcdonalds: 10.5, cerveza: 148.8, obesidad: 26, sueno: 7.5, vacaciones: 20, feriados: 13, felicidad: 6.43, frecuencia: 114, pornhub: 9.75, preservativos: 86
	},
	// GRUPO B
	CAN: {
		flag: '🇨🇦', name: 'Canadá', group: 'B', govt: 'Democracia', leader: 'Carney', autocracy: false,
		economia: '$53.000 PIB p/c. Presionada por tarifas Trump.',
		relacion: 'Buenas relaciones. Inversión canadiense en minería.',
		politico: 'Carney ganó las elecciones abr 2025 con un discurso anti-Trump. Es economista y ex gobernador de bancos centrales.',
		pobreza: 0.3, gini: 31.7, deuda: 111, pisa: 519, aprobacion: 44, prensa: 78.75, pib: 60305, gasto: 9.5, mcdonalds: 38, cerveza: 60, obesidad: 29.4, sueno: 7.4, vacaciones: 10, feriados: 10, felicidad: 6.9, frecuencia: 112, pornhub: 10.08, preservativos: 75
	},
	BIH: {
		flag: '🇧🇦', name: 'Bosnia Herz.', group: 'B', govt: 'Democracia compleja', leader: 'Consejo tripartito', autocracy: false,
		economia: '$7.500 PIB p/c. Alta emigración de jóvenes.',
		relacion: 'Neutral. Comunidad bosnia en Argentina tras la guerra.',
		politico: 'País dividido en dos entidades desde los Acuerdos de Dayton (1995). La República Srpska sigue amenazando con la secesión.',
		pobreza: 0.2, gini: 28.9, deuda: 33, pisa: 406, aprobacion: 30, prensa: 56.33, pib: 9500, gasto: 31, mcdonalds: 4.5, cerveza: 71.4, obesidad: 22.5, sueno: 7.2, vacaciones: 20, feriados: 7, felicidad: 5.72, frecuencia: 95, pornhub: 9.67, preservativos: 36
	},
	QAT: {
		flag: '🇶🇦', name: 'Qatar', group: 'B', govt: 'Monarquía absoluta', leader: 'Emir Al-Thani', autocracy: true,
		economia: '$84.000 PIB p/c. Gas natural. Sin pobreza oficial.',
		relacion: 'Inversión qatarí en Argentina. Qatar fue sede del Mundial 2022 donde Argentina salió campeona.',
		politico: 'Sin partidos políticos ni sindicatos. 2 millones de trabajadores migrantes construyeron los estadios del Mundial 2022.',
		pobreza: 0.5, gini: 41.0, deuda: 41.0, pisa: 414, aprobacion: 0, prensa: 60.0, pib: 68138, gasto: 11, mcdonalds: 10.5, cerveza: 0.5, obesidad: 35.1, sueno: 6.8, vacaciones: 30, feriados: 10, felicidad: 6.35, frecuencia: 60, pornhub: 0, preservativos: 43
	},
	SUI: {
		flag: '🇨🇭', name: 'Suiza', group: 'B', govt: 'Democracia directa', leader: 'Consejo Federal (7)', autocracy: false,
		economia: '$92.000 PIB p/c. El más rico del torneo.',
		relacion: 'Neutral. Suiza alberga organismos internacionales y bancos.',
		politico: 'Neutralidad desde 1815. No pertenece a la UE. Sede de la ONU, Cruz Roja y Foro Económico Mundial.',
		pobreza: 0.1, gini: 32.1, deuda: 27, pisa: 508, aprobacion: 52, prensa: 83.98, pib: 126177, gasto: 8.7, mcdonalds: 19, cerveza: 54, obesidad: 19.5, sueno: 7.6, vacaciones: 20, feriados: 12, felicidad: 7.06, frecuencia: 116, pornhub: 9.92, preservativos: 79
	},
	// GRUPO C
	BRA: {
		flag: '🇧🇷', name: 'Brasil', group: 'C', govt: 'Democracia', leader: 'Lula', autocracy: false,
		economia: '$11.000 PIB p/c. La más grande de América Latina. Potencia agrícola y minera.',
		relacion: 'Buenas relaciones históricas. Brasil es el rival continental de Argentina en todo.',
		politico: 'Lula (PT) ganó las elecciones 2022. Gobierna con un Congreso fragmentado y bajo presión judicial.',
		pobreza: 4.6, gini: 52.0, deuda: 87.3, pisa: 359, aprobacion: 49, prensa: 63.80, pib: 10700, gasto: 17.5, mcdonalds: 5.2, cerveza: 70.3, obesidad: 22.1, sueno: 7, vacaciones: 30, feriados: 13, felicidad: 6.03, frecuencia: 138, pornhub: 9.83, preservativos: 67
	},
	MAR: {
		flag: '🇲🇦', name: 'Marruecos', group: 'C', govt: 'Monarquía constitucional', leader: 'Rey Mohammed VI', autocracy: true,
		economia: '$4.500 PIB p/c. Agricultura, turismo y fosfatos. Puerta de entrada a Europa.',
		relacion: 'Neutral. Marruecos reconoce a Argentina como nación hermana del mundo árabe-latino.',
		politico: 'El Rey Mohammed VI concentra el poder real. Las elecciones 2021 confirmaron al Partido de la Justicia y el Desarrollo.',
		pobreza: 1.0, gini: 39.5, deuda: 70.0, pisa: 367, aprobacion: 0, prensa: 43.0, pib: 4200, gasto: 37, mcdonalds: 0.7, cerveza: 3, obesidad: 26.1, sueno: 6.8, vacaciones: 18, feriados: 14, felicidad: 5.1, frecuencia: 70, pornhub: 0, preservativos: 70
	},
	HAI: {
		flag: '🇭🇹', name: 'Haití', group: 'C', govt: 'Estado frágil', leader: 'Consejo de Transición', autocracy: true,
		economia: '$1.800 PIB p/c. El país más pobre de Occidente. Pandillas armadas controlan el 80% del territorio.',
		relacion: 'Neutral. Comunidad haitiana en Argentina. Lazos históricos con América Latina.',
		politico: 'Sin gobierno funcional desde 2021. Terremoto de 2021 mató a 22.000. Consejo de Transición asumió en 2024.',
		pobreza: 49.0, gini: 41.1, deuda: 27.0, pisa: 320, aprobacion: 15, prensa: 49.0, pib: 1700, gasto: 55, mcdonalds: 0, cerveza: 10, obesidad: 8.5, sueno: 6.5, vacaciones: 15, feriados: 14, felicidad: 3.3, frecuencia: 80, pornhub: 0, preservativos: 34
	},
	SCO: {
		flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Escocia', group: 'C', govt: 'Democracia (UK)', leader: 'Forbes (SNP)', autocracy: false,
		economia: '$40.000 PIB p/c. Economía petrolera del North Sea + servicios financieros.',
		relacion: 'Buenas relaciones. Comunidad escocesa en Argentina.',
		politico: 'El SNP busca la independencia. Gobierno devuelto de Edimburgo dentro del Reino Unido.',
		pobreza: 1.0, gini: 32.4, deuda: 93.6, pisa: 504, aprobacion: 31, prensa: 78.89, pib: 61056, gasto: 10.5, mcdonalds: 19.8, cerveza: 66.3, obesidad: 28.0, sueno: 7.1, vacaciones: 28, feriados: 9, felicidad: 6.73, frecuencia: 108, pornhub: 9.92, preservativos: 75
	},
	// GRUPO D
	USA: {
		flag: '🇺🇸', name: 'Estados Unidos', group: 'D', govt: 'Democracia', leader: 'Trump', autocracy: false,
		economia: '$80.000 PIB p/c. La economía más grande del mundo. Profunda desigualdad interna.',
		relacion: 'Relación tensa. Política migratoria de Trump afecta directamente a argentinos y latinoamericanos.',
		politico: 'Trump regresó al poder en enero 2025. Segundo mandato marcado por aranceles, deportaciones y retiro de organismos internacionales.',
		pobreza: 0.6, gini: 39.4, deuda: 124, pisa: 0, aprobacion: 39, prensa: 65.49, pib: 94430, gasto: 12.9, mcdonalds: 40.2, cerveza: 65.4, obesidad: 36.2, sueno: 6.9, vacaciones: 0, feriados: 0, felicidad: 6.72, frecuencia: 110, pornhub: 10.12, preservativos: 61
	},
	PRY: {
		flag: '🇵🇾', name: 'Paraguay', group: 'D', govt: 'Democracia', leader: 'Santiago Peña', autocracy: false,
		economia: '$7.000 PIB p/c. Economía agroexportadora. Central hidroeléctrica Itaipú.',
		relacion: 'Relaciones diplomáticas formales. Paraguay no reconoce a Argentina como rival directo.',
		politico: 'El Partido Colorado gobierna hace más de 70 años con breves interrupciones. Peña asumió en 2023.',
		pobreza: 1.4, gini: 45.1, deuda: 45.2, pisa: 0, aprobacion: 43, prensa: 52, pib: 7000, gasto: 30, mcdonalds: 1.7, cerveza: 35, obesidad: 20.3, sueno: 7.1, vacaciones: 12, feriados: 11, felicidad: 5.55, frecuencia: 90, pornhub: 9.5, preservativos: 68
	},
	AUS: {
		flag: '🇦🇺', name: 'Australia', group: 'D', govt: 'Democracia', leader: 'Albanese', autocracy: false,
		economia: '$65.000 PIB p/c. Economía de servicios y minerales. Sin recesión desde 1991.',
		relacion: 'Buenas relaciones. Comunidad argentina en Australia, especialmente desde la pandemia.',
		politico: 'Albanese (laborista) ganó las elecciones 2022. Foco en cambio climático y relaciones con el Pacífico.',
		pobreza: 0.3, gini: 32.4, deuda: 44, pisa: 0, aprobacion: 40, prensa: 75.15, pib: 75648, gasto: 10.5, mcdonalds: 38, cerveza: 65, obesidad: 29.3, sueno: 7.9, vacaciones: 20, feriados: 8, felicidad: 7.1, frecuencia: 111, pornhub: 10, preservativos: 65
	},
	TUR: {
		flag: '🇹🇷', name: 'Turquía', group: 'D', govt: 'Democracia (concentración de poder)', leader: 'Erdoğan', autocracy: false,
		economia: '$15.000 PIB p/c. Inflación crónica. Potencia industrial regional.',
		relacion: 'Neutral. Lazos históricos con la comunidad árabe-turca en Argentina.',
		politico: 'Erdoğan gobierna desde 2003 con creciente concentración de poder. Reelecto en 2023 en segunda vuelta.',
		pobreza: 0.5, gini: 41.9, deuda: 25, pisa: 0, aprobacion: 48, prensa: 33, pib: 19018, gasto: 24.5, mcdonalds: 3.2, cerveza: 15, obesidad: 32.1, sueno: 6.9, vacaciones: 14, feriados: 14, felicidad: 4.6, frecuencia: 82, pornhub: 9.75, preservativos: 74
	},
	// GRUPO E
	GER: {
		flag: '🇩🇪', name: 'Alemania', group: 'E', govt: 'Democracia', leader: 'Merz (CDU)', autocracy: false,
		economia: '$55.000 PIB p/c. La mayor economía de Europa. En recesión técnica desde 2023.',
		relacion: 'Buenas relaciones. Comunidad alemana histórica en Argentina (Volga alemanes).',
		politico: 'Merz ganó las elecciones feb 2026. CDU volvió al poder después del gobierno Scholz. Ascenso del AfD como segunda fuerza.',
		pobreza: 0.1, gini: 31.7, deuda: 62.2, pisa: 0, aprobacion: 26, prensa: 83.85, pib: 65303, gasto: 12.2, mcdonalds: 18, cerveza: 86.9, obesidad: 22.3, sueno: 7.5, vacaciones: 20, feriados: 11, felicidad: 6.75, frecuencia: 107, pornhub: 9.92, preservativos: 75
	},
	CUW: {
		flag: '🇨🇼', name: 'Curazao', group: 'E', govt: 'Democracia (territorio autónomo)', leader: 'Pisas', autocracy: false,
		economia: 'Turismo y refinería. Alta dependencia de los Países Bajos.',
		relacion: 'Neutral. Primera aparición histórica en un Mundial.',
		politico: 'Territorio autónomo dentro del Reino de los Países Bajos desde 2010. La selección nacional clasificó por primera vez en la historia.',
		pobreza: 2.0, gini: 39.0, deuda: 55.0, pisa: 0, aprobacion: 38, prensa: 67.0, pib: 21062, gasto: 17, mcdonalds: 18.5, cerveza: 55, obesidad: 28, sueno: 7.2, vacaciones: 15, feriados: 13, felicidad: 6.5, frecuencia: 95, pornhub: 9.67, preservativos: 70
	},
	CIV: {
		flag: '🇨🇮', name: 'Costa de Marfil', group: 'E', govt: 'Democracia (cuestionada)', leader: 'Ouattara', autocracy: false,
		economia: '$2.600 PIB p/c. Mayor productor de cacao del mundo. Crecimiento sostenido.',
		relacion: 'Neutral. Cooperación Sur-Sur con África.',
		politico: 'Ouattara fue reelecto en 2020 en elecciones boicoteadas por la oposición. País recuperado de la guerra civil de 2011.',
		pobreza: 20.1, gini: 35.3, deuda: 57, pisa: 0, aprobacion: 45, prensa: 63.69, pib: 2700, gasto: 40, mcdonalds: 0, cerveza: 22, obesidad: 10.6, sueno: 6.8, vacaciones: 26, feriados: 14, felicidad: 5, frecuencia: 85, pornhub: 9.33, preservativos: 27
	},
	ECU: {
		flag: '🇪🇨', name: 'Ecuador', group: 'E', govt: 'Democracia', leader: 'Noboa', autocracy: false,
		economia: '$7.000 PIB p/c. Petróleo, banano y camarones. Crisis de seguridad.',
		relacion: 'Buenas relaciones. Comunidad ecuatoriana en Argentina.',
		politico: 'Noboa (33 años) ganó las elecciones 2023 en contexto de emergencia por violencia narco. Declaró estado de conflicto armado interno.',
		pobreza: 3.7, gini: 45.0, deuda: 50.6, pisa: 0, aprobacion: 43, prensa: 53, pib: 7200, gasto: 26.5, mcdonalds: 1.7, cerveza: 35, obesidad: 19.9, sueno: 7, vacaciones: 15, feriados: 12, felicidad: 5.36, frecuencia: 90, pornhub: 9.58, preservativos: 77
	},
	// GRUPO F
	NED: {
		flag: '🇳🇱', name: 'Países Bajos', group: 'F', govt: 'Democracia', leader: 'Schoof (VVD/PVV)', autocracy: false,
		economia: '$65.000 PIB p/c. Hub logístico de Europa. Puerto de Rotterdam.',
		relacion: 'Buenas relaciones. Comunidad neerlandesa en Argentina.',
		politico: 'Wilders (PVV) es el partido más grande pero no lidera el gobierno. Schoof encabeza una coalición de cuatro partidos desde 2024.',
		pobreza: 0.1, gini: 28.1, deuda: 46, pisa: 0, aprobacion: 34, prensa: 88.64, pib: 79918, gasto: 12, mcdonalds: 14.3, cerveza: 66.2, obesidad: 20.4, sueno: 8.1, vacaciones: 20, feriados: 11, felicidad: 7.3, frecuencia: 103, pornhub: 10.88, preservativos: 63
	},
	JPN: {
		flag: '🇯🇵', name: 'Japón', group: 'F', govt: 'Democracia', leader: 'Ishiba (LPD)', autocracy: false,
		economia: '$34.000 PIB p/c. Tercera economía del mundo. Deflación histórica y envejecimiento poblacional.',
		relacion: 'Buenas relaciones. Inversión japonesa en Argentina. Comunidad nikkei significativa.',
		politico: 'Ishiba lidera el LPD, partido que ha gobernado Japón casi sin interrupciones desde 1955. Perdió la mayoría parlamentaria en 2024.',
		pobreza: 0.7, gini: 32.9, deuda: 229.6, pisa: 0, aprobacion: 38, prensa: 63.14, pib: 35703, gasto: 16.8, mcdonalds: 24, cerveza: 33.7, obesidad: 4.3, sueno: 6.3, vacaciones: 10, feriados: 16, felicidad: 5.91, frecuencia: 92, pornhub: 11.03, preservativos: 55
	},
	SWE: {
		flag: '🇸🇪', name: 'Suecia', group: 'F', govt: 'Democracia', leader: 'Kristersson (M)', autocracy: false,
		economia: '$60.000 PIB p/c. Estado de bienestar avanzado. Tecnología e industria.',
		relacion: 'Buenas relaciones. Suecia es referente en derechos humanos.',
		politico: 'Kristersson gobierna con apoyo parlamentario de los Demócratas de Suecia (partido de ultraderecha). Ingresó a la OTAN en 2024.',
		pobreza: 0.2, gini: 27.6, deuda: 36, pisa: 0, aprobacion: 34, prensa: 88.13, pib: 70676, gasto: 12.8, mcdonalds: 19.8, cerveza: 44, obesidad: 20.6, sueno: 7.8, vacaciones: 25, feriados: 13, felicidad: 7.35, frecuencia: 102, pornhub: 9.83, preservativos: 75
	},
	TUN: {
		flag: '🇹🇳', name: 'Túnez', group: 'F', govt: 'Autocracia (post-2021)', leader: 'Saied', autocracy: true,
		economia: '$4.000 PIB p/c. Turismo y fosfatos. Crisis fiscal desde 2020.',
		relacion: 'Neutral. Lazos con el mundo árabe.',
		politico: 'Saied disolvió el Parlamento en 2021 y concentró el poder ejecutivo. Nueva constitución en 2022 eliminó controles institucionales.',
		pobreza: 0.2, gini: 32.8, deuda: 79.8, pisa: 0, aprobacion: 40, prensa: 45, pib: 4100, gasto: 34, mcdonalds: 1.7, cerveza: 4.5, obesidad: 27.3, sueno: 6.9, vacaciones: 15, feriados: 8, felicidad: 4.85, frecuencia: 70, pornhub: 0, preservativos: 63
	},
	// GRUPO G
	BEL: {
		flag: '🇧🇪', name: 'Bélgica', group: 'G', govt: 'Democracia', leader: 'De Wever (NVA)', autocracy: false,
		economia: '$55.000 PIB p/c. Hub de la UE. Sede de la OTAN.',
		relacion: 'Buenas relaciones. Bélgica alberga instituciones europeas.',
		politico: 'De Wever formó gobierno en 2024 tras 18 meses de negociación. Bélgica tiene el récord mundial de días sin gobierno.',
		pobreza: 0.1, gini: 25.0, deuda: 104.0, pisa: 0, aprobacion: 33, prensa: 80.12, pib: 65112, gasto: 13.5, mcdonalds: 8, cerveza: 57.4, obesidad: 22.1, sueno: 7.5, vacaciones: 20, feriados: 10, felicidad: 6.93, frecuencia: 98, pornhub: 9.83, preservativos: 70
	},
	EGY: {
		flag: '🇪🇬', name: 'Egipto', group: 'G', govt: 'Autocracia militar', leader: 'Al-Sisi', autocracy: true,
		economia: '$4.500 PIB p/c. Turismo, Canal de Suez y remesas.',
		relacion: 'Neutral. Lazos con el mundo árabe.',
		politico: 'Al-Sisi llegó al poder por golpe militar en 2013. Reelecto con el 89% de los votos en 2024. Derechos humanos muy cuestionados.',
		pobreza: 3.8, gini: 31.5, deuda: 90.9, pisa: 0, aprobacion: 0, prensa: 27, pib: 4500, gasto: 38.5, mcdonalds: 0.9, cerveza: 2, obesidad: 32, sueno: 6.7, vacaciones: 21, feriados: 15, felicidad: 4.3, frecuencia: 80, pornhub: 0, preservativos: 60
	},
	IRN: {
		flag: '🇮🇷', name: 'Irán', group: 'G', govt: 'Teocracia', leader: 'Pezeshkian / Jamenei', autocracy: true,
		economia: '$7.000 PIB p/c. Petróleo y gas. Inflación crónica por sanciones internacionales.',
		relacion: 'Tensión. Lazos con el eje "anti-imperialista".',
		politico: 'El poder real recae en el Líder Supremo Jamenei. Pezeshkian (reformista) ganó las elecciones 2024 pero con límites institucionales.',
		pobreza: 0.6, gini: 40.9, deuda: 30, pisa: 0, aprobacion: 28, prensa: 17, pib: 5800, gasto: 35, mcdonalds: 0, cerveza: 0.3, obesidad: 25.8, sueno: 7, vacaciones: 26, feriados: 27, felicidad: 4.65, frecuencia: 75, pornhub: 0, preservativos: 77
	},
	NZL: {
		flag: '🇳🇿', name: 'Nueva Zelanda', group: 'G', govt: 'Democracia', leader: 'Luxon (Nacional)', autocracy: false,
		economia: '$48.000 PIB p/c. Agricultura, turismo y servicios.',
		relacion: 'Buenas relaciones. Comunidad argentina en Nueva Zelanda.',
		politico: 'Luxon ganó las elecciones 2023 con una agenda de reducción del gasto público y ajuste fiscal.',
		pobreza: 0.2, gini: 33.9, deuda: 45.2, pisa: 0, aprobacion: 36, prensa: 81.37, pib: 52023, gasto: 11, mcdonalds: 32.5, cerveza: 56, obesidad: 30.8, sueno: 7.9, vacaciones: 20, feriados: 12, felicidad: 7.1, frecuencia: 100, pornhub: 9.92, preservativos: 65
	},
	// GRUPO H
	ESP: {
		flag: '🇪🇸', name: 'España', group: 'H', govt: 'Democracia', leader: 'Sánchez (PSOE)', autocracy: false,
		economia: '$35.000 PIB p/c. Turismo, agricultura y servicios. Alta desocupación juvenil.',
		relacion: 'Muy buenas relaciones. Argentina tiene más de 500.000 ciudadanos con pasaporte español.',
		politico: 'Sánchez gobierna en minoría con apoyo de partidos independentistas. Conflicto catalán latente.',
		pobreza: 0.6, gini: 32.0, deuda: 102.0, pisa: 0, aprobacion: 36, prensa: 77.35, pib: 41563, gasto: 15.4, mcdonalds: 11.8, cerveza: 91.8, obesidad: 23.8, sueno: 7.2, vacaciones: 30, feriados: 14, felicidad: 6.49, frecuencia: 113, pornhub: 9.63, preservativos: 66
	},
	CPV: {
		flag: '🇨🇻', name: 'Cabo Verde', group: 'H', govt: 'Democracia', leader: 'Neves (MpD)', autocracy: false,
		economia: '$4.500 PIB p/c. Economía insular. Turismo y remesas.',
		relacion: 'Neutral. Primera aparición histórica en un Mundial.',
		politico: 'Considerado uno de los países más democráticos de África. Archipelago atlántico de 10 islas.',
		pobreza: 13.0, gini: 42.4, deuda: 109.0, pisa: 0, aprobacion: 52, prensa: 74.98, pib: 4600, gasto: 28, mcdonalds: 0, cerveza: 35, obesidad: 20.5, sueno: 7.1, vacaciones: 22, feriados: 12, felicidad: 5.4, frecuencia: 85, pornhub: 9.5, preservativos: 61
	},
	SAU: {
		flag: '🇸🇦', name: 'Arabia Saudita', group: 'H', govt: 'Monarquía absoluta', leader: 'Mohammed bin Salman', autocracy: true,
		economia: '$28.000 PIB p/c. Petróleo. Vision 2030 intenta diversificar la economía.',
		relacion: 'Inversión saudí en Argentina. Saudi Aramco fue al IPO más grande de la historia.',
		politico: 'MBS concentra el poder real desde 2017. El caso Khashoggi marcó su imagen internacional. Anfitrión del Mundial 2034.',
		pobreza: 1.0, gini: 39.0, deuda: 24.0, pisa: 0, aprobacion: 0, prensa: 22.0, pib: 37811, gasto: 20, mcdonalds: 7, cerveza: 0.2, obesidad: 35.4, sueno: 6.8, vacaciones: 21, feriados: 12, felicidad: 6.13, frecuencia: 65, pornhub: 0, preservativos: 30
	},
	URY: {
		flag: '🇺🇾', name: 'Uruguay', group: 'H', govt: 'Democracia', leader: 'Orsi (FA)', autocracy: false,
		economia: '$22.000 PIB p/c. El más desarrollado de América del Sur.',
		relacion: 'Muy buenas relaciones. Rivalidad histórica y cultural profunda.',
		politico: 'Orsi (Frente Amplio) ganó las elecciones 2024. Uruguay es la democracia más consolidada de América Latina.',
		pobreza: 0.1, gini: 40.6, deuda: 70.3, pisa: 0, aprobacion: 41, prensa: 65.18, pib: 27608, gasto: 19, mcdonalds: 8.5, cerveza: 50, obesidad: 27.9, sueno: 7.3, vacaciones: 20, feriados: 11, felicidad: 6.57, frecuencia: 78, pornhub: 9.67, preservativos: 77
	},
	// GRUPO I
	FRA: {
		flag: '🇫🇷', name: 'Francia', group: 'I', govt: 'Democracia', leader: 'Bayrou (PM) / Macron', autocracy: false,
		economia: '$45.000 PIB p/c. Quinta economía del mundo. Turismo, lujo y aeronáutica.',
		relacion: 'Buenas relaciones. Francia tiene la mayor comunidad argentina fuera de España en Europa.',
		politico: 'Macron perdió la mayoría parlamentaria en 2024. Bayrou lidera el gobierno de minoría. RN de Le Pen es la primera fuerza.',
		pobreza: 0.1, gini: 30.7, deuda: 116.5, pisa: 0, aprobacion: 19, prensa: 76.62, pib: 52083, gasto: 14, mcdonalds: 23, cerveza: 32, obesidad: 21.6, sueno: 7.4, vacaciones: 30, feriados: 11, felicidad: 6.37, frecuencia: 106, pornhub: 10, preservativos: 67
	},
	SEN: {
		flag: '🇸🇳', name: 'Senegal', group: 'I', govt: 'Democracia', leader: 'Faye', autocracy: false,
		economia: '$2.800 PIB p/c. Pesca, turismo y petróleo (producción reciente).',
		relacion: 'Neutral. Lazos con el mundo francófono y el movimiento panafricanista.',
		politico: 'Faye (36 años) ganó las elecciones marzo 2024 con discurso soberanista. Senegal es la democracia más estable de África Occidental.',
		pobreza: 33.5, gini: 36.2, deuda: 118.4, pisa: 0, aprobacion: 54, prensa: 59.43, pib: 1900, gasto: 45, mcdonalds: 0, cerveza: 10, obesidad: 14, sueno: 6.9, vacaciones: 24, feriados: 14, felicidad: 4.9, frecuencia: 80, pornhub: 9.33, preservativos: 27
	},
	IRQ: {
		flag: '🇮🇶', name: 'Irak', group: 'I', govt: 'Democracia (frágil)', leader: 'Al-Sudani', autocracy: false,
		economia: '$5.000 PIB p/c. Petróleo representa el 90% de los ingresos fiscales.',
		relacion: 'Neutral. Lazos con el mundo árabe.',
		politico: 'Al-Sudani gobierna en coalición desde 2022. País reconstruyéndose post-ISIS. Influencia iraní y estadounidense simultánea.',
		pobreza: 2.5, gini: 29.5, deuda: 45.9, pisa: 0, aprobacion: 35, prensa: 28, pib: 6500, gasto: 31, mcdonalds: 0.2, cerveza: 1, obesidad: 30.4, sueno: 6.8, vacaciones: 20, feriados: 15, felicidad: 4.6, frecuencia: 70, pornhub: 0, preservativos: 53
	},
	NOR: {
		flag: '🇳🇴', name: 'Noruega', group: 'I', govt: 'Democracia', leader: 'Støre (AP)', autocracy: false,
		economia: '$100.000 PIB p/c. El más alto del torneo. Fondo soberano de $1,7 billones.',
		relacion: 'Buenas relaciones. Noruega es mediadora histórica de paz en conflictos latinoamericanos.',
		politico: 'Noruega es una monarquía constitucional. Støre lidera el gobierno laborista. Ingresos del petróleo financian un estado de bienestar robusto.',
		pobreza: 0.2, gini: 25.9, deuda: 42.7, pisa: 0, aprobacion: 31, prensa: 92.31, pib: 105877, gasto: 12.4, mcdonalds: 13.5, cerveza: 55.8, obesidad: 23, sueno: 7.6, vacaciones: 25, feriados: 12, felicidad: 7.26, frecuencia: 99, pornhub: 9.83, preservativos: 75
	},
	// GRUPO J
	ARG: {
		flag: '🇦🇷', name: 'Argentina', group: 'J', govt: 'Democracia liberal', leader: 'Milei', autocracy: false,
		economia: 'En ajuste fiscal. Inflación ~50% anual (bajando). Pobreza extrema 1.5%.',
		relacion: '— (es Argentina)',
		politico: 'Primer gobierno libertario de América Latina. Reforma estructural del Estado en curso.',
		pobreza: 1.5, gini: 40.7, deuda: 83.2, pisa: 401, aprobacion: 35, prensa: 55.0, pib: 14360, gasto: 26, mcdonalds: 5.5, cerveza: 38, obesidad: 28.3, sueno: 7, vacaciones: 14, feriados: 15, felicidad: 6.12, frecuencia: 105, pornhub: 9.73, preservativos: 72
	},
	ALG: {
		flag: '🇩🇿', name: 'Argelia', group: 'J', govt: 'Autocracia', leader: 'Tebboune', autocracy: true,
		economia: 'Dependiente del petróleo. Subsidios masivos a energía y alimentos.',
		relacion: 'Neutral. Lazos históricos con el Movimiento No Alineado.',
		politico: 'Sin elecciones libres verificables. Tebboune fue reelecto con el 94% de los votos en 2024.',
		pobreza: 0.5, gini: 27.6, deuda: 46.2, pisa: 330, aprobacion: 0, prensa: 28.0, pib: 5400, gasto: 38, mcdonalds: 0, cerveza: 1.5, obesidad: 27.4, sueno: 6.9, vacaciones: 30, feriados: 10, felicidad: 5.2, frecuencia: 70, pornhub: 0, preservativos: 58
	},
	AUT: {
		flag: '🇦🇹', name: 'Austria', group: 'J', govt: 'Democracia', leader: 'Kickl (FPÖ)', autocracy: false,
		economia: 'Estable. PIB $57.000 p/c. Baja inflación.',
		relacion: 'Buenas relaciones diplomáticas. Comunidad austríaca en Argentina.',
		politico: 'El partido ultraderechista FPÖ ganó las elecciones 2024. Kickl fue vetado por varios países antes de asumir.',
		pobreza: 0.2, gini: 27.7, deuda: 81.8, pisa: 487, aprobacion: 38, prensa: 78.12, pib: 67761, gasto: 11.3, mcdonalds: 22, cerveza: 104.6, obesidad: 20.1, sueno: 7.5, vacaciones: 30, feriados: 13, felicidad: 7.07, frecuencia: 97, pornhub: 9.92, preservativos: 66
	},
	JOR: {
		flag: '🇯🇴', name: 'Jordania', group: 'J', govt: 'Monarquía constitucional', leader: 'Rey Abdullah II', autocracy: true,
		economia: 'Economía de servicios y turismo. Alta desocupación juvenil.',
		relacion: 'Neutral. Comunidad árabe significativa en Argentina.',
		politico: 'Frontera con Israel y Gaza. Recibe millones de refugiados sirios. El Rey mantiene equilibrio entre Occidente y mundo árabe.',
		pobreza: 0.1, gini: 33.7, deuda: 90.2, pisa: 381, aprobacion: 0, prensa: 34.0, pib: 5200, gasto: 35, mcdonalds: 0.9, cerveza: 3, obesidad: 35.5, sueno: 6.8, vacaciones: 14, feriados: 14, felicidad: 4.6, frecuencia: 65, pornhub: 0, preservativos: 51
	},
	// GRUPO K
	POR: {
		flag: '🇵🇹', name: 'Portugal', group: 'K', govt: 'Democracia', leader: 'Montenegro (AD)', autocracy: false,
		economia: '$28.000 PIB p/c. Turismo, tecnología y servicios. Destino de emigración argentina.',
		relacion: 'Muy buenas relaciones. Enorme comunidad argentino-portuguesa.',
		politico: 'Montenegro lidera un gobierno de minoría desde 2024. Portugal tiene el pasaporte con más acceso libre del mundo.',
		pobreza: 0.4, gini: 32.6, deuda: 93.6, pisa: 0, aprobacion: 38, prensa: 84.26, pib: 35434, gasto: 17.5, mcdonalds: 17, cerveza: 66.9, obesidad: 22.1, sueno: 7.3, vacaciones: 22, feriados: 13, felicidad: 5.96, frecuencia: 96, pornhub: 9.83, preservativos: 74
	},
	COD: {
		flag: '🇨🇩', name: 'R.D. del Congo', group: 'K', govt: 'Democracia (frágil)', leader: 'Tshisekedi', autocracy: false,
		economia: '$600 PIB p/c. El más bajo del torneo. Riqueza mineral enorme sin inversión social.',
		relacion: 'Neutral. Regresa al Mundial 52 años después (fue Zaire en 1974).',
		politico: 'Tshisekedi fue reelecto en 2023 en comicios cuestionados. Conflicto armado en el este del país (M23). Coltán, cobalto y oro sin desarrollo local.',
		pobreza: 76.6, gini: 42.1, deuda: 16, pisa: 0, aprobacion: 28, prensa: 33, pib: 650, gasto: 55, mcdonalds: 0, cerveza: 20, obesidad: 6.8, sueno: 6.7, vacaciones: 18, feriados: 7, felicidad: 3.9, frecuencia: 85, pornhub: 9.25, preservativos: 28
	},
	UZB: {
		flag: '🇺🇿', name: 'Uzbekistán', group: 'K', govt: 'Autocracia (apertura parcial)', leader: 'Mirziyoyev', autocracy: true,
		economia: '$9.000 PIB p/c. Gas, oro y algodón. Reformas económicas desde 2016.',
		relacion: 'Neutral. Debuta en el Mundial 2026.',
		politico: 'Mirziyoyev sucedió al dictador Karimov en 2016 con un perfil más reformista. Apertura económica parcial pero sin pluralismo político real.',
		pobreza: 2.9, gini: 28.2, deuda: 36, pisa: 0, aprobacion: 0, prensa: 30, pib: 3200, gasto: 50, mcdonalds: 0, cerveza: 12, obesidad: 19.1, sueno: 7.1, vacaciones: 15, feriados: 14, felicidad: 5.8, frecuencia: 80, pornhub: 9.5, preservativos: 68
	},
	COL: {
		flag: '🇨🇴', name: 'Colombia', group: 'K', govt: 'Democracia', leader: 'Petro (izquierda)', autocracy: false,
		economia: '$7.000 PIB p/c. Petróleo, café y flores. Petro quiere dejar los combustibles fósiles.',
		relacion: 'Buenas relaciones. Comunidad colombiana significativa en Argentina.',
		politico: 'Petro es el primer presidente de izquierda en la historia de Colombia. Negoció con el ELN y grupos paramilitares. Polarización alta.',
		pobreza: 4.7, gini: 54.8, deuda: 61.3, pisa: 0, aprobacion: 40, prensa: 52, pib: 8250, gasto: 22, mcdonalds: 1.6, cerveza: 40, obesidad: 20.7, sueno: 7.1, vacaciones: 15, feriados: 18, felicidad: 5.61, frecuencia: 95, pornhub: 9.67, preservativos: 75
	},
	// GRUPO L
	ENG: {
		flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Inglaterra', group: 'L', govt: 'Democracia (UK)', leader: 'Starmer (Labour)', autocracy: false,
		economia: '$48.000 PIB p/c. Servicios financieros y tecnología. Impacto post-Brexit.',
		relacion: 'Relación marcada por Malvinas. Tensión histórica profunda.',
		politico: 'Starmer (Labour) ganó las elecciones jul 2024 con mayoría aplastante. Primer gobierno laborista desde Blair.',
		pobreza: 0.5, gini: 32.4, deuda: 93.6, pisa: 0, aprobacion: 20, prensa: 78.89, pib: 61056, gasto: 10.5, mcdonalds: 19.8, cerveza: 66.3, obesidad: 28.0, sueno: 7.1, vacaciones: 28, feriados: 8, felicidad: 6.73, frecuencia: 108, pornhub: 9.92, preservativos: 75
	},
	CRO: {
		flag: '🇭🇷', name: 'Croacia', group: 'L', govt: 'Democracia', leader: 'Plenković (HDZ)', autocracy: false,
		economia: '$22.000 PIB p/c. Turismo adriático y manufactura.',
		relacion: 'Neutral. Comunidad croata en Argentina (Patagonia).',
		politico: 'Plenković (HDZ) gobierna desde 2016. Croacia ingresó al euro y al espacio Schengen en 2023.',
		pobreza: 0.7, gini: 28.5, deuda: 57.7, pisa: 0, aprobacion: 38, prensa: 64.2, pib: 30030, gasto: 23, mcdonalds: 7.8, cerveza: 95.1, obesidad: 23.3, sueno: 7.3, vacaciones: 20, feriados: 13, felicidad: 5.2, frecuencia: 95, pornhub: 9.75, preservativos: 60
	},
	GHA: {
		flag: '🇬🇭', name: 'Ghana', group: 'L', govt: 'Democracia', leader: 'Mahama (NDC)', autocracy: false,
		economia: '$2.500 PIB p/c. Cacao, oro y petróleo. Default de deuda en 2022.',
		relacion: 'Neutral. Lazos con el mundo panafricanista.',
		politico: 'Mahama volvió al poder en las elecciones dic 2024. Ghana es una de las democracias más estables de África subsahariana.',
		pobreza: 24.1, gini: 43.0, deuda: 70.5, pisa: 0, aprobacion: 45, prensa: 67.13, pib: 2800, gasto: 44, mcdonalds: 0, cerveza: 15, obesidad: 13.6, sueno: 7, vacaciones: 15, feriados: 13, felicidad: 4.9, frecuencia: 73, pornhub: 9.33, preservativos: 35
	},
	PAN: {
		flag: '🇵🇦', name: 'Panamá', group: 'L', govt: 'Democracia', leader: 'Mulino', autocracy: false,
		economia: '$18.000 PIB p/c. Canal de Panamá. Hub logístico y financiero.',
		relacion: 'Neutral. Comunidad argentina en Panamá.',
		politico: 'Mulino ganó las elecciones 2024 con discurso de mano dura. El Canal de Panamá está en el centro de disputas geopolíticas con Trump.',
		pobreza: 3.5, gini: 48.9, deuda: 56.6, pisa: 0, aprobacion: 36, prensa: 66.75, pib: 20564, gasto: 20, mcdonalds: 8, cerveza: 86.1, obesidad: 23, sueno: 7, vacaciones: 30, feriados: 19, felicidad: 6.18, frecuencia: 90, pornhub: 9.67, preservativos: 62
	}
};

export const GROUPS: Record<string, Group> = {
	A: { name: 'Grupo A', countries: ['MEX', 'RSA', 'KOR', 'CZE'] },
	B: { name: 'Grupo B', countries: ['CAN', 'BIH', 'QAT', 'SUI'] },
	C: { name: 'Grupo C', countries: ['BRA', 'MAR', 'HAI', 'SCO'] },
	D: { name: 'Grupo D', countries: ['USA', 'PRY', 'AUS', 'TUR'] },
	E: { name: 'Grupo E', countries: ['GER', 'CUW', 'CIV', 'ECU'] },
	F: { name: 'Grupo F', countries: ['NED', 'JPN', 'SWE', 'TUN'] },
	G: { name: 'Grupo G', countries: ['BEL', 'EGY', 'IRN', 'NZL'] },
	H: { name: 'Grupo H', countries: ['ESP', 'CPV', 'SAU', 'URY'] },
	I: { name: 'Grupo I', countries: ['FRA', 'SEN', 'IRQ', 'NOR'] },
	J: { name: 'Grupo J', countries: ['ARG', 'ALG', 'AUT', 'JOR'] },
	K: { name: 'Grupo K', countries: ['POR', 'COD', 'UZB', 'COL'] },
	L: { name: 'Grupo L', countries: ['ENG', 'CRO', 'GHA', 'PAN'] }
};

export const VARIABLES: { cats: VariableCategory[] } = {
	cats: [
		{
			label: 'Categoría 1 — Política y economía',
			vars: [
				{ id: 'pobreza', label: 'Pobreza extrema %', dir: 'asc', unit: '%', desc: 'menor = mejor', source: 'Banco Mundial — World Development Indicators. Umbral de pobreza extrema internacional: $2.15/día en PPA. Años de referencia varían por país (2020–2022). Catar, Arabia Saudita, Escocia e Inglaterra son estimaciones por falta de datos propios al Banco Mundial.' },
				{ id: 'gini', label: 'Desigualdad (Gini)', dir: 'asc', unit: '', desc: 'menor = mejor', source: 'Banco Mundial — World Development Indicators. Escala 0–100: 0 = igualdad perfecta, 100 = desigualdad absoluta. Años de referencia varían por país (2019–2022). Catar, Arabia Saudita y Curazao son estimaciones sin datos propios al Banco Mundial.' },
				{ id: 'deuda', label: 'Deuda pública % PIB', dir: 'asc', unit: '%', desc: 'menor = mejor', source: 'FMI World Economic Outlook octubre 2025. Deuda bruta del gobierno general como % del PIB. Contexto clave: Japón (230%) financia su deuda con ahorro doméstico japonés — perfil radicalmente distinto a un emergente con 80% en dólares. R.D. del Congo (16%) no puede emitir bonos internacionales.' },
{ id: 'aprobacion', label: 'Aprobación presidencial', dir: 'desc', unit: '%', desc: 'mayor = mejor', source: 'CB Global Data, YouGov, Ipsos, Norstat y encuestas nacionales 2025–2026. Los países con 0% no tienen encuestas independientes verificables (monarquías absolutas, regímenes autoritarios). No comparar entre sistemas presidenciales y parlamentarios sin contexto.' },
				{ id: 'prensa', label: 'Libertad de prensa', dir: 'desc', unit: '/100', desc: 'mayor = mejor', source: 'RSF World Press Freedom Index 2025. Escala 0–100 (100 = máxima libertad). En 2025 más de la mitad de los 180 países cayeron en categoría "difícil" o "muy grave" — el nivel más bajo en 25 años.' },
				{ id: 'pib', label: 'PIB per cápita', dir: 'desc', unit: 'USD', desc: 'mayor = mejor', source: 'FMI World Economic Outlook abril 2026. PIB per cápita nominal en USD corrientes. Promedio mundial: ~$15.223. Irán y Argentina subestimados por devaluación cambiaria — su PIB en PPP es significativamente mayor.' }
			]
		},
		{
			label: 'Categoría 2 — Bienestar',
			vars: [
				{ id: 'gasto', label: 'Gasto en comida (% ingreso)', dir: 'asc', unit: '%', desc: 'menor = mejor (Ley de Engel)', source: 'USDA Economic Research Service 2022–23. % del ingreso del hogar destinado a alimentación. Cuanto menor el porcentaje, mayor la libertad económica real del hogar.' },
				{ id: 'mcdonalds', label: "McDonald's por millón hab.", dir: 'desc', unit: '/M', desc: 'proxy de occidentalización', source: "McDonald's Restaurant Count 2024 (informe anual). Locales por millón de habitantes. 0 = sin presencia del todo (Haití, Irán, Argelia, Costa de Marfil, Senegal, Ghana, R.D. Congo, Uzbekistán, Cabo Verde)." },
				{ id: 'cerveza', label: 'Consumo cerveza (L/año)', dir: 'desc', unit: 'L', desc: 'mayor = mejor (según este bracket)', source: 'Kirin Holdings Global Beer Consumption Report 2024 (publicado dic. 2025). Rep. Checa lidera por 32° año consecutivo. Países islámicos con consumo casi nulo por restricción legal o cultural.' },
				{ id: 'obesidad', label: 'Obesidad adulta %', dir: 'asc', unit: '%', desc: 'menor = mejor', source: 'NCD Risk Factor Collaboration, The Lancet 2024. IMC ≥ 30 en adultos +18, estimación estandarizada 2022. Basado en mediciones físicas reales de 222M participantes. Japón (4.3%) vs EEUU (36.2%).' },
				{ id: 'vacaciones', label: 'Vacaciones legales (días)', dir: 'desc', unit: 'días', desc: 'mayor = mejor', source: 'OIT, Mercer Global Benefits y legislaciones laborales nacionales 2025. Días mínimos de licencia anual pagada por ley. EE.UU. (0) es el único país del mundo desarrollado sin ley federal de vacaciones pagadas.' },
				{ id: 'sueno', label: 'Horas de sueño promedio', dir: 'desc', unit: 'h', desc: 'mayor = mejor (OMS: 7–9h)', source: 'OCDE Time Use Database, Sleep Cycle Global Report 2023, YouGov 2024. El índice con mayor incertidumbre de la serie — muchos valores son estimaciones regionales. Países Bajos (8.1h) vs Japón/Corea (6.3h).' },
				{ id: 'feriados', label: 'Feriados nacionales', dir: 'desc', unit: 'días', desc: 'más descanso = más feliz', source: 'OCDE y Gobiernos nacionales 2025. Días de feriado nacional obligatorio. Irán tiene 27 feriados — el más alto del torneo — combinando celebraciones islámicas, revolucionarias y persas.' },
				{ id: 'felicidad', label: 'Índice de felicidad', dir: 'desc', unit: '/10', desc: 'mayor = mejor', source: 'World Happiness Report 2025 (Univ. Oxford / Gallup / UNSDSN). Escala Cantril Ladder 0–10. Paradoja latinoamericana: México (6.67, puesto 10) supera a Francia (33) y Alemania (22).' }
			]
		},
		{
			label: 'Categoría 3 — Las picantes 🌶',
			vars: [
				{ id: 'frecuencia', label: 'Frecuencia sexual (veces/año)', dir: 'desc', unit: 'x/año', desc: 'mayor = más activo', source: 'Durex Global Sex Survey 2024, Statistico World Sexual Activity Ranking. Brasil (131–145) vs Japón (92). Tendencia global decreciente en todos los países desarrollados desde los años 90.' },
				{ id: 'pornhub', label: 'Pornhub (min/visita)', dir: 'desc', unit: 'min', desc: 'mayor = más paciente', source: 'Pornhub Year in Review 2024–2025. 0 = bloqueado (Arabia Saudita, Irán, Argelia, Jordania, Marruecos, Qatar, Túnez, Irak). Japón lidera en 2025 con 11:02 — mismo país que menos duerme y menos frecuencia sexual.' },
				{ id: 'preservativos', label: 'Anticoncepción (%)', dir: 'desc', unit: '%', desc: 'mayor = mejor acceso', source: 'ONU World Contraceptive Use 2024 + Durex Global Sex Survey 2024. % de mujeres 15–49 años usando algún método anticonceptivo. Irán (77%) sorprende: el régimen implementó planificación familiar estatal muy eficiente.' }
			]
		}
	]
};

export const EDITORIAL: Record<string, Record<string, string>> = {
	deuda: {
		A: 'Sudáfrica (76.9%) es el más endeudado del grupo y su deuda crece sin parar: los intereses ya consumen el 20% del presupuesto. Rep. Checa (44%) y Corea (46.8%) tienen perfiles sólidos.',
		B: 'Canadá sorprende con 111% — el G7 que más creció en deuda en la última década. Suiza (27%) tiene freno constitucional a la deuda. Qatar (41%) es acreedor neto del mundo por su fondo soberano.',
		C: 'Escocia/R.U. (93.6%) y Brasil (87.3%) lideran la deuda del grupo. Haití (27%) no porque sea solvente, sino porque ningún mercado le presta.',
		D: 'EEUU (124%) es el octavo más endeudado del mundo pero emite la moneda de reserva global. Sus intereses superaron por primera vez al presupuesto de defensa en 2024. Turquía (25%) tiene ratio bajo por efecto de la devaluación de la lira.',
		E: 'Alemania (62.2%) flexibilizó su freno constitucional a la deuda en 2025 para financiar defensa e infraestructura — fin de una era de austeridad. Ecuador (50.6%) defaulteó en 2008 y 2020.',
		F: 'Japón (229.6%) tiene el ratio más alto del torneo y del mundo. La paradoja: sus tasas son las más bajas del mundo desarrollado porque el 90% de la deuda la tienen inversores japoneses. Suecia (36%) es la más sólida del grupo.',
		G: 'Bélgica (104%) supera el 100% pese a ser un país rico: es el legado de coaliciones que nunca pudieron ajustar. Egipto (90.9%) destina más del 40% del gasto público a pagar intereses. Irán (30%) es dato de baja fiabilidad.',
		H: 'Arabia Saudita (24%) es la menos endeudada del grupo: los ingresos del petróleo le dan un margen fiscal enorme. Cabo Verde (109%) tiene ratio altísimo para una economía insular dependiente del turismo.',
		I: 'Senegal (118.4%) es la sorpresa: el nuevo gobierno de Faye descubrió "deuda oculta" al asumir en 2024. Francia (116.5%) tiene procedimiento de déficit excesivo abierto por la UE. Noruega (42.7%) tiene fondo soberano de $1,7 billones.',
		J: 'Argentina (83.2%) tiene el historial más dramático: 23 programas con el FMI. El dato actual es post-ajuste Milei. Jordania (90.2%) depende de ayuda externa para sostenerse. Argelia (46.2%) se sostiene con petróleo.',
		K: 'R.D. del Congo (16%) no puede emitir bonos internacionales — es exclusión del sistema financiero, no solvencia. Colombia (61.3%) está en el límite del umbral de Maastricht. Portugal (93.6%) bajó desde el 130% de la crisis 2011.',
		L: 'Ghana (70.5%) entró en default en 2022 y reestructuró en 2023–24. Croacia (57.7%) mejoró su perfil al ingresar a la eurozona en 2023. R.U./Inglaterra (93.6%) superó el 90% post-pandemia.'
	},
	pobreza: {
		A: 'Sudáfrica (18.9%) es el más pobre del grupo en pobreza extrema. Corea del Sur (0.2%) y Rep. Checa (0.5%) están casi en cero. El dato mide el umbral $2.15/día del Banco Mundial.',
		B: 'Suiza (0.1%) lidera. Qatar (0.5%) tiene pobreza extrema baja entre sus ciudadanos, pero el dato excluye a los 2 millones de migrantes que construyeron sus estadios.',
		C: 'Haití (49%) es el país más pobre del torneo. Casi la mitad de su población no llega a $2.15 por día. Brasil (4.6%) y Escocia (1%) en el otro extremo.',
		D: 'Australia (0.3%) y Turquía (0.5%) tienen cifras mínimas. EEUU (0.6%) sorprende: baja en pobreza extrema pero con profunda desigualdad interna que esta métrica no captura.',
		E: 'Costa de Marfil (20.1%) es el gran outlier del grupo. Alemania (0.1%) está al otro extremo. Curazao (~2%) es estimación por falta de datos oficiales al Banco Mundial.',
		F: 'Países Bajos (0.1%) y Suecia (0.2%) en el piso del torneo. Túnez (0.2%) sorprende con un dato muy bajo para la región a pesar de su crisis fiscal.',
		G: 'Bélgica (0.1%) y Nueva Zelanda (0.2%) casi en cero. Egipto (3.8%) concentra su pobreza en el Alto Egipto. Irán (0.6%) está posiblemente subestimado por la inflación acumulada.',
		H: 'Uruguay (0.1%) es el mejor de América Latina en esta métrica. Cabo Verde (13%) es el más pobre del grupo. Arabia Saudita (~1%) no publica datos al Banco Mundial.',
		I: 'Noruega y Francia (0.1–0.2%) casi sin pobreza extrema. Senegal (33.5%) es el segundo más pobre del torneo, a pesar de una década de crecimiento económico.',
		J: 'Jordania (0.1%) sorprende como el mejor del grupo. Argentina (1.5%) está lejos del 40% que muestran métricas nacionales — la diferencia es el umbral elegido.',
		K: 'R.D. del Congo (76.6%) tiene el dato más alto del torneo. 8 de cada 10 congoleses viven con menos de $2.15 al día, pese a las mayores reservas de coltán y cobalto del mundo.',
		L: 'Ghana (24.1%) es el más pobre del grupo. Inglaterra y Croacia tienen cifras mínimas. Panamá (3.5%) combina alto crecimiento con desigualdad que deja sectores rurales excluidos.'
	},
	gini: {
		A: 'Sudáfrica (63.0) es el país más desigual del torneo — y uno de los más desiguales del mundo. Rep. Checa (26.2) es el más igualitario del grupo, herencia del modelo centroeuropeo.',
		B: 'Bosnia (28.9) es el más igualitario del grupo, pese a sus problemas estructurales. Qatar (41.0) subestima la desigualdad real: excluye a los 2M de migrantes que son el 85% de su fuerza laboral.',
		C: 'Brasil (52.0) subió: es el segundo más desigual del torneo. Haití (41.1) tiene dato de 2012 — el más desactualizado del torneo. La desigualdad real es probablemente mayor.',
		D: 'EEUU (39.4) tiene el Gini más alto entre los países de ingresos altos del torneo. Es una anomalía del mundo desarrollado. Paraguay (45.1) combina Gini alto con estructura latifundista.',
		E: 'Ecuador (45.0) lidera el grupo en desigualdad, con brecha profunda entre costa, sierra y pueblos indígenas. Alemania (31.7) es la más igualitaria del grupo.',
		F: 'Suecia (27.6) tiene uno de los Gini más bajos del torneo. Japón (32.9) parece moderado pero la desigualdad creció sostenidamente desde los años 90 con el empleo precario.',
		G: 'Bélgica (25.0) tiene el Gini más bajo del torneo junto con los nórdicos. Irán (40.9) muestra una tendencia de aumento de desigualdad correlacionada con el impacto de las sanciones.',
		H: 'Uruguay (40.6) es el más bajo de América Latina en este torneo, pero sigue siendo alto vs. Europa. Panamá del grupo L (48.9) supera a todos en desigualdad regional.',
		I: 'Noruega (25.9) es el segundo Gini más bajo del torneo. Irak (29.5) sorprende con un dato bajo: refleja que casi todos están en el mismo estrato bajo, no que haya distribución equitativa.',
		J: 'Argelia (27.6) y Austria (27.7) casi empatan como los más igualitarios del grupo. Argentina (40.7) queda última, con desigualdad alta para su nivel histórico de desarrollo.',
		K: 'Colombia (54.8) es el segundo Gini más alto del torneo, solo detrás de Sudáfrica. El 1% de propiedades concentra más del 80% de la tierra productiva. Portugal (32.6) lidera el grupo.',
		L: 'Panamá (48.9) tiene el Gini más alto de Centroamérica. El Canal genera riqueza que no se distribuye. Croacia (28.5) es el más igualitario, herencia del modelo yugoslavo.'
	},
	pisa: {
		A: 'Corea del Sur (527) domina con el mejor puntaje del torneo. Sudáfrica (288) tiene el peor resultado educativo de los 48 países clasificados.',
		B: 'Canadá (519) lidera. Qatar (414) invierte enormes recursos en educación pero aún no se refleja en resultados PISA.',
		C: 'Escocia (504) domina el grupo con facilidad. Brasil (359) y Marruecos (367) tienen sistemas educativos en crisis. Haití (320) tiene el peor puntaje del torneo.',
		J: 'Austria (487) vs Argentina (401): 86 puntos de diferencia. Argelia nunca participó de PISA — el dato es una estimación basada en evaluaciones regionales.'
	},
	aprobacion: {
		A: 'Sheinbaum (68%) es la líder con mayor aprobación real del torneo. CZE lidera el grupo con Pavel (55%). Corea del Sur (~42%) en recuperación post-crisis constitucional. 0% = sin encuesta independiente.',
		B: 'Qatar y Marruecos tienen 0%: monarquías sin encuestas independientes. Suiza (52%) refleja la confianza institucional del Consejo Federal. Bosnia (~30%) con la presidencia más disfuncional de Europa.',
		C: 'Haití (~15%) es el dato más bajo del torneo entre países con estimación. Marruecos y su monarquía sin dato verificable (0%). Lula (49%) en paridad frágil.',
		D: 'Trump (39%) en su mínimo histórico en junio 2026, impulsado por el impacto arancelario. Turquía (~48%) estimado con encuestadoras independientes limitadas. Australia (40%) en desgaste.',
		E: 'Merz (26%) es el líder europeo más impopular del torneo: su net approval cayó 34 puntos en pocos meses de gobierno. Ecuador (43%) y Costa de Marfil (~45%) relativamente estables.',
		F: 'Grupo de líderes europeos impopulares: Países Bajos (34%), Suecia (34%) y Japón (38%) todos por debajo del 40%. Túnez (~40%) con dato poco confiable por restricción a encuestadoras.',
		G: 'Egipto (0%) tiene tercera reelección oficial con 89.6% — no es aprobación real, es dato imposible de verificar. Irán (~28%) con baja participación electoral reflejando desconfianza estructural.',
		H: 'Arabia Saudita (0%): monarquía absoluta sin dato. Cabo Verde (~52%) es el más alto del grupo. Sánchez (36%) lidera entre los con dato real — el único líder de la UE que subió en 2026.',
		I: 'Macron (19%) es el líder más impopular del torneo con dato real. Noruega (31%) también baja. Senegal (~54%) con luna de miel extendida de Faye tras años de represión política.',
		J: 'Milei (35%) en su mínimo histórico. Argelia, Qatar y Jordania con 0% — regímenes sin encuestas independientes. Austria (38%) con Kickl polarizando: alta aprobación en su base, alto rechazo transversal.',
		K: 'Uzbekistán (0%): reelecto con 87% oficial — no verificable. Colombia (40%) con Petro en mayoría de desaprobación (56%). R.D. del Congo (~28%) con elecciones cuestionadas.',
		L: 'Starmer (20%) es el segundo más impopular del torneo con dato real, apenas por encima de Macron. Ganó con mayoría histórica en 2024 y en menos de dos años es uno de los más impopulares de Europa.'
	},
	prensa: {
		A: 'Rep. Checa (83.96) lidera el grupo. México (47.0) es el país más peligroso para periodistas fuera de zonas de guerra: decenas de asesinados con impunidad total vinculada al crimen organizado.',
		B: 'Suiza (83.98) en el top 10 mundial. Qatar (60.0) es la excepción absoluta del MENA: el único del Oriente Medio que no está en "difícil" o "muy grave". Bosnia (56.33) tiene prensa fragmentada por líneas étnicas.',
		C: 'Escocia/R.U. (78.89) lidera. Haití (49.0) cayó 18 posiciones en 2025: el colapso del Estado hace inviable el periodismo en muchas zonas. Marruecos (43.0) usa leyes antiterrorismo para silenciar críticas.',
		D: 'Australia (75.15) lidera. EEUU (65.49) bajó por hostilidad presidencial y presiones legales contra medios. Turquía (33.0) tiene más periodistas encarcelados que casi cualquier otro país del mundo.',
		E: 'Alemania (83.85) en el top 11 mundial. Ecuador (53.0) deterioró su situación por el narco y el crimen organizado. Curazao (67.0) estimado por falta de datos propios en RSF.',
		F: 'Países Bajos (88.64) y Suecia (88.13) son el 3° y 4° en el mundo. Túnez (45.0) cayó 11 posiciones por la deriva autoritaria de Saied. Japón (63.14) con kisha clubs y autocensura estructural.',
		G: 'El contraste más extremo del torneo: Bélgica (80.12) y Nueva Zelanda (81.37) en el top 20, frente a Egipto (27.0) e Irán (17.0), dos de los mayores encarceladores de periodistas del mundo.',
		H: 'Cabo Verde (74.98) es el país africano mejor posicionado del torneo — top 30 mundial, por encima de España (77.35). Arabia Saudita (22.0) ejecutó al periodista Turki al-Jasser en 2026.',
		I: 'Noruega (92.31) es el número 1 del mundo. Comparte grupo con Irak (28.0), donde las milicias y el conflicto hacen el periodismo extremadamente peligroso. Una diferencia de 64 puntos.',
		J: 'Austria (78.12) lidera. Argentina (55.0) en situación "problemática": Milei recortó pauta oficial y agredió retóricamente a medios, pero sin periodistas encarcelados. Argelia (28.0) y Jordania (34.0) en "muy grave".',
		K: 'Portugal (84.26) en el top 10 mundial. Uzbekistán (30.0) y R.D. del Congo (33.0) mantienen control estatal heredado. Colombia (52.0) es una de las situaciones más peligrosas de América Latina.',
		L: 'R.U./Inglaterra (78.89) lidera. Ghana (67.13) es el segundo africano mejor posicionado del torneo. Croacia (64.20) tiene prensa libre pero con concentración de medios afines al poder político.'
	},
	pib: {
		A: 'Rep. Checa ($39.795) y Corea ($37.412) están en el cuartil superior mundial. Sudáfrica ($7.500) queda por debajo del promedio global a pesar de ser la mayor economía de África subsahariana.',
		B: 'Suiza ($126.177) es el 6° país más rico del mundo. La brecha dentro del grupo: Bosnia ($9.500) vs Suiza es de más de $116.000 por persona.',
		C: 'La mayor dispersión del torneo: Escocia/R.U. ($61.056) vs Haití ($1.700) — una diferencia de $59.000 por persona dentro del mismo grupo.',
		D: 'EEUU ($94.430) y Australia ($75.648) en el top 20 mundial. Paraguay ($7.000) queda muy por debajo del promedio. Turquía ($19.018) sufre la devaluación de la lira.',
		E: 'Alemania ($65.303) entre los 25 más ricos del mundo. Costa de Marfil ($2.700) es el más pobre del grupo — el mayor productor de cacao del mundo con uno de los PIB más bajos.',
		F: 'Países Bajos ($79.918) y Suecia ($70.676) en el top 20 mundial. Túnez ($4.100) queda muy por debajo del promedio. Japón ($35.703) penalizado por el debilitamiento del yen.',
		G: 'Bélgica ($65.112) y Nueva Zelanda ($52.023) en el cuartil superior. Irán ($5.800) subestimado por el colapso del rial: su PIB en PPP es ~$20.000.',
		H: 'España ($41.563) lidera el grupo. Uruguay ($27.608) es el segundo más rico de América del Sur. Cabo Verde ($4.600) queda muy por debajo del promedio mundial.',
		I: 'La mayor brecha absoluta del torneo: Noruega ($105.877) vs Senegal ($1.900) — más de $104.000 de diferencia por persona en el mismo grupo.',
		J: 'Austria ($67.761) entre los 25 más ricos del mundo. Argentina ($14.360) fluctúa mucho con el tipo de cambio; su PIB en PPP (~$31.310) da una imagen más real del poder adquisitivo.',
		K: 'R.D. del Congo ($650) tiene el PIB per cápita más bajo del torneo — entre los 5 más pobres del mundo — pese a tener las mayores reservas de coltán y cobalto del planeta.',
		L: 'Croacia ($30.030) superó los $30.000 por primera vez — uno de los casos de convergencia más notables de Europa del Este. Ghana ($2.800) debajo del promedio mundial a pesar del boom de crecimiento africano.'
	},
	gasto: {
		A: 'Corea del Sur (13%) lidera el grupo: ingresos altos, comida proporcionalmente barata. México (23.3%) está en el promedio de la región, pero sus hogares más pobres destinan hasta el 60% a alimentos.',
		B: 'Suiza (8.7%) tiene el segundo valor más bajo del torneo. Bosnia (31%) es el dato más alto de Europa: salarios bajos con precios de alimentos que se acercan a Europa occidental.',
		C: 'Haití (~55%) es uno de los más altos del torneo: más de la mitad del ingreso va a comida. Escocia (10.5%) en el extremo opuesto dentro del mismo grupo. Una diferencia de 44 puntos.',
		D: 'Australia (10.5%) lidera el grupo. EEUU (12.9%) subió por inflación arancelaria pero sigue bajo. Turquía (24.5%) sufre el impacto de años de inflación alimentaria sostenida.',
		E: 'Costa de Marfil (40%) tiene alta exposición a shocks de precios internacionales: muchos alimentos importados fijados en dólares. Alemania (12.2%) tiene los supermercados más competitivos de Europa (Aldi, Lidl).',
		F: 'Países Bajos (12%) y Suecia (12.8%) en el cuartil bajo. Japón (16.8%) es alto para su nivel de ingresos: la comida es cara y la cultura de comer bien eleva el gasto. Túnez (34%) bajo presión con subsidios al límite.',
		G: 'Nueva Zelanda (11%) lidera. Egipto (38.5%) destina casi 40% a comida — sin el subsidio al pan estatal, sería aún más alto. Irán (~35%) con inflación alimentaria extrema por sanciones.',
		H: 'España (15.4%) aprovecha su producción agrícola propia. Arabia Saudita (20%) con subsidios que comprimen el dato. Cabo Verde (28%) con alta dependencia de importaciones insulares.',
		I: 'Noruega (12.4%) con alimentos carísimos en términos absolutos pero bajos en porcentaje del ingreso. Senegal (45%) con vulnerabilidad alimentaria estructural — uno de los más altos del torneo.',
		J: 'Austria (11.3%) con mercado alimentario competitivo. Argentina (26%) en tendencia ascendente: la inflación elevó el porcentaje significativamente en quintiles bajos. Argelia (38%) y Jordania (35%) muy altos.',
		K: 'R.D. del Congo (~55%) y Uzbekistán (50%) están entre los más altos del torneo: la Ley de Engel en su expresión más cruda. Portugal (17.5%) en la norma mediterránea.',
		L: 'Ghana (44%) es uno de los más altos del torneo. Inglaterra (10.5%) entre los más bajos. Croacia (23%) es alto para la UE: salarios bajos con precios convergiendo hacia Europa occidental post-euro.'
	},
	mcdonalds: {
		A: 'Rep. Checa (10.5/M) lidera el grupo y supera a México (3.8). La densidad checa es coherente con su integración total al modelo de consumo europeo occidental.',
		B: 'Canadá (38/M) es top 5 mundial per cápita. Suiza (19/M) tiene los McDonald\'s más caros del mundo: un Big Mac cuesta ~CHF 7. Bosnia (4.5/M) con penetración limitada.',
		C: 'Haití (0) no tiene ningún local: colapso infraestructural e inestabilidad lo hacen inviable. Escocia/R.U. (19.8/M) vs Marruecos (0.7/M) — que apenas abrió sus primeros locales en 2024.',
		D: 'EEUU (40.2/M) es el mercado madre: un McDonald\'s por cada 25.000 habitantes. Australia (38/M) lo iguala en densidad. Paraguay (1.7/M) solo en Asunción y Ciudad del Este.',
		E: 'Costa de Marfil (0) no tiene presencia: infraestructura y poder adquisitivo insuficientes. Curazao (18.5/M) tiene densidad sorprendentemente alta para 160.000 habitantes — turismo y servicios.',
		F: 'Japón (24/M) es el 2° mayor mercado del mundo por locales totales. Adaptó menú agresivamente. Túnez (1.7/M) con presencia muy limitada. Países Bajos (14.3/M) en línea europea.',
		G: 'Irán (0) desde 1979: la revolución islámica cerró todos los locales. Existe un "Mash Donald\'s" iraní sin relación oficial. Nueva Zelanda (32.5/M) comparable a Australia.',
		H: 'Cabo Verde (0) sin viabilidad para la franquicia. Arabia Saudita (7/M) con menú halal adaptado: sin cerdo, cierre en horarios de rezo. España (11.8/M) con sólida presencia.',
		I: 'Francia (23/M) es el 3° mayor mercado del mundo — hay McDonald\'s en la Torre Eiffel. Irak (0.2/M) abrió recién en 2023. Senegal (0) sin presencia. Noruega (13.5/M) con Big Mac a $8 USD.',
		J: 'Argelia (0) no autorizó la franquicia a diferencia de Marruecos o Túnez. Austria (22/M) con alta densidad europea. Argentina (5.5/M) tiene presencia histórica desde 1986 — fue el primer país de Latinoamérica.',
		K: 'R.D. del Congo (0) y Uzbekistán (0) sin presencia. Colombia (1.6/M) sorprende por ser bajo para 50 millones de personas: la gastronomía local compite con fuerza real. Portugal (17/M) consolidado.',
		L: 'Ghana (0) nunca tuvo McDonald\'s: la cadena no se instaló en África Occidental fuera de Sudáfrica. Inglaterra (19.8/M) mercado maduro. Panamá (8/M) concentrado en la capital como hub comercial.'
	},
	cerveza: {
		A: 'Rep. Checa (148.8L) lidera el torneo por 32° año consecutivo: la cerveza es más barata que el agua en Praga. México (83.4L) es el 12° del mundo y el 4° mercado en volumen total.',
		B: 'Bosnia (71.4L) sorprende en puesto 20 mundial: los serbios y croatas del país compensan la abstinencia de los bosniacos musulmanes. Qatar (0.5L) con consumo casi nulo por restricción islámica.',
		C: 'Escocia/R.U. (66.3L) lidera. Brasil (70.3L) es el 3° mercado mundial en volumen total. Haití (10L) con Prestige como cerveza nacional. Marruecos (3L) con consumo en ciudades turísticas.',
		D: 'EEUU (65.4L) y Australia (65L) casi idénticos — ambos en tendencia decreciente. Turquía (15L) laico pero con cultura gastronómica local que compite. Paraguay (35L) con Pilsen dominante.',
		E: 'Alemania (86.9L) en puesto 10 mundial — el Oktoberfest sigue siendo el festival más grande del planeta. Costa de Marfil (22L) con mercado de cerveza real contra lo que se esperaría.',
		F: 'Países Bajos (66.2L) exporta Heineken al mundo pero consume menos de lo esperado. Japón (33.7L) compite con sake, shochu y whisky japonés. Túnez (4.5L) con Celtia centenaria.',
		G: 'Bélgica (57.4L) con la cultura cervecera más sofisticada del mundo: más de 300 cervecerías para 11M de habitantes. Irán (0.3L) con prohibición total desde 1979.',
		H: 'España (91.8L) en puesto 7 mundial — la caña desplazó al vino en el sur del país. Arabia Saudita (0.2L) con prohibición legal total. Uruguay (50L) con consumo consolidado.',
		I: 'Noruega (55.8L) — una cerveza en Oslo puede costar $15–20 USD pero igual toman. Francia (32L) es bajo para Europa: el vino domina históricamente. Irak (1L) con consumo en minorías.',
		J: 'Austria (104.6L) es el 3° mayor consumidor per cápita del mundo — muchos argentinos no lo saben. Argentina (38L) con boom artesanal creciente pero aún moderado vs. Europa.',
		K: 'Portugal (66.9L) en puesto 23 mundial. R.D. del Congo (20L) sorprende: la Primus tiene 100 años de historia nacional. Colombia (40L) con cadenas domésticas fuertes.',
		L: 'Croacia (95.1L) es la gran sorpresa: 5° del mundo, por encima de Alemania e Inglaterra. Panamá (86.1L) en puesto 11 mundial — el clima tropical y la cultura de bar lo explican. Ghana (15L) con Star y Club.'
	},
	obesidad: {
		A: 'México (28.9%) y Sudáfrica (28.3%) casi empatan como los más obesos del grupo. Corea del Sur (6.3%) con la dieta tradicional y presión social: es el 2° menos obeso del torneo.',
		B: 'Qatar (35.1%) con clima que desincentiva toda actividad física, cultura del auto y dieta hipercalórica. Suiza (19.5%) la más saludable del grupo. Canadá (29.4%) con el mismo modelo de consumo que EEUU.',
		C: 'Haití (8.5%) baja por razones trágicas: es desnutrición, no salud. Escocia (28%) con los peores indicadores de salud del R.U. — las "Mars bars fritas" son un símbolo tristemente real.',
		D: 'EEUU (36.2%) es el más obeso del torneo: 1 de cada 3 adultos. Turquía (32.1%) sorprende — la urbanización acelerada y el abandono de la gastronomía tradicional lo explican.',
		E: 'Costa de Marfil (10.6%) con dieta tradicional y actividad física en el trabajo agrícola. Alemania (22.3%) más sano de lo esperado pese al Oktoberfest. Curazao (~28%) con modelo caribeño.',
		F: 'Japón (4.3%) es el menos obeso del torneo: dieta tradicional, porciones pequeñas, caminata diaria y hasta una ley anti-obesidad (Metabo Law). Túnez (27.3%) con transición nutricional acelerada.',
		G: 'Egipto (32%) tiene la segunda tasa más alta del torneo entre los grandes: pan blanco, azúcar y sedentarismo urbano. Nueva Zelanda (30.8%) con alto consumo de ultraprocesados. Bélgica (22.1%) sorprende bien.',
		H: 'Arabia Saudita (35.4%) en el podio de los más obesos: sedentarismo total, clima de 45°C y dieta hipercalórica. España (23.8%) alta para un país con tradición mediterránea.',
		I: 'Irak (30.4%) con décadas de sanciones y guerra que desestructuraron la dieta tradicional. Francia (21.6%) con la "paradoja francesa": mucho queso y manteca pero porciones moderadas.',
		J: 'Jordania (35.5%) es el 2° más obeso del torneo. Argentina (28.3%) entre las más altas de América Latina: el asado y las facturas tienen su costo. Austria (20.1%) la más sana del grupo.',
		K: 'R.D. del Congo (6.8%) bajo por pobreza extrema y desnutrición — la misma paradoja que Haití. Colombia (20.7%) moderada. Uzbekistán (19.1%) con herencia soviética de dieta más equilibrada.',
		L: 'R.U./Inglaterra (28%) con la tasa más alta de Europa Occidental: ultraprocesados baratos y cultura del frito. Croacia (23.3%) bien para sus niveles de cerveza. Ghana (13.6%) moderada y creciente.'
	},
	vacaciones: {
		A: 'Sudáfrica (21 días) lidera el grupo en protección legal. México (12 días) reformó su ley en 2023 duplicando el mínimo — pero sigue siendo bajo. Corea del Sur (15 días) tiene cultura de no tomárselas.',
		B: 'Qatar (30 días) lidera, aunque aplica principalmente a trabajadores formales — los migrantes tienen protecciones más débiles. Canadá (10 días) tiene el mínimo federal más bajo de los países ricos del torneo.',
		C: 'Brasil (30 días) empatado con los más generosos del mundo y con abono vacacional adicional del 33% del salario. R.U./Escocia (28 días) incluye feriados en ese cómputo, lo que lo hace menos generoso de lo que parece.',
		D: 'EEUU (0 días) es el único país del torneo — y prácticamente del mundo desarrollado — sin ley federal de vacaciones pagadas. El 25% de los trabajadores no recibe ningún día pagado.',
		E: 'Costa de Marfil (26 días) sorprende: uno de los más altos de África. Alemania (20 días legales) llega a 28–30 en la práctica por convenios colectivos. Los alemanes sí se toman todas sus vacaciones.',
		F: 'Suecia (25 días) con cultura donde tomarse todas las vacaciones es norma social. Japón (10 días legales) usa en promedio solo 5 por presión cultural del karoshi — el gobierno tiene campañas para que los usen.',
		G: 'Irán (26 días) es el más generoso del grupo. Bélgica (20 días) además paga el doble del salario durante las vacaciones — uno de los sistemas más costosos para empleadores de Europa.',
		H: 'España (30 días) empatada con los más generosos del mundo, más 14 feriados: siesta y descanso con base legal. Arabia Saudita (21 días) y Uruguay (20 días) en el rango moderado-alto.',
		I: 'Francia (30 días) efectivamente usados — los franceses son conocidos por no responder emails en agosto. Senegal (24 días) herencia del código laboral francés colonial que se mantuvo post-independencia.',
		J: 'Austria (30 días) y Argelia (30 días) empatados como los más generosos del grupo. Argentina (14 días para empleados con menos de 5 años) tiene un sistema escalonado que llega a 35 días con más de 20 años.',
		K: 'Colombia (15 días) tiene el menor de los países latinoamericanos del torneo pero compensa con 18 feriados nacionales. Portugal (22 días) llega a 25 en la práctica por convenios.',
		L: 'Panamá (30 días) más 19 feriados = 49 días libres mínimos al año, el total más alto del torneo. R.U./Inglaterra (28 días) incluye los feriados en ese cómputo.'
	},
	sueno: {
		A: 'Rep. Checa (7.5h) lidera el grupo. Corea del Sur (6.3h) está entre los que menos duermen del mundo: hagwon hasta las 11pm, desplazamientos largos y cultura laboral extrema. El pal-bun-jam (microcabezadas en el metro) es parte del paisaje cotidiano.',
		B: 'Suiza (7.6h) lidera. Qatar (6.8h) tiene un patrón peculiar: vida nocturna árabe desplaza el sueño, pero las siestas del mediodía (qailulah) compensan parcialmente.',
		C: 'Escocia (7.1h) lidera el grupo. Haití (~6.5h) tiene sueño corto por razones de inseguridad y precariedad material — el estrés crónico es el factor documentado. Marruecos (6.8h) con efecto del Ramadán en el promedio anual.',
		D: 'Australia (7.9h) está consistentemente entre los que más duermen del mundo — top 3 global. EEUU (6.9h) debajo del mínimo recomendado: el 35% de adultos duerme menos de 7h regularmente.',
		E: 'Alemania (7.5h) lidera: el 65% duerme 7+ horas por noche. La cultura de separar trabajo y descanso contribuye. Costa de Marfil (6.8h) en el rango bajo africano.',
		F: 'La mayor brecha del torneo: Países Bajos (8.1h, el que más duerme del torneo) vs Japón (6.3h, el que menos duerme). Casi dos horas de diferencia. Japón tiene gobierno que lanzó campañas oficiales para que la gente duerma más.',
		G: 'Nueva Zelanda (7.9h) emparejada con Australia. Bélgica (7.5h) bien posicionada. Egipto (6.7h) con calor extremo, ruido urbano de El Cairo y horarios tardíos de vida social.',
		H: 'Uruguay (7.3h) lidera el grupo. España (7.2h) con sueño nocturno más corto que Europa por cenas tardías — la siesta compensa, aunque está en declive urbano. Arabia Saudita (6.8h) con cultura nocturna árabe.',
		I: 'Noruega (7.6h) lidera. Francia (7.4h) con el 62% durmiendo 7+ horas — tercero de Europa. El almuerzo largo y las vacaciones efectivas contribuyen. Irak (6.8h) con inestabilidad que afecta el descanso.',
		J: 'Austria (7.5h) lidera. Argentina (7.0h) con uno de los horarios de inicio del sueño más tardíos del mundo: cenar a las 22h comprime el sueño antes del horario laboral. Jordania y Argelia (~6.8–6.9h) en el rango MENA.',
		K: 'Portugal (7.3h) lidera. Colombia y Uzbekistán (7.1h cada uno) en el rango normal. R.D. del Congo (6.7h) con condiciones de vida que afectan la calidad del descanso.',
		L: 'Croacia (7.3h) lidera el grupo. R.U./Inglaterra (7.1h) con solo el 48% durmiendo 7+ horas — el porcentaje más bajo de Europa Occidental. Ghana y Panamá (~7.0h) en el promedio global.'
	},
	feriados: {
		A: 'Corea del Sur (16 feriados) lidera el grupo. México (7) tiene el mínimo de los países latinoamericanos del torneo. Rep. Checa (13) bien posicionada en el estándar europeo.',
		B: 'Qatar (10 feriados). Canadá (~10) y Suiza (~12) en rangos moderados. Bosnia solo 7 — uno de los más bajos de Europa.',
		C: 'Haití (14) y Marruecos (14) empatan como los más festivos del grupo. Brasil (13 feriados) y Escocia/R.U. (9) en el fondo.',
		D: 'EEUU (0 feriados federales obligatorios). Turquía (14) lidera. Australia (8) y Paraguay (11) en el medio.',
		E: 'Costa de Marfil (14 feriados) lidera. Alemania (~11) en el estándar europeo. Ecuador (12) y Curazao (13).',
		F: 'Japón (16 feriados) lidera el grupo — uno de los países con más feriados del mundo desarrollado. Túnez (8) el menos festivo.',
		G: 'Irán (27 feriados) es el más alto del torneo: celebraciones islámicas, revolucionarias y persas combinadas. Egipto (15) y Nueva Zelanda (12).',
		H: 'España (14 feriados) lidera. Colombia del grupo K tiene 18 — el mayor de América Latina. Arabia Saudita (12) y Cabo Verde (12) en el medio.',
		I: 'Irak (15 feriados) lidera el grupo. Francia (11) y Noruega (12) en el estándar europeo. Senegal (14) con herencia franco-africana.',
		J: 'Argentina (15 feriados) lidera el grupo. Jordania (14) en el contexto islámico. Austria (13) y Argelia (10).',
		K: 'Colombia (18 feriados) es el mayor de América Latina y uno de los más altos del torneo. Portugal (13). R.D. del Congo (7) el más bajo del grupo.',
		L: 'Panamá (19 feriados) es el más festivo del torneo junto con Irán. Ghana (13) y Croacia (13) en el estándar. R.U./Inglaterra (8) el más bajo del grupo.'
	},
	felicidad: {
		A: 'México (6.67, puesto 10 mundial) es la gran sorpresa: la "paradoja latinoamericana de la felicidad". Corea del Sur (5.95) baja para su nivel de desarrollo: estrés académico, presión laboral y tasas de suicidio documentadas.',
		B: 'Suiza (7.06) en el top 15 mundial. Qatar (6.35) alto para la región del Golfo — aunque la encuesta no representa a los trabajadores migrantes que son el 85% de su fuerza laboral. Bosnia (5.72) en el promedio.',
		C: 'Haití (3.30) entre los más infelices del mundo. Escocia/R.U. (6.73) sorprendentemente alta para sus indicadores de salud. Brasil (6.03) por encima del promedio global pese a desigualdad y violencia.',
		D: 'Australia (7.10) top 11 mundial. EEUU (6.72) notablemente bajo para la economía más poderosa del mundo: desigualdad, polarización y ausencia de red de seguridad social universal. Turquía (4.60) en crisis.',
		E: 'Alemania (6.75) top 22 — pero bajó posiciones por crisis energética y polarización. Costa de Marfil (5.00) por debajo del promedio global. Ecuador (5.36) en el promedio.',
		F: 'Suecia (7.35) y Países Bajos (7.30) en el top 5 mundial. Japón (5.91) notablemente bajo para la 4° economía del mundo: soledad estructural, represión emocional y presión laboral. Túnez (4.85) en declive.',
		G: 'Bélgica (6.93) y Nueva Zelanda (7.10) en el top 15. Egipto (4.30) e Irán (4.65) entre los más bajos del torneo: restricciones a libertad personal y dificultades económicas pesan mucho.',
		H: 'Uruguay (6.57) top 30 mundial — el segundo score más alto de América Latina después de México. Arabia Saudita (6.13) sorprende positivamente. España (6.49) por debajo de lo esperable por cicatrices de la crisis 2008.',
		I: 'Noruega (7.26) top 7 mundial. Francia (6.37) consistentemente baja para un país rico: el pessimisme français es un fenómeno culturalmente documentado. Irak (4.60) e Senegal (4.90) en el fondo.',
		J: 'Austria (7.07) top 17 mundial. Argentina (6.12) relativamente alta para su situación económica — otra paradoja latinoamericana. Jordania (4.60) y Argelia (5.20) en el rango bajo-medio.',
		K: 'R.D. del Congo (3.90) cerca del fondo del ranking global — consistente con todos los demás indicadores. Uzbekistán (5.80) moderado positivo para Asia Central. Colombia (5.61) con resiliencia emocional.',
		L: 'R.U./Inglaterra (6.73) y Panamá (6.18) sólidos. Croacia (5.20) baja para la UE: emigración masiva de jóvenes y desconfianza institucional. Ghana (4.90) en el rango africano bajo.'
	},
	frecuencia: {
		A: 'México (115/año) top 10 mundial. Rep. Checa (114) también en top 10. Corea del Sur (91) coherente con todos sus demás índices: poco sueño, mucho trabajo, poca felicidad y poca frecuencia sexual.',
		B: 'Suiza (116) top 6 mundial — el bienestar económico y las vacaciones largas tienen correlación directa. Qatar (~60) el dato más incierto del torneo: las relaciones fuera del matrimonio son ilegales.',
		C: 'Brasil (138) es consistentemente el 1° o 2° del mundo en todas las fuentes. La cultura del cuerpo y el carnaval son factores estructurales. Marruecos (~70) con dato de baja confiabilidad.',
		D: 'Australia (111) y EEUU (110) comparables, pero ambos en tendencia decreciente sostenida desde los 90. Turquía (~82) posiblemente subrepresentado por contexto conservador en las encuestas.',
		E: 'Alemania (107) con encuestas más precisas que otros países por menor sesgo de deseabilidad social. Costa de Marfil (~85) y Ecuador/Curazao (~90–95) en el rango regional.',
		F: 'Japón (92) con el fenómeno sekkusu shinai shokogun (síndrome del celibato): el 45% de jóvenes japoneses 16–24 sin interés en sexo o relaciones. El gobierno lo considera crisis demográfica de primer orden.',
		G: 'Bélgica (98) exactamente en el promedio global. Nueva Zelanda (~100) en el estándar anglosajón. Egipto (~80) e Irán (~75) con datos de muy baja confiabilidad por contexto legal restrictivo.',
		H: 'España (113) top 10 mundial — "la siesta existirá o no, pero la actividad sexual claramente existe." Arabia Saudita (~65) estimación muy incierta: solo actividad marital medible.',
		I: 'Francia (106) por debajo de su reputación de "país de los amantes": pero lideran en satisfacción percibida por encuentro — prefieren calidad a cantidad. Noruega (99) en el promedio global.',
		J: 'Argentina (105) levemente por encima del promedio global — sin llegar a Brasil/México. Austria (97) en el estándar europeo. Argelia (~70) y Jordania (~65) en el rango bajo islámico.',
		K: 'Portugal (96) y Colombia (~95) en el promedio global. R.D. del Congo (~85) y Uzbekistán (~80) con estimaciones regionales de baja precisión.',
		L: 'R.U./Inglaterra (108) por encima del promedio global. Croacia (~95) y Panamá (~90) en el rango regional. Ghana (~73) con dato de baja precisión.'
	},
	pornhub: {
		A: 'Rep. Checa (9.75 min) lidera el grupo. México (9.28 min) bajó desde ser el campeón mundial 2024 (11:01) — perdió el trono ante Japón. Los 0 = países con Pornhub bloqueado.',
		B: 'Canadá (10.08 min) lidera. Qatar (0) tiene la plataforma bloqueada — aunque el tráfico por VPN desde países del Golfo es un fenómeno documentado. Suiza (9.92 min) en el estándar europeo.',
		C: 'Escocia/R.U. (9.92 min) lidera. Marruecos (0) y Haití (0): uno bloqueado por ley, el otro sin infraestructura de internet suficiente para aparecer en los reportes.',
		D: 'EEUU (10.12 min) top 3 mundial en duración. El estado con más tiempo: Alaska (11:04). El de menos: Louisiana (9:18). Australia (10.00 min) en línea anglosajona.',
		E: 'Alemania (9.92 min) en el estándar europeo. Costa de Marfil (9.33 min) y Ecuador (9.58 min) cerca del promedio global. Todos en torno a la media mundial de 9:40.',
		F: 'Japón (11.03 min) es el campeón mundial 2025. El mismo país que menos duerme, más horas trabaja y menos sexo tiene, es el que más tiempo pasa por visita. Países Bajos (10.88 min) fue 2° mundial en 2023.',
		G: 'Bélgica (9.83 min) y Nueva Zelanda (9.92 min) en el rango europeo/anglosajón. Irán (0) bloqueado desde 2012 — antes del bloqueo era uno de los países con más búsquedas de contenido adulto en Google.',
		H: 'España (9.63 min) el europeo con menor duración de los medidos. Arabia Saudita (0) con bloqueo total. Uruguay (9.67 min) y Cabo Verde (9.5 min) en el promedio regional.',
		I: 'Francia (10.00 min) — 2° país del mundo en tráfico total de la plataforma, solo detrás de EEUU. Dato que complementa ser el 3° mercado mundial de McDonald\'s y el 3° de la plataforma. Irak (0) con acceso muy restringido.',
		J: 'Argentina (9.73 min) con dato concreto en los reportes anuales — exactamente en la media global. Argelia (0) y Jordania (0) bloqueados. Austria (9.92 min) en el estándar europeo.',
		K: 'Portugal (9.83 min) en el estándar europeo. R.D. del Congo (9.25 min) con dato estimado. Colombia (9.67 min) y Uzbekistán (9.5 min) en el promedio regional.',
		L: 'R.U./Inglaterra (9.92 min) en línea anglosajona. Croacia (9.75 min) y Panamá (9.67 min) por encima del promedio. Ghana (9.33 min) con estimación regional.'
	},
	preservativos: {
		A: 'Rep. Checa (86%) y Corea del Sur (82%) entre los más altos del torneo. Sudáfrica (54%) con la mayor epidemia de VIH del grupo: 7M de personas con VIH impulsan las campañas de distribución masiva.',
		B: 'Suiza (79%) con sistema de educación sexual ejemplar y preservativo en primera relación al 80%. Bosnia (36%) tiene uno de los valores más bajos de Europa — herencia de sistema de salud fragmentado étnicamente.',
		C: 'Escocia/R.U. (75%) con NHS gratuito. Haití (34%) con colapso del sistema de salud pública. Brasil (67%) con problema documentado de embarazo adolescente pese a anticoncepción moderada.',
		D: 'Turquía (74%) lidera el grupo. EEUU (61%) con brecha racial documentada: mujeres blancas más propensas a usar píldora; negras e hispanas con menor acceso. Paraguay (68%) en el rango latinoamericano.',
		E: 'Ecuador (77%) lidera el grupo — sorprende positivamente. Alemania (75%) con educación sexual obligatoria y robusto sistema de salud preventivo. Costa de Marfil (27%) con uno de los valores más bajos del torneo.',
		F: 'Suecia (75%) con acceso gratuito a anticoncepción para menores de 25 años y educación sexual desde los 8 años. Japón (55%) con peculiaridad única: el preservativo es el método más usado (80%) porque la píldora fue aprobada recién en 1999.',
		G: 'Irán (77%) sorprende: el régimen teocrático implementó planificación familiar estatal más eficiente que muchas democracias. Tasa de fecundidad: de 6.5 hijos/mujer en 1980 a 1.6 en 2020. Egipto (60%) con preferencia por métodos hormonales.',
		H: 'Uruguay (77%) el más alto de América Latina — con ley de interrupción voluntaria del embarazo desde 2012. Arabia Saudita (~30%) estimación muy incierta: solo actividad marital medible legalmente.',
		I: 'Noruega (75%) con modelo nórdico de salud sexual. Senegal (27%) con uno de los más bajos del torneo — influencia religiosa real en decisiones reproductivas. Irak (53%) con preferencia cultural por anticoncepción femenina.',
		J: 'Argentina (72%) sólido para América Latina — el movimiento feminista contribuyó a subir el uso de preservativo en primera relación. Jordania (51%) y Argelia (58%) en el rango árabe-moderado.',
		K: 'Colombia (75%) el más alto de América del Sur junto con Uruguay. R.D. del Congo (28%) con tasa de fecundidad de 5.9 hijos/mujer y alta mortalidad materna — las consecuencias son directas.',
		L: 'R.U./Inglaterra (75%) con NHS que provee anticoncepción gratuita incluyendo preservativos. Ghana (35%) con campaña nacional activa — uno de los programas de distribución más activos de África Occidental.'
	}
};

// Horarios en hora argentina (ART = UTC-3)
export const MATCHES: Match[] = [
	// Grupo A
	{ id: 'a1', group: 'A', date: '11 jun', time: '18:00', home: 'MEX', away: 'RSA', venue: 'Estadio Azteca, Ciudad de México' },
	{ id: 'a2', group: 'A', date: '12 jun', time: '01:00', home: 'KOR', away: 'CZE', venue: 'Estadio Akron, Guadalajara' },
	{ id: 'a3', group: 'A', date: '18 jun', time: '13:00', home: 'CZE', away: 'RSA', venue: 'Mercedes-Benz Stadium, Atlanta' },
	{ id: 'a4', group: 'A', date: '19 jun', time: '00:00', home: 'MEX', away: 'KOR', venue: 'Estadio Akron, Guadalajara' },
	{ id: 'a5', group: 'A', date: '25 jun', time: '00:00', home: 'CZE', away: 'MEX', venue: 'Estadio Azteca, Ciudad de México' },
	{ id: 'a6', group: 'A', date: '25 jun', time: '00:00', home: 'RSA', away: 'KOR', venue: 'Estadio BBVA, Monterrey' },
	// Grupo B
	{ id: 'b1', group: 'B', date: '12 jun', time: '16:00', home: 'CAN', away: 'BIH', venue: 'BMO Field, Toronto' },
	{ id: 'b2', group: 'B', date: '13 jun', time: '19:00', home: 'QAT', away: 'SUI', venue: "Levi's Stadium, San Francisco" },
	{ id: 'b3', group: 'B', date: '18 jun', time: '19:00', home: 'SUI', away: 'BIH', venue: 'SoFi Stadium, Los Ángeles' },
	{ id: 'b4', group: 'B', date: '18 jun', time: '22:00', home: 'CAN', away: 'QAT', venue: 'BC Place, Vancouver' },
	{ id: 'b5', group: 'B', date: '24 jun', time: '19:00', home: 'SUI', away: 'CAN', venue: 'BC Place, Vancouver' },
	{ id: 'b6', group: 'B', date: '24 jun', time: '19:00', home: 'BIH', away: 'QAT', venue: 'Lumen Field, Seattle' },
	// Grupo C
	{ id: 'c1', group: 'C', date: '13 jun', time: '19:00', home: 'BRA', away: 'MAR', venue: 'MetLife Stadium, Nueva York' },
	{ id: 'c2', group: 'C', date: '13 jun', time: '22:00', home: 'HAI', away: 'SCO', venue: 'Gillette Stadium, Boston' },
	{ id: 'c3', group: 'C', date: '19 jun', time: '19:00', home: 'SCO', away: 'MAR', venue: 'Gillette Stadium, Boston' },
	{ id: 'c4', group: 'C', date: '19 jun', time: '22:00', home: 'BRA', away: 'HAI', venue: 'Lincoln Financial Field, Filadelfia' },
	{ id: 'c5', group: 'C', date: '24 jun', time: '19:00', home: 'SCO', away: 'BRA', venue: 'Hard Rock Stadium, Miami' },
	{ id: 'c6', group: 'C', date: '24 jun', time: '19:00', home: 'MAR', away: 'HAI', venue: 'Mercedes-Benz Stadium, Atlanta' },
	// Grupo J — Argentina
	{ id: 'j1', group: 'J', date: '16 jun', time: '23:00', home: 'ARG', away: 'ALG', venue: 'Arrowhead Stadium, Kansas City', arge: true },
	{ id: 'j2', group: 'J', date: '17 jun', time: '04:00', home: 'AUT', away: 'JOR', venue: "Levi's Stadium, San Francisco" },
	{ id: 'j3', group: 'J', date: '22 jun', time: '15:00', home: 'ARG', away: 'AUT', venue: 'AT&T Stadium, Dallas', arge: true },
	{ id: 'j4', group: 'J', date: '23 jun', time: '03:00', home: 'JOR', away: 'ALG', venue: "Levi's Stadium, San Francisco" },
	{ id: 'j5', group: 'J', date: '28 jun', time: '00:00', home: 'ALG', away: 'AUT', venue: 'Arrowhead Stadium, Kansas City' },
	{ id: 'j6', group: 'J', date: '28 jun', time: '00:00', home: 'JOR', away: 'ARG', venue: 'AT&T Stadium, Dallas', arge: true }
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
