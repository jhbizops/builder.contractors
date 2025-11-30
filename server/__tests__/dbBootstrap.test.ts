import { describe, expect, it, vi } from "vitest";
import { bootstrapStatements, ensureDatabase } from "../dbBootstrap";

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

    expect(query).toHaveBeenCalledTimes(1 + bootstrapStatements.length);
    expect(query).toHaveBeenNthCalledWith(1, "select to_regclass($1) as oid", ["public.users"]);
    bootstrapStatements.forEach((statement, index) => {
      expect(query).toHaveBeenNthCalledWith(index + 2, statement);
    });
  });

  it("skips bootstrap when schema already exists", async () => {
    const query = vi
      .fn<Promise<{ rows: MockRow[] }>, [string, unknown[] | undefined]>()
      .mockResolvedValue({ rows: [{ oid: "users" }] });

    await ensureDatabase({ query });

    expect(query).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith("select to_regclass($1) as oid", ["public.users"]);
  });
});
