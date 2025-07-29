import {Interface, Log} from "ethers";

export class Job {

    private readonly name: string;
    private readonly abi: Interface;
    private readonly address: string;
    private executedBlocks: number[] = [];

    constructor(name: string, address: string, abi: Interface) {
        this.name = name;
        this.address = address.toLowerCase();
        this.abi = abi;
    }


    public insertExecutedBlock(blockNumber: number): void {
        if (this.executedBlocks.includes(blockNumber)) {
            return;
        }
        const index = this.executedBlocks.findIndex(b => b < blockNumber);
        if (index === -1) {
            this.executedBlocks.push(blockNumber);
        } else {
            this.executedBlocks.splice(index, 0, blockNumber);
        }
    }

    public getLatestExecutedBlock(): number | null {
        return this.executedBlocks.length > 0 ? this.executedBlocks[0] : null;
    }

    public pruneOlderThan(cutoffBlock: number): void {
        this.executedBlocks = this.executedBlocks.filter(b => b >= cutoffBlock);
    }

    public getJobAddress(): string {
        return this.address;
    }

    public recordExecutedBlocksFromLogs(logs: Log[]) {
        if (logs.length === 0) {
            //console.log(`No logs found for ${this.name}`);
            return;
        }
        for (const log of logs) {
            console.log(log)
            try {
                const parsed = this.abi.parseLog(log);
                if (!parsed) {
                    console.warn(`Could not parse log for job ${this.name}`);
                    continue;
                }
                if (parsed.name.toLowerCase() === "work") {
                    this.insertExecutedBlock(log.blockNumber)
                } else {
                    console.log(`Event "${parsed.name}" from ${this.name} is not a Work event.`);
                }
            } catch (err) {
                console.warn(`Error parsing log for ${this.name} (${this.address}):`, err);
            }
        }
    }

    public printJobInfoRow(): void {
        const jobName = this.name.padEnd(21);
        const address = this.address.padEnd(44);
        const latestBlock = (this.getLatestExecutedBlock() ?? "—").toString().padEnd(15);
        const displayCount = 3;
        const blocksSlice = this.executedBlocks.slice(0, displayCount);
        const blockList = blocksSlice.join(", ");
        const suffix = this.executedBlocks.length > displayCount ? ", ..." : "";
        const blockField = (blockList + suffix).padEnd(36);

        console.log(`│ ${jobName}│ ${address}│ ${latestBlock} │ ${blockField}│`);
    }
}