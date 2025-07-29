import {AlertServiceInterface} from "./alert-service.interface";

export class DiscordAlertService implements AlertServiceInterface {

    private readonly alertMap: Map<string, number> = new Map();

    sendAlert(jobName: string, lastExecutedBlock: number | null, currentBlock: number): Promise<void> {
        const lastAlertedBlock = this.alertMap.get(jobName);
        if (lastExecutedBlock !== null && lastAlertedBlock !== undefined && lastExecutedBlock > lastAlertedBlock) {
            this.alertMap.delete(jobName);
        }
        const effectiveExecutedBlock = lastExecutedBlock ?? -1;
        const alreadyAlerted = lastAlertedBlock === effectiveExecutedBlock;

        if (!alreadyAlerted) {
            this.logAlert(jobName,lastExecutedBlock, currentBlock);
            this.alertMap.set(jobName, effectiveExecutedBlock);
        }
        return Promise.resolve(undefined);
    }


    private logAlert(jobName: string, lastExecutedBlock: number | null, currentBlock: number){
        const message = {
            username: "Maker Job Monitor",
            content: `**${jobName}** has not been worked in over 1000 blocks.\n` +
                `Last executed block: ${lastExecutedBlock ?? "never"}\n` +
                `Current block: ${currentBlock}`
        };
        console.log(message);
    }

}