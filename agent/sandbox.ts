import { defineSandbox } from "eve/sandbox";

export default defineSandbox({
  async bootstrap({ use }) {
    const sandbox = await use();
    // You can initialize the sandbox environment here (e.g. seeding files or running commands).
    // For example:
    // await sandbox.run("echo 'Sandbox ready'");
  },
});
