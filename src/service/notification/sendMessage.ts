import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Notification } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configJsonFilePath = path.join(__dirname, "../../../FCM.json");

admin.initializeApp({
  credential: admin.credential.cert(configJsonFilePath),
});

export async function sendMessage(token: string, title: string, body: string) {
  const message = {
    token,
    notification: {
      title,
      body,
    },
  };

  const results = await admin.messaging().send(message);
  return results;
}

export async function sendMulticastMessage(
  tokens: string[],
  notification: Notification
) {
  const message = {
    tokens,
    data: notification,
  };
  const results = await admin.messaging().sendEachForMulticast(message);
  return results;
}
