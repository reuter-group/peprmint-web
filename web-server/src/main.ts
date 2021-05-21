import path from "path";
import express, { Express, NextFunction, Request, Response } from "express";
import multer from "multer";
import bodyParser from "body-parser";

const fs = require("fs");
// import fs from "fs";

const app: Express = express();
const port = 7800;

// app.use(express.json()); // Parse JSON bodies (as sent by API clients)
// app.use(express.urlencoded()); // Parse URL-encoded bodies (as sent by HTML forms)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/",
  express.static(path.join(__dirname, "../../web-client/dist"))
);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })

app.use(function(inRequest: Request, inResponse: Response,
    inNext: NextFunction) {
      inResponse.header("Access-Control-Allow-Origin", "*");
      inResponse.header("Access-Control-Allow-Methods",
        "GET,POST,DELETE,OPTIONS"
      );
      inResponse.header("Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept"
    );
      inNext();
    });


// const rawInfo: string = fs.readFileSync(path.join(__dirname, "../upload/pdbInfo.json"));
// const pdbInfo = JSON.parse(rawInfo);

const upload = multer({ dest: './dist/uploads/' });


function isValidPDB(pdbFile:Express.Multer.File){
    const validFormat = pdbFile.originalname.endsWith(".ent") || 
                   pdbFile.originalname.endsWith(".pdb") ||
                   pdbFile.originalname.endsWith(".cif") ||
                   pdbFile.originalname.endsWith(".mcif") ;
    const validSize = pdbFile.size / 1024 / 1024 < 20;
    return validFormat && validSize ;
}

app.post('/uploadpdb', upload.single('pdbFile'), function (req, res) {
    const pdbfile = req.file
    console.log(pdbfile); 
    isValidPDB(pdbfile) ? res.sendStatus(200) : res.sendStatus(400) ; 
  })
   

app.post('/submitjob', upload.none(), function(req, res){
    console.log(req.body.pdbId );

    res.sendStatus(200);
    // console.log(req.get('name') );
    
});