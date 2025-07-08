export interface Users {
    id?: string;
    username?: string,
    email: string;
    password: string;
    role?: string;
}

export interface UpdateData {
  waktu?: Date | string;
  progres?: Progres;
  hari?: Hari;
  status?: keterangan;
  keterangan?: string | null;
  gambar?: string | null;
}

enum Roles {
    ADMIN = 'admin',
    DOSEN = 'dosen',
    MAHASISWA = 'mahasiswa',
}


export interface UpdateDataForSiswa {
  progres: Progres; 
  uploaded_at : Date | string;
}