declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE: string;
            DATABASE_NAME: string;
            HOST: string;
            PORT: number;
            USERNAME: string
            PASSWORD: string;
        }
    }
}

export { };
