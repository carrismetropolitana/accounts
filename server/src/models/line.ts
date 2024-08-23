import { Document, Schema } from 'mongoose';

export interface ILine extends Document {
	color?: string
	facilities: string[]
	line_id: string
	localities: string[]
	long_name?: string
	municipality_ids: string[]
	pattern_ids: string[]
	route_ids: string[]
	short_name?: string
	text_color?: string
}

// Line Schema
export const LineSchema: Schema = new Schema<ILine>({
	color: { type: String },
	facilities: { default: [], type: [String] },
	line_id: { required: true, type: String },
	localities: { default: [], type: [String] },
	long_name: { type: String },
	municipality_ids: { default: [], type: [String] },
	pattern_ids: { default: [], type: [String] },
	route_ids: { default: [], type: [String] },
	short_name: { type: String },
	text_color: { type: String },
});
