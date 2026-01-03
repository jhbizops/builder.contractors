import { describe, expect, it, vi } from "vitest";
import { bootstrapStatements, ensureDatabase, postBootstrapStatements } from "../dbBootstrap";

interface MockRow {
  oid: string | null;
}

describe("ensureDatabase", () => {
  it("creates schema when users table is missing", async () => {
    const query = vi
      .fn<Promise<{ rows: MockRow[] }>, [string, unknown[] | undefined]>()
      .mockResolvedValueOnce({ rows: [{ oid: null }] })
      .mockResolvedValue({ rows: [] });

    const tableCheckCount = bootstrapStatements.length;
    const bootstrapCallOffset = tableCheckCount + 1;
    const postBootstrapOffset = bootstrapCallOffset + bootstrapStatements.length;
    const expectedCalls = tableCheckCount + bootstrapStatements.length + postBootstrapStatements.length;

    await ensureDatabase({ query });

    expect(query).toHaveBeenCalledTimes(expectedCalls);
    expect(query).toHaveBeenNthCalledWith(1, "select to_regclass($1) as oid", ["public.users"]);
    bootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(bootstrapCallOffset + index, statement);
    });
    postBootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(postBootstrapOffset + index, statement);
    });
  });

  it("skips bootstrap when schema already exists", async () => {
    const query = vi
      .fn<Promise<{ rows: MockRow[] }>, [string, unknown[] | undefined]>() 
      .mockResolvedValue({ rows: [{ oid: "users" }] });

    const tableCheckCount = bootstrapStatements.length;
    const postBootstrapOffset = tableCheckCount + 1;
    const expectedCalls = tableCheckCount + postBootstrapStatements.length;

    await ensureDatabase({ query });

    expect(query).toHaveBeenCalledTimes(expectedCalls);
    expect(query).toHaveBeenNthCalledWith(1, "select to_regclass($1) as oid", ["public.users"]);
    postBootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(postBootstrapOffset + index, statement);
    });
  });
});
