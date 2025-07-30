import {AlertServiceInterface} from "../../src/services/alerts/alert-service-interface";
import {ProviderServiceInterface} from "../../src/services/providers/provider-service-interface";
import {Job} from "../../src/model/job";
import {JobMonitorService} from "../../src/services/job-monitor";

jest.mock("../src/services/alerts/discord-alert-service", () => {
    return {
        DiscordAlertService: jest.fn().mockImplementation(() => mockAlertService),
    };
});

const mockAlertService: jest.Mocked<AlertServiceInterface> = {
    sendAlert: jest.fn(),
};


const mockProviderService: jest.Mocked<ProviderServiceInterface> = {
    getCurrentBlockNumber: jest.fn(),
    getLogs: jest.fn(),
    jobAt: jest.fn(),
    numJobs: jest.fn(),
};

const mockJob: jest.Mocked<Job> = {
    getJobAddress: jest.fn().mockReturnValue("0xabc"),
    getLatestExecutedBlock: jest.fn(),
    recordExecutedBlocksFromLogs: jest.fn(),
    printJobInfoRow: jest.fn(),
    getName: jest.fn().mockReturnValue("TestJob"),
} as unknown as jest.Mocked<Job>;

jest.mock("../src/config/jobs-abi-loader", () => ({
    createJobFromAddress: jest.fn(() => mockJob),
}));

describe("JobMonitorService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should send an alert if job was never executed", async () => {
        mockProviderService.numJobs.mockResolvedValue(1);
        mockProviderService.jobAt.mockResolvedValue("0xABC");
        mockProviderService.getLogs.mockResolvedValue([]);
        mockJob.getLatestExecutedBlock.mockReturnValue(null);

        const service = new JobMonitorService(mockProviderService, 2000);
        await service.initSync();

        expect(mockAlertService.sendAlert).toHaveBeenCalledWith("TestJob", null, 2000);
    });

    it("should send an alert if job was executed more than 1000 blocks ago", async () => {
        mockProviderService.numJobs.mockResolvedValue(1);
        mockProviderService.jobAt.mockResolvedValue("0xABC");
        mockProviderService.getLogs.mockResolvedValue([]);
        mockJob.getLatestExecutedBlock.mockReturnValue(900);

        const service = new JobMonitorService(mockProviderService, 2000);
        await service.initSync();

        expect(mockAlertService.sendAlert).toHaveBeenCalledWith("TestJob", 900, 2000);
    });

    it("should NOT send an alert if job was recently executed", async () => {
        mockProviderService.numJobs.mockResolvedValue(1);
        mockProviderService.jobAt.mockResolvedValue("0xABC");
        mockProviderService.getLogs.mockResolvedValue([]);
        mockJob.getLatestExecutedBlock.mockReturnValue(1995);

        const service = new JobMonitorService(mockProviderService, 2000);
        await service.initSync();

        expect(mockAlertService.sendAlert).not.toHaveBeenCalled();
    });
});
