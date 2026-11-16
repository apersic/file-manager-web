import { describe, expect, test } from "vitest";
import { parseFolderId, parseNodeDetail } from "@/features/file-manager/node";

describe("parseFolderId", () => {
  test("accepts a canonical positive integer", () => {
    expect(parseFolderId("4")).toBe(4);
  });

  test.each([undefined, "", "0", "01", "-1", "1.5", "abc", "9007199254740993"])(
    "rejects %s",
    (value) => {
      expect(parseFolderId(value)).toBeNull();
    },
  );
});

describe("parseNodeDetail", () => {
  test("keeps the folder, its parent, and ancestors", () => {
    const detail = parseNodeDetail({
      id: 4,
      parentId: 1,
      kind: "FOLDER",
      name: "Designs",
      createdAt: "2026-11-16T12:00:00Z",
      updatedAt: "2026-11-16T12:00:00Z",
      ancestors: [{ id: 1, name: "Home", kind: "FOLDER" }],
    });

    expect(detail).toMatchObject({
      id: 4,
      parentId: 1,
      kind: "FOLDER",
      name: "Designs",
    });
    expect(detail.ancestors).toEqual([{ id: 1, name: "Home", kind: "FOLDER" }]);
  });

  test("rejects a body that is not a node", () => {
    expect(() => parseNodeDetail({ id: "nope" })).toThrow(/not valid/);
  });
});
