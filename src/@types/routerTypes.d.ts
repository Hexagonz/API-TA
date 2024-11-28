export interface Users {
    id?: string;
    username?: string,
    email: string;
    password: string;
    role?: string;
}

enum Roles {
    ADMIN = 'admin',
    DOSEN = 'dosen',
    MAHASISWA = 'mahasiswa',
}