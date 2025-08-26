import mongoose, { ConnectOptions } from "mongoose";

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get MongoDB connection string from environment variables
   */
  private getMongoDBConnection(): string {
    return process.env.MONGODB_URI || "mongodb://localhost:27017/ghl-bridge";
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      const options: ConnectOptions & {
        useNewUrlParser: boolean;
        useUnifiedTopology: boolean;
      } = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };

      await mongoose.connect(this.getMongoDBConnection(), options);
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected successfully");
    } catch (error) {
      console.error("MongoDB disconnection error:", error);
      throw error;
    }
  }
}
