export type HttpRequest = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: { [key: string]: string };
    body?: any;
};