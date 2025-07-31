import { logger } from "./logger";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

export class EnvLogger {
    static logAll(): void {
        const envPath = path.resolve(process.cwd(), ".env");
        if (!fs.existsSync(envPath)) {
            logger.error(".env file not found. Terminating application.");
            process.exit(1);
        }
        const envVars = dotenv.parse(fs.readFileSync(envPath));
        logger.info("Loaded environment variables from .env:");
        for (const [key, value] of Object.entries(envVars)) {
            const displayedValue = EnvLogger.obfuscateIfNeeded(key, value);
            logger.info(`${key} = ${displayedValue}`);
        }
    }

    private static obfuscateIfNeeded(key: string, value: string): string {
        if (key === "DISCORD_WEB_HOOK") {
            return EnvLogger.obfuscateWebhook(value);
        }
        if (key === "RPC_URL") {
            return EnvLogger.obfuscateRPC_URL(value);
        }
        return value;
    }

    private static obfuscateWebhook(url: string): string {
        try {
            const parts = url.split('/');
            const id = parts[parts.length - 2]?.slice(0, 6) ?? '...';
            const token = parts[parts.length - 1]?.slice(0, 6) ?? '...';
            return `https://discord.com/api/webhooks/${id}.../${token}...`;
        } catch {
            return '[malformed webhook URL]';
        }
    }

    private static obfuscateRPC_URL(url: string): string {
        try {
            const parts = url.split('/');
            const id = parts[parts.length - 1]?.slice(0, 6) ?? '...';
            return `https://mainnet.infura.io/v3/${id}...`;
        } catch {
            return '[malformed webhook URL]';
        }
    }
}
