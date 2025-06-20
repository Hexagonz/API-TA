function getHariLokal(): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date());
}

function kapitalisasiHari(hari: string = getHariLokal()): string {
  return hari.charAt(0).toUpperCase() + hari.slice(1);
}


export default kapitalisasiHari;