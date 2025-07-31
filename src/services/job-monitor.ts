import {ProviderServiceInterface} from "./providers/provider-service-interface";
import { logger } from "../utils/logger";
import {Job} from "../model/job";
import {createJobFromAddress} from "../config/jobs-abi-loader";
import {Log} from "ethers";
import {AlertServiceInterface} from "./alerts/alert-service-interface";
import {DiscordAlertService} from "./alerts/discord-alert-service";


export class JobMonitorService {
    private static readonly BLOCK_LIMIT = 1000;
    private static readonly POLLING_INTERVAL_MS =  30 * 1000;
    private static readonly DELAY_MS = 300;
    private static BLOCK_LAG_THRESHOLD = 40;

    private readonly jobsMap: Map<string, Job> = new Map();
    private readonly alertService: AlertServiceInterface;
    private readonly enablePolling: boolean;
    private currentBlock: number;

    constructor(private readonly providerService: ProviderServiceInterface, currentBlock: number,
                enablePolling: boolean ) {
        this.currentBlock = currentBlock;
        this.alertService = new DiscordAlertService();
        this.enablePolling = enablePolling;
        this.logConfig();
    }

    public async initSync(): Promise<void> {
        logger.info(`Init sync on Block: ${this.currentBlock}`)
        const fromBlock = this.currentBlock - JobMonitorService.BLOCK_LIMIT;
        await this.trackAndUpdateJobsInRange(fromBlock + 1, this.currentBlock);
        this.printTableRow();
        await this.checkJobExecutionAndAlert();
        if (this.enablePolling) {
            this.startPolling();
        }
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
                if (latestBlock <= this.currentBlock + JobMonitorService.BLOCK_LAG_THRESHOLD){
                    logger.info(`Avoid polling from ${this.currentBlock+1} to ${latestBlock}. Let's wait till BLOCK_LAG_THRESHOLD: ${this.currentBlock + JobMonitorService.BLOCK_LAG_THRESHOLD}`);
                    return;
                }
                await this.trackAndUpdateJobsInRange(this.currentBlock + 1, latestBlock);
                this.currentBlock = latestBlock;

                this.printTableRow();
                await this.checkJobExecutionAndAlert();
            } catch (err) {
                logger.error("Polling error:", err);
            }
        }, JobMonitorService.POLLING_INTERVAL_MS);
    }


    private async trackAndUpdateJobsInRange(fromBlock: number, toBlock: number): Promise<void> {
        const jobCount = await this.providerService.numJobs();
        logger.info(`Polling ${jobCount} jobs from block ${fromBlock} to ${toBlock}`);
        let jobAddress: string | undefined;
        for (let i = 0; i < jobCount; i++) {
            try {
                jobAddress = (await this.providerService.jobAt(i)).toLowerCase();
                let job = this.jobsMap.get(jobAddress);
                if (!job) {
                    job = createJobFromAddress(jobAddress);
                    if (!job){
                        logger.error(`Skipping unrecognized job address: ${jobAddress}`);
                        continue;
                    }
                    this.jobsMap.set(jobAddress, job);
                }
                const logs = await this.fetchJobLogs(job, fromBlock, this.currentBlock);
                job.recordExecutedBlocksFromLogs(logs);
                await this.sleep(JobMonitorService.DELAY_MS);
            }catch (err){
                logger.info(`Error processing job at index ${i} (address: ${jobAddress ?? "unknown"}):`, err);
            }
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
        logger.info("┌────────────────────┬─────────────────────────────────────────────┬──────────────┬───────────────────────────────────┐");
        logger.info("│ Job                │ Address                                     │ Latest Block │ Executed Blocks                   │");
        logger.info("├────────────────────┼─────────────────────────────────────────────┼──────────────┼───────────────────────────────────┤");

        for (const job of this.jobsMap.values()) {
            job.printJobInfoRow();
        }
        logger.info("└────────────────────┴─────────────────────────────────────────────┴──────────────┴───────────────────────────────────┘");
    }

    private logConfig(): void {
        logger.info(`Internal configs:`);
        logger.info(`BLOCK_LIMIT = ${JobMonitorService.BLOCK_LIMIT}`);
        logger.info(`POLLING_INTERVAL_MS = ${JobMonitorService.POLLING_INTERVAL_MS} ms`);
        logger.info(`DELAY_MS = ${JobMonitorService.DELAY_MS} ms`);
        logger.info(`BLOCK_LAG_THRESHOLD = ${JobMonitorService.BLOCK_LAG_THRESHOLD}`);
    }
}
