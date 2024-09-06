import HttpException from '@/common/http-exception';
import HttpStatus from '@/common/http-status';
import mongoose, { ConnectOptions, Document, FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

class MongooseService {
	private static _instance: MongooseService;
	private connection: mongoose.Mongoose;
	private readonly options: ConnectOptions;
	private readonly uri: string;

	constructor(uri: string, options: ConnectOptions = {}) {
		this.uri = uri;
		this.options = options;
		this.connect();
	}

	public static getInstance(uri?: string, options: ConnectOptions = {}) {
		if (!MongooseService._instance) {
			if (!uri) {
				throw new Error('MongoDB URI is required');
			}

			MongooseService._instance = new MongooseService(uri, options);
		}

		return MongooseService._instance;
	}

	private async connect() {
		try {
			const connection = await mongoose.connect(this.uri, this.options);
			this.connection = connection;
			console.log('Connected to MongoDB at', this.uri);

			return connection;
		} catch (error) {
			console.error('Error connecting to MongoDB:', error);
			process.exit(1);
		}
	}

	async create<T extends Document>(model: Model<T>, data: Partial<T>): Promise<T> {
		try {
			const document = new model(data);
			return await document.save();
		} catch (error) {
			console.error('Error creating document:', error);
			throw error;
		}
	}

	async createUnique<T extends Document>(model: Model<T>, data: Partial<T>, filter: FilterQuery<T>): Promise<T | null> {
		try {
			// Check if the document already exists
			const existingDocument = await model.findOne(filter).exec();

			if (existingDocument) {
				throw new HttpException(HttpStatus.CONFLICT, 'Document already exists');
			}

			const document = new model(data);
			return await document.save();
		} catch (error) {
			console.error('Error creating document:', error);
			throw error;
		}
	}

	async delete<T extends Document>(model: Model<T>, id: string): Promise<T | null> {
		try {
			return await model.findByIdAndDelete(id).exec();
		} catch (error) {
			console.error('Error deleting document:', error);
			throw error;
		}
	}

	async deleteOne<T extends Document>(model: Model<T>, filter: FilterQuery<T>): Promise<T | null> {
		try {
			return await model.findOneAndDelete(filter).exec();
		} catch (error) {
			console.error('Error deleting document:', error);
			throw error;
		}
	}

	async disconnect() {
		try {
			await mongoose.disconnect();
			console.log('Disconnected from MongoDB');
		} catch (error) {
			console.error('Error disconnecting from MongoDB:', error);
		}
	}

	async find<T extends Document>(model: Model<T>, filter: FilterQuery<T> = {}, options: QueryOptions<T> = {}): Promise< T[]> {
		try {
			const query = model.find(filter, options);
			return await query.exec();
		} catch (error) {
			console.error('Error finding documents:', error);
			throw error;
		}
	}

	async findById<T extends Document>(model: Model<T>, id: string): Promise<T | null> {
		try {
			return await model.findById(id).exec();
		} catch (error) {
			console.error('Error finding document by ID:', error);
			throw error;
		}
	}

	async findOne<T extends Document>(model: Model<T>, filter: FilterQuery<T>): Promise<T | null> {
		try {
			return await model.findOne(filter).exec();
		} catch (error) {
			console.error('Error finding document by ID:', error);
			throw error;
		}
	}

	async updateById<T extends Document>(model: Model<T>, id: string, updateData: UpdateQuery<T>, options: QueryOptions<T> = {}): Promise<T | null> {
		try {
			options.new = options.new || true;

			return await model.findByIdAndUpdate(id, updateData, options).exec();
		} catch (error) {
			console.error('Error updating document:', error);
			throw error;
		}
	}

	async updateOne<T extends Document>(model: Model<T>, filter: FilterQuery<T>, updateData: UpdateQuery<T>, options: QueryOptions<T> = {}): Promise<T | null> {
		try {
			options.new = options.new || true;
			
			const result = await model.findOneAndUpdate(filter, updateData, options).exec();
			
			if(!result) {
				throw new HttpException(HttpStatus.NOT_FOUND, 'Document not found');
			}

			return result;
		} catch (error) {
			console.error('Error updating document:', error);
			throw error;
		}
	}

	get getConnection(): mongoose.Mongoose {
		return this.connection;
	}
}

export default MongooseService;
