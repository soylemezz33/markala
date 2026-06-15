import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StorageService } from "./storage.service";

function makeConfig(values: Record<string, string | undefined>) {
  return { get: (k: string) => values[k] } as never;
}

describe("StorageService", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "markala-uploads-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("R2 env yoksa local sürücü seçilir", () => {
    const svc = new StorageService(makeConfig({ UPLOAD_DIR: dir }));
    expect(svc.driver).toBe("local");
  });

  it("R2_ACCESS_KEY_ID tanımlıysa r2 sürücü seçilir", () => {
    const svc = new StorageService(
      makeConfig({ R2_ACCESS_KEY_ID: "key", UPLOAD_DIR: dir }),
    );
    expect(svc.driver).toBe("r2");
  });

  it("local sürücü dosyayı diske yazar ve mutlak public URL döner", async () => {
    const svc = new StorageService(
      makeConfig({ UPLOAD_DIR: dir, API_PUBLIC_URL: "http://localhost:4000" }),
    );
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic
    const res = await svc.put({ buffer, mimetype: "image/png" });

    expect(res.key).toMatch(/\.png$/);
    expect(res.url).toBe(`http://localhost:4000/uploads/${res.key}`);
    const written = await readFile(join(dir, res.key));
    expect(written.equals(buffer)).toBe(true);
  });

  it("API_PUBLIC_URL yoksa local URL çalışan PORT'u kullanır", async () => {
    const svc = new StorageService(makeConfig({ UPLOAD_DIR: dir, PORT: "4100" }));
    const res = await svc.put({
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      mimetype: "image/png",
    });
    expect(res.url).toBe(`http://localhost:4100/uploads/${res.key}`);
  });

  it("mimetype'a göre doğru uzantı seçilir (jpeg → jpg)", async () => {
    const svc = new StorageService(makeConfig({ UPLOAD_DIR: dir }));
    const res = await svc.put({
      buffer: Buffer.from([0xff, 0xd8]),
      mimetype: "image/jpeg",
    });
    expect(res.key).toMatch(/\.jpg$/);
  });

  it("izin verilmeyen mimetype reddedilir", async () => {
    const svc = new StorageService(makeConfig({ UPLOAD_DIR: dir }));
    await expect(
      svc.put({ buffer: Buffer.from([0x25, 0x50]), mimetype: "application/pdf" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("5MB üstü dosya reddedilir", async () => {
    const svc = new StorageService(makeConfig({ UPLOAD_DIR: dir }));
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    await expect(
      svc.put({ buffer: big, mimetype: "image/png" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
