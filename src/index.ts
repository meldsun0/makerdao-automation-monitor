import 'dotenv/config';
import {ProviderServiceInterface} from "./services/providers/provider-service-interface";
import {ProviderService} from "./services/providers/provider-service";
import {JobMonitorService} from "./services/job-monitor";
import { logger } from "./utils/logger";
import { EnvLogger } from "./utils/env-logger";

const rpcUrl = process.env.RPC_URL!;
const sequencerAddress = process.env.SEQUENCER_ADDRESS!;

const providerService: ProviderServiceInterface = new ProviderService(rpcUrl, sequencerAddress);

(async function main() {
    try {
        logger.info(`Starting Maker Job Monitor`);
        EnvLogger.logAll();
        const currentBlock = await providerService.getCurrentBlockNumber();
        const monitor = new JobMonitorService(providerService, currentBlock, true);
        await monitor.initSync();
    } catch (error) {
        logger.error(`Fatal error starting the monitor`, error instanceof Error ? { stack: error.stack } : {});
        process.exit(1);
    }
})();





