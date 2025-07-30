import {AlertServiceInterface} from "./alert-service-interface";
import process from "node:process";

const discord_web_hook = process.env.DISCORD_WEB_HOOK!;

export class DiscordAlertService implements AlertServiceInterface {

    private readonly alertMap: Map<string, number> = new Map();

    async sendAlert(jobName: string, lastExecutedBlock: number | null, currentBlock: number): Promise<void> {
        const lastAlertedBlock = this.alertMap.get(jobName);
        if (lastExecutedBlock !== null && lastAlertedBlock !== undefined && lastExecutedBlock > lastAlertedBlock) {
            this.alertMap.delete(jobName);
        }
        const effectiveExecutedBlock = lastExecutedBlock ?? -1;
        const alreadyAlerted = lastAlertedBlock === effectiveExecutedBlock;

        if (!alreadyAlerted) {
            const message = this.buildAlert(jobName, lastExecutedBlock, currentBlock);
            await this.postMessage(message);
            this.alertMap.set(jobName, effectiveExecutedBlock);
        }
        return Promise.resolve(undefined);
    }

    private async postMessage(message: string): Promise<void> {
        try {
            const response = await fetch(discord_web_hook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message, username: 'Maker Job Monitor' }),
            });

            if (!response.ok) {
                console.error(`Maker Job Monitor failed to send alert: ${response.status} ${response.statusText}`);
            } else {
                console.log(`Alert sent:`);
                console.log(message);
            }
        } catch (error) {
            console.error(`Maker Job Monitor failed to send alert:`, error);
        }
    }

    private buildAlert(jobName: string, lastExecutedBlock: number | null, currentBlock: number): string{
        return `**${jobName}** has not worked in over 1000 blocks.\n` +
                `Last executed block: ${lastExecutedBlock ?? "never"}\n` +
                `Current block: ${currentBlock}`;
    }

}