import * as fs from 'fs';
import * as path from 'path';


export function writeDb(uri: string, data: any) {
    try {
        const asString = JSON.stringify(data, null, 2);
        console.log("[jsonDb.ts,8] asString: ", asString);
        let dir = path.dirname(uri);
        dir = dir.replace('file://', '');
        const dbFilePath = path.join(dir, 'db.json');
        console.log("[jsonDb.ts,10] dbFilePath: ", dbFilePath);
        fs.writeFileSync(dbFilePath, asString, { encoding: 'utf8', flag: 'w+' });
        // fs.writeFile(dbFilePath, asString, () => {});
    } catch (error) {
        console.error(error)
    }
}

