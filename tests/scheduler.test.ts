import { CronExpression, HookmeClient, ScheduleJob } from '../src/index';

const sdk = HookmeClient.local();
const jobKey = "mywebhook-job-1";

test('Hookme client sdk should be defined', () => {
    expect(sdk).toBeDefined();
});

test('Hookme client sdk should be able to schedule a job', async () => {
    const job = ScheduleJob.builder()
        .webhook_url("https://01a99e31-5c70-40b6-bf68-b7349ade168d-webhook-lt.ctdn.net")
        .webhook_data({
            name: "Sambo Chea",
            position: "Software Developer",
        })
        .webhook_headers({
            "x-api-key": "abc_123"
        })
        .type("cron")
        .schedule(CronExpression.Every10Seconds)
        .tz("Asia/Phnom_Penh")
        .build();

    const response = await sdk.schedule(jobKey, job);
    console.log("Request: ", job);
    console.log("Response: ", response);

    expect(job.webhook_url).toBeDefined();
    expect(job.webhook_data).not.toBeNull();

    expect(response).toBeDefined();
    expect(response).not.toBeNull();
    expect(response).not.toBe('');
    expect(response?.key).toBeDefined();
    expect(response?.key).not.toBeNull();
    expect(response?.key).not.toBe('');
    expect(response?.job_status).toBeDefined();
    expect(response?.job_status).not.toBeNull();
    expect(response?.created_at).toBeDefined();
    expect(response?.created_at).not.toBeNull();
    expect(response?.created_at).not.toBe('');
});

test('Hookme client sdk should be able to unschedule a job', async () => {
    await sdk.unschedule(jobKey);
})