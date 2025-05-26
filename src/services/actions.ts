import { HttpRequest } from "@/types/actions.types";

const httpRequestsAction = async (params: HttpRequest) => {
    const result = fetch(params.url, {
        method: params.method,
        headers: params.headers,
        body: params.body ? JSON.stringify(params.body) : undefined,
    });
    return result;
}

export {
    httpRequestsAction
}