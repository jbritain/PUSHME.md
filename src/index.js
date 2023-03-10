const hti = require('node-html-to-image');
const { readFile } = require('fs/promises'); // too lazy to just use one require statement
const fs = require('fs');
const express = require("express");
const path = require('node:path');


require('dotenv').config();
const PORT = process.env.PORT;
const CACHE_CLEAR_INTERVAL = process.env.CACHE_CLEAR_INTERVAL|| 86400 // how often to clear cache (in seconds)
const CACHE_MAX_AGE = process.env.CACHE_MAX_AGE || 86400 // maximum age an image can be to survive a cache clear (in seconds)

// https://stackoverflow.com/a/44896916/12646131
function getFileAge(filePath){ // gets age of file in seconds
    var age = new Date().getTime() - fs.statSync(filePath).mtime
    console.log(age);
    return age;
}

// https://stackoverflow.com/a/59921560/12646131
function touch(filePath){ // 'touch' a file, setting the last modified time to the current time
    const now = new Date()
    try {
        fs.utimesSync(filePath, now, now);
    } catch (e) {
        fs.closeSync(fs.openSync(filePath, 'w'));
    }
}

function clearCache(){
    console.log("Clearing cache...")
    const cachePath = path.join(__dirname, "renderCache")
    files = fs.readdirSync(cachePath);

    for (const file of files){
        const filePath = path.join(cachePath, file);
        const fileAge = getFileAge(filePath);

        if (fileAge >= CACHE_MAX_AGE){
            console.log(`Deleted file ${filePath} - age is ${fileAge}`)
            fs.unlinkSync(filePath);
        } else {
            console.log(`Did not delete file ${filePath} - age is ${fileAge}`)
        }
    }
}

clearCache();

setInterval(clearCache, CACHE_CLEAR_INTERVAL * 1000)

var app = express();
app.use(express.static("./renderCache"))

app.get("/buttons/:style/:text", async (req, res) => {
    try {
        const style = req.params.style;
        const text = req.params.text;

        if (!["default", "primary", "outline", "danger"].includes(style)){
            res.status(404).send("Invalid button style")
        }

        try {
            if (fs.existsSync(`./renderCache/${style}-${text}.png`)){
                touch(`./renderCache/${style}-${text}.png`) // since the request was made again, touch the file to stop it being cleared on a cache purge
                res.sendFile(`renderCache/${style}-${text}.png`, { root: __dirname })
            }
        } catch(e) {
            
        }

        await readFile("./template.html", "utf8").then(template => {
            hti({
                output: `./renderCache/${style}-${text}.png`,
                html: template,
                content: {
                    buttonText: text,
                    buttonStyle: style
                },
                transparent: true
            }).then(() => {
                res.sendFile(`renderCache/${style}-${text}.png`, { root: __dirname })
            })
        });
        

    } catch(e) {
        console.error(e);
    }
})

app.listen(PORT || 8080, () => {
    console.log(`Listening at http://localhost:${PORT || 8080}`)
})

