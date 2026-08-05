#!/usr/bin/env node
/**
 * Bootstrap Contabo VPS over SSH with password auth, then install our key.
 *
 *   set CONTABO_ROOT_PASSWORD=...
 *   node scripts/ssh-bootstrap.mjs
 */
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { Client } from "ssh2"

const host = process.env.CONTABO_HOST || "169.58.124.240"
const password = process.env.CONTABO_ROOT_PASSWORD
const pubPath = join(homedir(), ".ssh", "contabo_medusa.pub")

if (!password) {
  console.error("Set CONTABO_ROOT_PASSWORD to the Contabo root password.")
  process.exit(1)
}

const pubKey = readFileSync(pubPath, "utf8").trim()

function exec(conn, command, timeoutMs = 3_600_000) {
  return new Promise((resolve, reject) => {
    console.log(">>", command.slice(0, 120))
    conn.exec(command, { pty: true }, (err, stream) => {
      if (err) return reject(err)
      let out = ""
      const timer = setTimeout(() => {
        stream.close()
        reject(new Error(`Timeout: ${command.slice(0, 80)}`))
      }, timeoutMs)
      stream
        .on("close", (code) => {
          clearTimeout(timer)
          process.stdout.write(out)
          if (code === 0) resolve(out)
          else reject(new Error(`Exit ${code}: ${command.slice(0, 80)}\n${out}`))
        })
        .on("data", (d) => {
          const s = d.toString()
          out += s
          process.stdout.write(s)
        })
        .stderr.on("data", (d) => {
          const s = d.toString()
          out += s
          process.stderr.write(s)
        })
    })
  })
}

const conn = new Client()
conn
  .on("ready", async () => {
    try {
      await exec(
        conn,
        `mkdir -p /root/.ssh && chmod 700 /root/.ssh && (grep -qxF '${pubKey}' /root/.ssh/authorized_keys || echo '${pubKey}' >> /root/.ssh/authorized_keys) && chmod 600 /root/.ssh/authorized_keys`
      )
      await exec(
        conn,
        "curl -fsSL https://raw.githubusercontent.com/hassansrour099-cell/medusa-stores-deploy/master/scripts/remote-bootstrap.sh | bash"
      )
      console.log("\nBootstrap finished.")
      conn.end()
    } catch (e) {
      console.error(e)
      conn.end()
      process.exit(1)
    }
  })
  .on("error", (e) => {
    console.error(e)
    process.exit(1)
  })
  .connect({
    host,
    port: 22,
    username: "root",
    password,
    readyTimeout: 30000,
    tryKeyboard: true,
  })
