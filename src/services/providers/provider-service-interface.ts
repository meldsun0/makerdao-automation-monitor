import { Filter, Log } from "ethers";
export interface ProviderServiceInterface {
    getCurrentBlockNumber(): Promise<number>;
    getLogs(params: Filter): Promise<Log[]>;

    numJobs(): Promise<number>;
    jobAt(index: number): Promise<string>;

}