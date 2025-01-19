type HttpRequest = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: { [key: string]: string };
    body?: any;
};


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