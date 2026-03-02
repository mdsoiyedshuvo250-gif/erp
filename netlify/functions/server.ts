import serverless from "serverless-http";
import { app, startServer } from "../../server";

let serverlessHandler: any;

export const handler = async (event: any, context: any) => {
  if (!serverlessHandler) {
    await startServer();
    serverlessHandler = serverless(app);
  }
  return serverlessHandler(event, context);
};
