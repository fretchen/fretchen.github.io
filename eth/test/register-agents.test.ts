/**
 * scripts/register-agents.ts against MockAgentRegistry on Hardhat's simulated network.
 *
 * The mock reproduces the registry behaviours the script depends on (agentWallet defaults to the
 * owner, ownerOf reverts on an unknown id, getAgentWallet does not). The simulated network is a
 * single node, so read-after-write lag is injected by `withLag`: the failure that hit the first
 * Base Sepolia run, where a load-balanced RPC served ownerOf/getAgentWallet from a node a block
 * behind the receipt.
 */
import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert";
import { expect } from "chai";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import hre from "hardhat";
import { getAddress, zeroAddress, type PublicClient, type WalletClient } from "viem";
import { SERVICES, agentUri, registerAgents, type Service } from "../scripts/register-agents";

const SERVICE_NAMES = Object.keys(SERVICES) as Service[];

let networkConn: Awaited<ReturnType<typeof hre.network.create>>;

describe("register-agents script", function () {
  before(async () => {
    networkConn = await hre.network.getOrCreate();
  });

  async function setup() {
    const [owner, other] = await networkConn.viem.getWalletClients();
    const publicClient = await networkConn.viem.getPublicClient();
    const registry = await networkConn.viem.deployContract("MockAgentRegistry");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "register-agents-"));
    const resultFile = path.join(dir, "result.json");
    const logs: string[] = [];
    const options = {
      publicClient: publicClient as PublicClient,
      walletClient: owner as WalletClient,
      registry: registry.address,
      chainId: await publicClient.getChainId(),
      expectedOwner: owner.account.address,
      network: "hardhat",
      resultFile,
      pollTries: 3,
      pollDelayMs: 1,
      log: (m: string) => logs.push(m),
    };
    return { owner, other, publicClient, registry, resultFile, logs, options };
  }

  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  const agentCount = () => ctx.registry.read.balanceOf([ctx.owner.account.address]);
  const readResultFile = () => JSON.parse(fs.readFileSync(ctx.resultFile, "utf8"));

  /** Wraps the clients so that, for `reads` read calls after every write, the node looks one block behind. */
  function withLag(reads: number) {
    let stale = 0;
    const publicClient = {
      ...ctx.options.publicClient,
      readContract: async (args: { functionName: string }) => {
        if (stale > 0) {
          stale--;
          if (args.functionName === "getAgentWallet") return zeroAddress;
          throw new Error("ERC721NonexistentToken");
        }
        return ctx.options.publicClient.readContract(args as never);
      },
    } as unknown as PublicClient;
    const walletClient = {
      ...ctx.options.walletClient,
      writeContract: async (args: never) => {
        const hash = await ctx.options.walletClient.writeContract(args);
        stale = reads;
        return hash;
      },
    } as unknown as WalletClient;
    return { ...ctx.options, publicClient, walletClient };
  }

  describe("dry run", () => {
    it("sends nothing and writes no result file", async () => {
      const result = await registerAgents({ ...ctx.options, execute: false });

      expect(result).to.deep.equal({ registered: [], cleared: [] });
      expect(await agentCount()).to.equal(0n);
      expect(fs.existsSync(ctx.resultFile)).to.equal(false);
      expect(ctx.logs.filter((l) => l.includes("would register"))).to.have.length(3);
    });

    it("does not clear the wallet of an already registered agent", async () => {
      await ctx.registry.write.register([agentUri("genimg")]);
      fs.writeFileSync(ctx.resultFile, JSON.stringify({ agents: { genimg: { agentId: "1", registerTx: "0x" } } }));

      const result = await registerAgents({ ...ctx.options, execute: false });

      expect(result.cleared).to.deep.equal([]);
      expect(getAddress(await ctx.registry.read.getAgentWallet([1n]))).to.equal(getAddress(ctx.owner.account.address));
      expect(ctx.logs).to.include("   would clear the default agentWallet");
    });
  });

  describe("execute", () => {
    it("registers the three services, owned by the signer, with the agentWallet cleared", async () => {
      const result = await registerAgents({ ...ctx.options, execute: true });

      expect(result.registered).to.deep.equal(SERVICE_NAMES);
      expect(result.cleared).to.deep.equal(SERVICE_NAMES);
      expect(await agentCount()).to.equal(3n);
      for (const [i, service] of SERVICE_NAMES.entries()) {
        const id = BigInt(i + 1);
        expect(getAddress(await ctx.registry.read.ownerOf([id]))).to.equal(getAddress(ctx.owner.account.address));
        expect(await ctx.registry.read.tokenURI([id])).to.equal(
          `${SERVICES[service]}/.well-known/agent-registration.json`,
        );
        expect(await ctx.registry.read.getAgentWallet([id])).to.equal(zeroAddress);
      }
    });

    it("records the agentIds in the result file", async () => {
      await registerAgents({ ...ctx.options, execute: true });

      const file = readResultFile();
      expect(file.network).to.equal("hardhat");
      expect(file.registry).to.equal(ctx.registry.address);
      expect(SERVICE_NAMES.map((s) => file.agents[s].agentId)).to.deep.equal(["1", "2", "3"]);
    });

    it("is a no-op when run again", async () => {
      await registerAgents({ ...ctx.options, execute: true });
      const second = await registerAgents({ ...ctx.options, execute: true });

      expect(second).to.deep.equal({ registered: [], cleared: [] });
      expect(await agentCount()).to.equal(3n);
    });

    it("registers only the services missing from the result file", async () => {
      await ctx.registry.write.register([agentUri("genimg")]);
      fs.writeFileSync(ctx.resultFile, JSON.stringify({ agents: { genimg: { agentId: "1", registerTx: "0x" } } }));

      const result = await registerAgents({ ...ctx.options, execute: true });

      expect(result.registered).to.deep.equal(["llm", "search"]);
      expect(result.cleared).to.deep.equal(SERVICE_NAMES);
      expect(await agentCount()).to.equal(3n);
    });

    it("still clears the wallet when the RPC serves reads from a node behind the receipt", async () => {
      const result = await registerAgents({ ...withLag(2), execute: true });

      expect(result.registered).to.deep.equal(SERVICE_NAMES);
      expect(result.cleared).to.deep.equal(SERVICE_NAMES);
      for (const id of [1n, 2n, 3n]) {
        expect(await ctx.registry.read.getAgentWallet([id])).to.equal(zeroAddress);
      }
    });
  });

  describe("refuses to send", () => {
    it("when the signer is not the expected owner", async () => {
      await assert.rejects(
        registerAgents({ ...ctx.options, expectedOwner: ctx.other.account.address, execute: true }),
        /Wrong signer/,
      );
      expect(await agentCount()).to.equal(0n);
    });

    it("on the wrong chain", async () => {
      await assert.rejects(registerAgents({ ...ctx.options, chainId: 8453, execute: true }), /Chain id/);
      expect(await agentCount()).to.equal(0n);
    });

    it("when there is no contract at the registry address", async () => {
      await assert.rejects(
        registerAgents({ ...ctx.options, registry: ctx.other.account.address, execute: true }),
        /No contract at/,
      );
    });
  });

  it("fails verification when the chain does not match the recorded agent", async () => {
    // agentId 1 exists but with a different URI than the one the script expects for genimg.
    await ctx.registry.write.register(["https://elsewhere.example/agent.json"]);
    fs.writeFileSync(ctx.resultFile, JSON.stringify({ agents: { genimg: { agentId: "1", registerTx: "0x" } } }));

    await assert.rejects(registerAgents({ ...ctx.options, execute: true }), /tokenURI: not as expected/);
  });
});
