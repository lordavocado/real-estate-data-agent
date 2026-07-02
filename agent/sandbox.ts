import { defineSandbox } from "eve/sandbox";
import { justbash } from "eve/sandbox/just-bash";

/**
 * Lightweight local sandbox — no Docker daemon or microsandbox VM.
 * Shell/file tools are disabled in agent/tools/*; this satisfies eve's
 * sandbox requirement without pulling heavy isolation runtimes.
 */
export default defineSandbox({
  backend: justbash(),
});
