/**
 * Storage: local (`Bun.file`/`Bun.write`) + adapter S3 (`Bun.s3`) — interface de adapter.
 */

/** Adapter de storage — `read`/`write`/`delete`/`exists`. */
export interface StorageAdapter {
  /** Arquivo ou `null` se não existe. */
  read(path: string): Promise<Blob | null>;

  /** Registra `data` — retorna bytes escritos. */
  write(path: string, data: Blob | string): Promise<number>;
  /** Deleta. */
  delete(path: string): Promise<void>;
  /** Existe? */
  exists(path: string): Promise<boolean>;
}

/** Local storage: disco via `Bun.file`/`Bun.write`. */
export class LocalStorage implements StorageAdapter {
  async read(path: string): Promise<Blob | null> {
    const file = Bun.file(path);
    return (await file.exists()) ? file : null;
  }

  async write(path: string, data: Blob | string): Promise<number> {
    return await Bun.write(path, data);
  }

  async delete(path: string): Promise<void> {
    await Bun.file(path).unlink();
  }

  async exists(path: string): Promise<boolean> {
    return await Bun.file(path).exists();
  }
}

/** S3 storage: via `Bun.s3` (credenciais por env vars). */
export class S3Storage implements StorageAdapter {
  async read(path: string): Promise<Blob | null> {
    if (!(await Bun.s3.exists(path))) return null;
    return Bun.s3.file(path);
  }

  async write(path: string, data: Blob | string): Promise<number> {
    return await Bun.write(Bun.s3.file(path), data);
  }

  async delete(path: string): Promise<void> {
    await Bun.s3.file(path).delete();
  }

  async exists(path: string): Promise<boolean> {
    return await Bun.s3.exists(path);
  }
}
