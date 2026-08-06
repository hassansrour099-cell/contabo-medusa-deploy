# Contabo access (required to finish deploy)

Server: `root@169.58.124.240`

## Fastest path

1. Open Contabo email / Customer Panel and copy the **root password**.
2. On this machine:

```powershell
$env:CONTABO_ROOT_PASSWORD = 'PASTE_PASSWORD_HERE'
cd c:\medusa-stores\deploy
node scripts/ssh-bootstrap.mjs
```

That installs the SSH key and runs the full Docker bootstrap.

## Or: Contabo VNC console (no password from this PC)

1. Contabo panel → VPS → VNC / browser console
2. Login as `root` with the Contabo password
3. Paste:

```bash
curl -fsSL https://raw.githubusercontent.com/hassansrour099-cell/contabo-medusa-deploy/master/scripts/remote-bootstrap.sh | bash
```

## SSH public key (optional preload on OS reinstall)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEi6MHSAKuKLNjnhtVJg6Pr0MrnHFWPquOJt67vSrJho contabo-medusa-deploy
```

## DNS (required for HTTPS)

Keep GoDaddy nameservers. In GoDaddy DNS, add A records only:

| Host | Value |
|---|---|
| urban | 169.58.124.240 |
| api-urban | 169.58.124.240 |
| street | 169.58.124.240 |
| api-street | 169.58.124.240 |

After they resolve, on the VPS:

```bash
cd /opt/medusa-stores/deploy && bash scripts/setup-ssl.sh
```
