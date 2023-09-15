import { exec } from "child_process";

export function excecutePandoc(
  data: ArrayBuffer,
  args: string[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = `pandoc ${args.join(" ")}`;
    const process = exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      console.error(stderr);
      console.log(stdout);
      resolve(stdout);
      return;
    });
    process.stdin?.write(data);
    process.stdin?.end();
  });
}
