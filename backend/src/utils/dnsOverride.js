import dns from "node:dns";

// Some networks cannot resolve Atlas SRV records.
// Set DNS_SERVERS=8.8.8.8,8.8.4.4 in .env to use Google DNS instead.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}