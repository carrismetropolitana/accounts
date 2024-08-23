import { Document, Schema } from 'mongoose';

export interface IStop extends Document {
	color?: string
	facilities: string[]
	id?: string
	localities: string[]
	municipalities: string[]
	patterns: string[]
	routes: string[]
	short_name: string
	text_color?: string
}

export const StopSchema: Schema = new Schema<IStop>({
	color: { type: String },
	facilities: { default: [], type: [String] },
	id: { type: String },
	localities: { default: [], type: [String] },
	municipalities: { default: [], type: [String] },
	patterns: { default: [], type: [String] },
	routes: { default: [], type: [String] },
	short_name: { required: true, type: String },
	text_color: { type: String },
});
