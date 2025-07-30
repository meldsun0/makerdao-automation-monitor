import {ProviderServiceInterface} from "./providers/provider-service-interface";

import {Job} from "../model/job";
import {createJobFromAddress} from "../config/JobsABILoader";
import {Log} from "ethers";
import {AlertServiceInterface} from "./alerts/alert-service-interface";
import {DiscordAlertService} from "./alerts/discord-alert-service";


export class JobMonitorService {
    private static readonly BLOCK_LIMIT = 1000;
    private static readonly POLLING_INTERVAL_MS =  30 * 1000;
    private static readonly DELAY_MS = 300;

    private readonly jobsMap: Map<string, Job> = new Map();
    private readonly alertService: AlertServiceInterface;
    private currentBlock: number;

    constructor(private readonly providerService: ProviderServiceInterface, currentBlock: number) {
        this.currentBlock = currentBlock;
        this.alertService = new DiscordAlertService();
    }

    public async initSync(): Promise<void> {
        const fromBlock = this.currentBlock - JobMonitorService.BLOCK_LIMIT;
        await this.trackAndUpdateJobsInRange(fromBlock + 1, this.currentBlock);
        this.printTableRow();
        await this.checkJobExecutionAndAlert();
        this.startPolling();
    }

    private async checkJobExecutionAndAlert(): Promise<void> {
        for (const job of this.jobsMap.values()) {
            const latestBlock = job.getLatestExecutedBlock();
            if (latestBlock === null || this.currentBlock - latestBlock > JobMonitorService.BLOCK_LIMIT) {
                await this.alertService.sendAlert(job.getName(), latestBlock, this.currentBlock);
            }
        }
    }


    private startPolling(): void {
        setInterval(async () => {
            try {
                const latestBlock = await this.providerService.getCurrentBlockNumber();
                if (latestBlock <= this.currentBlock + 100){
                    console.log(`Polling from ${latestBlock} but need to wait till ${this.currentBlock + 100} to update jobMap`);
                    return;
                }
                console.log(`Polling from ${latestBlock} to ${this.currentBlock + 1}`);
                await this.trackAndUpdateJobsInRange(this.currentBlock + 1, latestBlock);
                this.currentBlock = latestBlock;

                this.printTableRow();
                await this.checkJobExecutionAndAlert();
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, JobMonitorService.POLLING_INTERVAL_MS);
    }


    private async trackAndUpdateJobsInRange(fromBlock: number, toBlock: number): Promise<void> {
        const jobCount = await this.providerService.numJobs();
        console.log(`Polling ${jobCount} jobs from block ${fromBlock} to ${toBlock}`);

        for (let i = 0; i < jobCount; i++) {
            const jobAddress = (await this.providerService.jobAt(i)).toLowerCase();
            let job = this.jobsMap.get(jobAddress);
            if (!job) {
                job = createJobFromAddress(jobAddress);
                if (!job) continue;

                this.jobsMap.set(jobAddress, job);
                console.log(`New job detected and tracked: ${job.getName()} (${jobAddress})`);
            }
            const logs = await this.fetchJobLogs(job, fromBlock, this.currentBlock);
            job.recordExecutedBlocksFromLogs(logs);

            await this.sleep(JobMonitorService.DELAY_MS);
        }
    }


    private async fetchJobLogs(job: Job, fromBlock: number, toBlock: number): Promise<Log[]> {
        return this.providerService.getLogs({
            address: job.getJobAddress(),
            fromBlock,
            toBlock,
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public printTableRow(): void {
        console.log("┌──────────────────────┬─────────────────────────────────────────────┬─────────────────┬─────────────────────────────────────┐");
        console.log("│ Job                  │ Address                                     │ Latest Block    │ Executed Blocks                     │");
        console.log("├──────────────────────┼─────────────────────────────────────────────┼─────────────────┼─────────────────────────────────────┤");

        for (const job of this.jobsMap.values()) {
            job.printJobInfoRow();
        }
        console.log("└──────────────────────┴─────────────────────────────────────────────┴─────────────────┴─────────────────────────────────────┘");
    }
}
