import { w3cwebsocket as WS } from "websocket";

// Auth API

interface IAuth {
    organizationTeams: (id: string) => Promise<IOrganizationTeamsResponse>;
}

interface IOrganizationTeamsResponse {
    items: ITeam[];
}

interface ITeam {
    "ogit/_created-on": number;
    "ogit/_xid": string;
    "ogit/_organization": string;
    "ogit/name": string;
    "ogit/_modified-on": number;
    "ogit/_id": string;
    "ogit/_creator": string;
    "ogit/description": string;
    "ogit/_graphtype": string;
    "ogit/_owner": string;
    "ogit/_v-id": string;
    "ogit/_v": number;
    "ogit/_is-deleted": boolean;
    "ogit/_scope": string;
    "ogit/_type": string;
}

// HttpTransport

interface IRequestParams {
    type: string;
    headers?: object;
    body?: object;
}

declare class HttpTransport {
    endpoint: string;
    constructor(endpoint: string);
    fetch(
        token: string,
        url: string,
        options: object,
        reqOptions: object
    ): Promise<Response>;
    request(
        token: string,
        params?: IRequestParams,
        reqOptions?: object
    ): Promise<Response>;
    defaultFetchOptions(): {
        method: "GET";
        headers: {
            "Content-Type": "application/json";
            Accept: "application/json";
        };
        mode: "cors";
    };
}

// WebSocketTransport

type EmitFunctionType = (
    { name, data }: { name: string; data: object }
) => void;

declare class WebSocketTransport {
    endpoint: string;
    useLegacyProtocol: boolean;
    constructor(endpoint: string);
    request(
        token: string,
        params?: IRequestParams,
        reqOptions?: object
    ): Promise<WS>;
    connect(token: string, emit: EmitFunctionType): Promise<WS>;
    createWebSocket(initialToken: string, emit: EmitFunctionType): Promise<WS>;
    defaultFetchOptions(): {
        method: "GET";
        headers: {
            "Content-Type": "application/json";
            Accept: "application/json";
        };
        mode: "cors";
    };
}

// Client

interface IClientParams {
    endpoint: string;
    token: string;
}

export type IServletFetchType = typeof fetch;

export interface IServletMethods {
    [index: string]: (
        fetch: IServletFetchType,
        options?: object,
        data?: object
    ) => void;
}

declare class Client {
    endpoint: string;
    token: string;
    http: HttpTransport;
    transport: WebSocketTransport | HttpTransport;
    auth: IAuth;
    fetch: (
        url: string,
        options: object,
        reqOptions: object
    ) => Promise<Response>;

    constructor(params: IClientParams, transportOptions: object);
    me(): object;
    getToken(): string;
    addServlet(prefix: string, servletMethods: IServletMethods): Client;
}

export default Client;
