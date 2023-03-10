const hti = require('node-html-to-image');
const { readFile } = require('fs/promises'); // too lazy to just use one require statement
const fs = require('fs');
const express = require("express");

require('dotenv').config();
const PORT = process.env.PORT;

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

