export interface Country {
	flag: string;
	name: string;
	group: string;
	govt: string;
	leader: string;
	autocracy: boolean;
	economia: string;
	relacion: string;
	politico: string;
	pobreza: number;
	gini: number;
	deuda: number;
	pisa: number;
	aprobacion: number;
	prensa: number;
	pib: number;
	gasto: number;
	mcdonalds: number;
	cerveza: number;
	obesidad: number;
	vacaciones: number;
	sueno: number;
	feriados: number;
	felicidad: number;
	frecuencia: number;
	pornhub: number;
	preservativos: number;
}

export interface Match {
	id: string;
	group: string;
	date: string;
	time: string;
	home: string;
	away: string;
	venue: string;
	arge?: boolean;
}

export interface Variable {
	id: string;
	label: string;
	dir: 'asc' | 'desc';
	unit: string;
	desc: string;
	source?: string;
	locked?: boolean;
}

export interface VariableCategory {
	label: string;
	vars: Variable[];
}

export interface Group {
	name: string;
	countries: string[];
}

export interface StatCard {
	emoji: string;
	title: string;
	text: string;
	highlight: string;
}

export type CountryCode = string;
export type GroupKey = string;
