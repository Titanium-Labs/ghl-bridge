import express, { Express } from "express";
import dotenv from "dotenv";
import { json } from "body-parser";
import routes from "./routes";
import { DatabaseService } from "./services/databaseService";

const path = __dirname + "/ui/dist/";

dotenv.config();

const app: Express = express();
app.use(json({ type: "application/json" }));

app.use(express.static(path));

app.use("/", routes);

const port = process.env.PORT;

const startServer = async () => {
  try {
    const databaseService = DatabaseService.getInstance();
    await databaseService.connect();

    app.listen(port, () => {
      console.log(`GHL app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
