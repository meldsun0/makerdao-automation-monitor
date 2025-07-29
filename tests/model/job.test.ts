import {Interface, Log, LogParams} from "ethers";
import {Job} from "../../src/model/job";
import any = jasmine.any;


const mockAbi = new Interface([
    "event Work(address indexed usr)"
]);

describe("Job", () => {
    let job: Job;

    beforeEach(() => {
        job = new Job("TestJob", "0xABC", mockAbi);
    });

    test("insertExecutedBlock inserts correctly and keeps order", () => {
        job.insertExecutedBlock(100);
        job.insertExecutedBlock(90);
        job.insertExecutedBlock(110);
        job.insertExecutedBlock(90);
        expect(job["executedBlocks"]).toEqual([110, 100, 90]);
    });

    test("getLatestExecutedBlock returns most recent block", () => {
        expect(job.getLatestExecutedBlock()).toBeNull();
        job.insertExecutedBlock(105);
        job.insertExecutedBlock(95);
        expect(job.getLatestExecutedBlock()).toBe(105);
    });

    test("pruneOlderThan removes blocks older than cutoff", () => {
        job.insertExecutedBlock(105);
        job.insertExecutedBlock(95);
        job.insertExecutedBlock(85);
        job.pruneOlderThan(100);
        expect(job["executedBlocks"]).toEqual([105]);
    });

    test("getJobAddress returns lowercase address", () => {
        expect(job.getJobAddress()).toBe("0xabc");
    });

    test("printJobInfoRow prints formatted output", () => {
        console.log = jest.fn();

        job.insertExecutedBlock(200);
        job.insertExecutedBlock(190);
        job.insertExecutedBlock(180);
        job.insertExecutedBlock(170);

        job.printJobInfoRow();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringMatching(/TestJob\s+\│ 0xabc\s+\│ 200\s+\│ 200, 190, 180, \.\.\./)
        );
    });
});
