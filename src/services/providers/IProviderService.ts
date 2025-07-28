import { Filter, Log } from "ethers";
import {SequencerContractService} from "./SequencerContractService";

export interface IProviderService {
    getCurrentBlockNumber(): Promise<number>;
    getLogs(params: Filter): Promise<Log[]>;
    getBlockTimestamp(blockNumber: number): Promise<number>;

    getSequencerContractService(): SequencerContractService;
}