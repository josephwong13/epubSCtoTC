const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const Opencc = require('opencc');
const inputFolder = './input';

async function convertFileFromInput() {
    try {
        const files = await promisifyReaddir(inputFolder);
        let outputPath = [];
        files.forEach(file => {
            console.log(path.extname(file));
            if(!(path.extname(file) === '.epub')) { return }
            const fileFullPath = `${inputFolder}/${file}`;
            const renameTo = fileFullPath.replace('.epub', '.zip');
            fs.rename(fileFullPath, renameTo, err => { if (err) throw (err) });
            outputPath.push(renameTo)
        });
        console.log(outputPath);
        return outputPath;
    } catch(e) {
        console.error(e);
        throw e;
    }
}

function promisifyReaddir(input) {
    return new Promise((resolve, reject) => {
        fs.readdir(input, (err, files) => {
            if(err) reject(err);
            resolve(files);
        })
    })
}

function promisifyWriteFile(path, input) {
    return new Promise ((resolve, reject) => {
        fs.writeFile(path, input, function(err) {
            if(err) { reject(err) }
            resolve(true);
        }); 
    })
}

function getOutputPath(fileFullPath) {
    let temp = fileFullPath.split('/');
    return temp[temp.length - 1].replace('.zip','');
}

async function main() {
    try {
        let fileNames = await convertFileFromInput();
        fileNames.forEach(fileName => {
            console.log(fileName);
            if(!fileName.includes('.zip')) {return}
            const outputPath = `./output/${getOutputPath(fileName)}`
            const zip = new AdmZip(fileName);
            // const extractTo = `${inputFolder}/temp`;
            // zip.extractAllTo(extractTo, true);

            const zipEntries = zip.getEntries();
            zipEntries.forEach(zipEntry => {
                if (zipEntry.entryName.includes('.xhtml')) {
                    // for (const key in zipEntry) { console.log(zipEntry[key]) }
                    const rawText = zipEntry.getData().toString('utf8');
                    const opencc = new Opencc();
                    const converted = opencc.convertSync(rawText);
                    // fs.createReadStream(zipEntry.entryName).pipe(fs.createWriteStream(`./output/${zipEntry.entryName}`));

                    const buffer = Buffer.from(converted, 'utf8');
                    promisifyWriteFile(`${outputPath}/${zipEntry.entryName}`,buffer)

                } else {
                    fs.createReadStream(zipEntry.entryName).pipe(fs.createWriteStream(`${outputPath}/${zipEntry.entryName}`));
                }
            });
        })

    } catch(e) {
        console.error(e);
    }
}



// path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.zip');
// consst zip = new AdmZip('./')
main();
// convertFileFromInput();