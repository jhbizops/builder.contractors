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

    await ensureDatabase({ query });

    expect(query).toHaveBeenCalledTimes(1 + bootstrapStatements.length + postBootstrapStatements.length);
    expect(query).toHaveBeenNthCalledWith(1, "select to_regclass($1) as oid", ["public.users"]);
    bootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(index + 2, statement);
    });
    postBootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(bootstrapStatements.length + index + 2, statement);
    });
  });

  it("skips bootstrap when schema already exists", async () => {
    const query = vi
      .fn<Promise<{ rows: MockRow[] }>, [string, unknown[] | undefined]>()
      .mockResolvedValue({ rows: [{ oid: "users" }] });

    await ensureDatabase({ query });

    expect(query).toHaveBeenCalledTimes(1 + postBootstrapStatements.length);
    expect(query).toHaveBeenNthCalledWith(1, "select to_regclass($1) as oid", ["public.users"]);
    postBootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(index + 2, statement);
    });
  });
});
