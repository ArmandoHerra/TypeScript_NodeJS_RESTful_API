import fs from "fs";
import http from "http";
import https from "https";
import { StringDecoder } from "string_decoder";
import url from "url";
import config from "./config";
import { LooseObject } from "./interfaces";

const httpServer = http.createServer((req: LooseObject, res: LooseObject) => {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
    console.log(
        `The server is listening on port ${config.httpPort} in ${
            config.envName
        } mode!`
    );
});

const httpsServerOptions: LooseObject = {
    cert: fs.readFileSync(__dirname + "/https/cert.pem"),
    key: fs.readFileSync(__dirname + "/https/key.pem")
};

const httpsServer = https.createServer(
    httpsServerOptions,
    (req: LooseObject, res: LooseObject) => {
        unifiedServer(req, res);
    }
);

httpsServer.listen(config.httpsPort, () => {
    console.log(
        `The server is listening on port ${config.httpsPort} in ${
            config.envName
        } mode!`
    );
});

const unifiedServer = (req: LooseObject, res: LooseObject): void => {
    const parsedURL = url.parse(req.url, true);
    const path: string = parsedURL.pathname || "";
    const trimmedPath: string = path.replace(/^\/+|\/+$/g, "");
    const queryStringObject: object = parsedURL.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;
    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", (data: Buffer) => {
        buffer += decoder.write(data);
    });

    req.on("end", () => {
        buffer += decoder.end();
        const chosenHandler =
            typeof router[trimmedPath] !== undefined
                ? router[trimmedPath]
                : handlers.notFound;

        const data: object = {
            headers: headers,
            method: method,
            payload: buffer,
            queryStringObject: queryStringObject,
            trimmedPath: trimmedPath
        };

        chosenHandler(data, (statusCode: number, payload: object) => {
            statusCode = typeof statusCode === "number" ? statusCode : 200;
            payload = typeof payload === "object" ? payload : {};
            const payloadString = JSON.stringify(payload);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
};

const handlers: LooseObject = {};

handlers.sample = (data: object, callback: any): void => {
    callback(406, {
        name: "sample-handler"
    });
};

handlers.notFound = (data: object, callback: any) => {
    callback(404);
};

const router: LooseObject = {
    sample: handlers.sample
};