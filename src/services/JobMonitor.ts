import {IProviderService} from "./providers/IProviderService";
import {SequencerContractService} from "./providers/SequencerContractService";
import {Job} from "../model/Job";
import {createJobFromAddress} from "../config/JobsABILoader";
import {Log} from "ethers";


export class JobMonitorService {
    private readonly BLOCK_LIMIT = 1000;
    private readonly sequencerService: SequencerContractService;
    private readonly DELAY_MS = 300;
    private readonly jobsMap: Map<string, Job> = new Map();

    constructor(private readonly providerService: IProviderService) {
        this.sequencerService = providerService.getSequencerContractService();
    }

    public async initSync(): Promise<void> {
        const jobCount = await this.sequencerService.numJobs();
        const currentBlock = await this.providerService.getCurrentBlockNumber();
        const fromBlock = currentBlock - this.BLOCK_LIMIT;
        console.log(`Bootstrapping ${jobCount} jobs with 1000-block scan from block ${fromBlock} to ${currentBlock}:`);

        for (let i = 0; i < jobCount; i++) {
            const jobAddress = await this.sequencerService.jobAt(i);
            const job = createJobFromAddress(jobAddress);
            if (!job) {
                console.log(`ABI not found for job ${jobAddress}`);
                continue;
            }
            const logs = await this.fetchJobLogs(job, fromBlock, currentBlock);
            job.recordExecutedBlocksFromLogs(logs);
            this.jobsMap.set(jobAddress.toLowerCase(), job);
            await this.sleep(this.DELAY_MS);
        }
        this.printTableRow();

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
