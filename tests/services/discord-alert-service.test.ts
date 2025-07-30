import {DiscordAlertService} from "../../src/services/alerts/discord-alert-service";


describe("DiscordAlertService", () => {
    let service: DiscordAlertService;
    let buildAlertSpy: jest.SpyInstance;
    let postMessage: jest.SpyInstance;

    const getAlertMap = (): Map<string, number> => {
        return (service as any).alertMap;
    };

    beforeEach(() => {
        service = new DiscordAlertService();
        buildAlertSpy = jest.spyOn(service as any, "buildAlert").mockImplementation(() => {});
        postMessage = jest.spyOn(service as any, "postMessage").mockImplementation(() => {});

    });

    afterEach(() => {
        buildAlertSpy.mockRestore();
    });

    it("should alert if job has never been alerted and never executed", async () => {
        await service.sendAlert("TestJob", null, 1000);
        expect(buildAlertSpy).toHaveBeenCalledWith("TestJob", null, 1000);
        expect(getAlertMap().get("TestJob")).toBe(-1);
    });

    it("should not alert again for a job never executed if already alerted", async () => {
        await service.sendAlert("TestJob", null, 1000);
        await service.sendAlert("TestJob", null, 1100);
        expect(buildAlertSpy).toHaveBeenCalledTimes(1);
        expect(getAlertMap().get("TestJob")).toBe(-1);
    });

    it("should alert if job was executed and not previously alerted", async () => {
        await service.sendAlert("Job1", 900, 1000);
        expect(buildAlertSpy).toHaveBeenCalledWith("Job1", 900, 1000);
        expect(getAlertMap().get("Job1")).toBe(900);
    });

    it("should not alert again if same lastExecutedBlock already alerted", async () => {
        await service.sendAlert("Job1", 900, 1000);
        await service.sendAlert("Job1", 900, 1100);
        expect(buildAlertSpy).toHaveBeenCalledTimes(1);
        expect(getAlertMap().get("Job1")).toBe(900);
    });



    it("should alert again if job was worked again after previous alert", async () => {
        await service.sendAlert("Job1", 900, 1000);
        expect(getAlertMap().get("Job1")).toBe(900);

        await service.sendAlert("Job1", 950, 1100);
        expect(getAlertMap().get("Job1")).toBe(950);
        expect(buildAlertSpy).toHaveBeenCalledTimes(2);

        await service.sendAlert("Job1", 950, 1200);

        expect(buildAlertSpy).toHaveBeenLastCalledWith("Job1", 950, 1100);
        expect(getAlertMap().get("Job1")).toBe(950);
    });
});
