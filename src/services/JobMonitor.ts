import {ProviderServiceInterface} from "./providers/provider-service-interface";

import {Job} from "../model/job";
import {createJobFromAddress} from "../config/JobsABILoader";
import {Log} from "ethers";
import {AlertServiceInterface} from "./alerts/alert-service.interface";
import {DiscordAlertService} from "./alerts/discord-alert-service";


export class JobMonitorService {
    private readonly BLOCK_LIMIT = 1000;
    private readonly POLLING_INTERVAL_MS =  30 * 1000;
    private readonly DELAY_MS = 300;
    private readonly jobsMap: Map<string, Job> = new Map();
    private currentBlock: number;
    private readonly alertService: AlertServiceInterface;

    constructor(private readonly providerService: ProviderServiceInterface, currentBlock: number) {
        this.currentBlock = currentBlock;
        this.alertService = new DiscordAlertService();
    }

    public async initSync(): Promise<void> {
        const fromBlock = this.currentBlock - this.BLOCK_LIMIT;
        await this.trackAndUpdateJobsInRange(fromBlock + 1, this.currentBlock);
        this.printTableRow();
        await this.checkJobExecutionAndAlert();
        this.startPolling();
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

    private async checkJobExecutionAndAlert(): Promise<void> {
        for (const job of this.jobsMap.values()) {
            const latestBlock = job.getLatestExecutedBlock();
            if (latestBlock === null || this.currentBlock - latestBlock > this.BLOCK_LIMIT) {
                await this.alertService.sendAlert(job.getName(), latestBlock, this.currentBlock);
            }
        }
    }


    private startPolling(): void {
        setInterval(async () => {
            try {
                const latestBlock = await this.providerService.getCurrentBlockNumber();
                if (latestBlock <= this.currentBlock + 100) return;
                await this.trackAndUpdateJobsInRange(this.currentBlock + 1, latestBlock);
                this.currentBlock = latestBlock;
                this.printTableRow();
                await this.checkJobExecutionAndAlert();
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, this.POLLING_INTERVAL_MS);
    }


    private async trackAndUpdateJobsInRange(fromBlock: number, toBlock: number): Promise<void> {
        const jobCount = await this.providerService.numJobs();
        console.log(`Polling ${jobCount} jobs from block ${fromBlock} to ${toBlock}`);

        for (let i = 0; i < jobCount; i++) {
            const jobAddress = await this.providerService.jobAt(i);
            const lowerAddress = jobAddress.toLowerCase();
            let job = this.jobsMap.get(lowerAddress);
            if (!job) {
                job = createJobFromAddress(jobAddress);
                if (!job) continue;
                this.jobsMap.set(lowerAddress, job);
                console.log(`New job detected and tracked: ${job.getName()} (${lowerAddress})`);
            }
            const logs = await this.fetchJobLogs(job, fromBlock, this.currentBlock);
            job.recordExecutedBlocksFromLogs(logs);
            this.jobsMap.set(jobAddress.toLowerCase(), job);
            await this.sleep(this.DELAY_MS);
        }
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
