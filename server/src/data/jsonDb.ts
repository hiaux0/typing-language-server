import * as fs from "fs";
import * as path from "path";
import { Uri } from "../types/types";

const dbName = "db.json";

export class JsonDb<T> {
  private dbPath: string | null = null;

  public getDbPath(): string {
    if (!this.dbPath) throw "no db path, call JsonDb::setDbPath(path)";
    return this.dbPath;
  }

  public setDbPath(uri: Uri) {
    let dir = path.dirname(uri);
    dir = dir.replace("file://", "");
    const dbFilePath = path.join(dir, dbName);
    this.dbPath = dbFilePath;
  }

  public readDb(): T | undefined {
    try {
      const dbPath = this.getDbPath();
      const raw = fs.readFileSync(dbPath, { encoding: "utf8" });
      const asJson = JSON.parse(raw);
      return asJson;
    } catch (error) {
      return;
    }
  }

  public writeDb(uri: Uri, data: any): void {
    try {
      const asString = JSON.stringify(data, null, 2);
      let dir = path.dirname(uri);
      dir = dir.replace("file://", "");
      const dbFilePath = path.join(dir, dbName);
      // console.log("[jsonDb.ts,35] dbFilePath: ", dbFilePath);
      // console.log("[jsonDb.ts,37] asString: ", asString);
      fs.writeFileSync(dbFilePath, asString, { encoding: "utf8", flag: "w+" });
    } catch (error) {
      console.error(error);
    }
  }
}
